'use server';

/**
 * Planning Engine — Moteur de génération de planning scolaire
 * Algorithme CSP (Constraint Satisfaction Problem) avec 3 types de sessions :
 *   - INTENSIVE_BLOCK : bloque N semaines complètes consécutives
 *   - WEEKLY_DAY      : 1 jour fixe par semaine pendant N semaines
 *   - CLASSIC         : créneaux standards de session_duration_h heures
 *
 * Ref: docs/features/09_module_gestion_planning — US24
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';

// ─── Types internes ────────────────────────────────────────────────────────────

interface TeacherDispo {
  day_of_week: number;   // 1=Lundi…5=Vendredi
  start_time: string;    // "08:00"
  end_time: string;      // "18:00"
}

interface SubjectReq {
  id: string;
  class_id: string;
  teacher_id: string;
  subject_name: string;
  total_hours_required: number;
  session_duration_h: number;
  session_type: 'INTENSIVE_BLOCK' | 'WEEKLY_DAY' | 'CLASSIC';
  duration_weeks: number | null;
  preferred_day: number | null;
  weekly_occurrences: number | null;
}

interface ClassCalendar {
  id: string;
  nom: string;
  calendar_mode: 'FULL_TIME' | 'FIXED_PATTERN' | 'MANUAL';
  pattern_school_weeks: number | null;
  pattern_company_weeks: number | null;
  pattern_reference_date: string | null;
}

interface ClosureRange {
  date_start: string;
  date_end: string;
}

interface SessionInsert {
  run_id: string;
  class_id: string;
  teacher_id: string;
  subject_name: string;
  start_timestamp: string;
  end_timestamp: string;
  status: 'DRAFT' | 'CONFLICT_ERROR';
  conflict_reason?: string;
  suggested_slot_start?: string;
  suggested_teacher_id?: string;
}

export interface EngineResult {
  run_id: string;
  total_placed: number;
  total_conflicts: number;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  class_nom: string;
  subject_name: string;
  teacher_name: string;
  reason: string;
  sessions_missing: number;
}

// ─── Utilitaires date ──────────────────────────────────────────────────────────

/** Retourne le lundi d'une date donnée */
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Retourne tous les lundis de l'année scolaire (sept Y → juil Y+1) */
function getSchoolYearMondays(year: number): Date[] {
  const mondays: Date[] = [];
  let d = new Date(year, 8, 1); // 1er septembre
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  const end = new Date(year + 1, 6, 31);
  while (d <= end) {
    mondays.push(new Date(d));
    d = new Date(d);
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

/** Formate une Date en ISO string local (sans TZ shift) */
function toISO(d: Date): string {
  return d.toISOString().replace('Z', '+00:00');
}

/** Ajoute des heures à une date */
function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3600 * 1000);
}

/** Ajoute des jours à une date */
function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** Vérifie si une date tombe dans une fermeture */
function isInClosure(date: Date, closures: ClosureRange[]): boolean {
  const d = date.toISOString().slice(0, 10);
  return closures.some((c) => d >= c.date_start && d <= c.date_end);
}

/** Vérifie si une semaine (lundi) est une semaine école selon le mode */
function isSchoolWeek(
  monday: Date,
  cls: ClassCalendar,
  manualWeeks: Map<string, 'SCHOOL' | 'COMPANY'>
): boolean {
  const mondayStr = monday.toISOString().slice(0, 10);

  if (cls.calendar_mode === 'FULL_TIME') return true;

  if (cls.calendar_mode === 'MANUAL') {
    const loc = manualWeeks.get(mondayStr);
    return loc === 'SCHOOL'; // non défini = pas école
  }

  // FIXED_PATTERN
  if (!cls.pattern_reference_date || !cls.pattern_school_weeks || !cls.pattern_company_weeks) {
    return true; // fallback si pattern mal configuré
  }
  const refMonday = getMonday(new Date(cls.pattern_reference_date));
  const diffWeeks = Math.round(
    (monday.getTime() - refMonday.getTime()) / (7 * 24 * 3600 * 1000)
  );
  const cycle = cls.pattern_school_weeks + cls.pattern_company_weeks;
  const posInCycle = ((diffWeeks % cycle) + cycle) % cycle;
  return posInCycle < cls.pattern_school_weeks;
}

// ─── Checks de conflit (via scheduled_sessions en mémoire + DB) ───────────────

interface BookedSlot {
  start: Date;
  end: Date;
}

function hasOverlap(a_start: Date, a_end: Date, slots: BookedSlot[]): boolean {
  return slots.some((s) => a_start < s.end && a_end > s.start);
}

// ─── Génération par type ───────────────────────────────────────────────────────

/**
 * INTENSIVE_BLOCK : trouve N semaines école consécutives sans conflit
 * et génère des sessions journée entière (8h-18h) pour chaque jour
 */
function placeIntensiveBlock(
  req: SubjectReq,
  schoolWeeks: Date[],
  closures: ClosureRange[],
  teacherDispos: TeacherDispo[],
  teacherBooked: BookedSlot[],
  classBooked: BookedSlot[],
  runId: string
): { sessions: SessionInsert[]; conflict?: string } {
  const durationWeeks = req.duration_weeks ?? 1;
  const sessions: SessionInsert[] = [];

  // Chercher N semaines consécutives disponibles
  for (let i = 0; i <= schoolWeeks.length - durationWeeks; i++) {
    const blockWeeks = schoolWeeks.slice(i, i + durationWeeks);

    // Vérifier que les semaines sont bien consécutives (pas de trou)
    let consecutive = true;
    for (let w = 0; w < blockWeeks.length - 1; w++) {
      const diff = (blockWeeks[w + 1].getTime() - blockWeeks[w].getTime()) / (7 * 24 * 3600 * 1000);
      if (diff !== 1) { consecutive = false; break; }
    }
    if (!consecutive) continue;

    // Générer les sessions potentielles (lun→ven de chaque semaine)
    const candidateSessions: SessionInsert[] = [];
    let blockFeasible = true;

    for (const monday of blockWeeks) {
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const day = addDays(monday, dayOffset);
        const dayOfWeek = dayOffset + 1; // 1=Lundi

        if (isInClosure(day, closures)) continue;

        // Trouver les dispos du prof ce jour
        const dispos = teacherDispos.filter((d) => d.day_of_week === dayOfWeek);
        if (dispos.length === 0) { blockFeasible = false; break; }

        for (const dispo of dispos) {
          const [sh, sm] = dispo.start_time.split(':').map(Number);
          const [eh, em] = dispo.end_time.split(':').map(Number);
          const start = new Date(day);
          start.setHours(sh, sm, 0, 0);
          const end = new Date(day);
          end.setHours(eh, em, 0, 0);

          if (hasOverlap(start, end, teacherBooked) || hasOverlap(start, end, classBooked)) {
            blockFeasible = false;
            break;
          }

          candidateSessions.push({
            run_id: runId,
            class_id: req.class_id,
            teacher_id: req.teacher_id,
            subject_name: req.subject_name,
            start_timestamp: toISO(start),
            end_timestamp: toISO(end),
            status: 'DRAFT',
          });
        }
        if (!blockFeasible) break;
      }
      if (!blockFeasible) break;
    }

    if (blockFeasible && candidateSessions.length > 0) {
      // Valider : marquer ces créneaux comme réservés
      for (const s of candidateSessions) {
        teacherBooked.push({ start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) });
        classBooked.push({ start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) });
      }
      sessions.push(...candidateSessions);
      return { sessions };
    }
  }

  return {
    sessions: [{
      run_id: runId,
      class_id: req.class_id,
      teacher_id: req.teacher_id,
      subject_name: req.subject_name,
      start_timestamp: toISO(schoolWeeks[0] ?? new Date()),
      end_timestamp: toISO(addHours(schoolWeeks[0] ?? new Date(), 8)),
      status: 'CONFLICT_ERROR',
      conflict_reason: `Impossible de trouver ${durationWeeks} semaine(s) consécutive(s) libre(s) pour ce bloc intensif.`,
    }],
    conflict: `${durationWeeks} semaine(s) consécutive(s) introuvable(s)`,
  };
}

/**
 * WEEKLY_DAY : place 1 session sur le jour préféré de chaque semaine école
 */
function placeWeeklyDay(
  req: SubjectReq,
  schoolWeeks: Date[],
  closures: ClosureRange[],
  teacherDispos: TeacherDispo[],
  teacherBooked: BookedSlot[],
  classBooked: BookedSlot[],
  runId: string
): { sessions: SessionInsert[]; sessionsPlaced: number; sessionsNeeded: number } {
  const targetOccurrences = req.weekly_occurrences ?? Math.ceil(req.total_hours_required / req.session_duration_h);
  const preferredDay = req.preferred_day ?? 1;
  const sessions: SessionInsert[] = [];
  let placed = 0;

  for (const monday of schoolWeeks) {
    if (placed >= targetOccurrences) break;

    const day = addDays(monday, preferredDay - 1); // preferredDay 1=Lundi
    if (isInClosure(day, closures)) continue;

    const dispos = teacherDispos.filter((d) => d.day_of_week === preferredDay);
    let sessionPlaced = false;

    for (const dispo of dispos) {
      const [sh, sm] = dispo.start_time.split(':').map(Number);
      const [eh, em] = dispo.end_time.split(':').map(Number);
      const dispoStart = new Date(day);
      dispoStart.setHours(sh, sm, 0, 0);
      const dispoEnd = new Date(day);
      dispoEnd.setHours(eh, em, 0, 0);

      // Chercher un créneau dans la dispo du prof
      let slotStart = new Date(dispoStart);
      while (addHours(slotStart, req.session_duration_h) <= dispoEnd) {
        const slotEnd = addHours(slotStart, req.session_duration_h);
        if (!hasOverlap(slotStart, slotEnd, teacherBooked) && !hasOverlap(slotStart, slotEnd, classBooked)) {
          teacherBooked.push({ start: slotStart, end: slotEnd });
          classBooked.push({ start: slotStart, end: slotEnd });
          sessions.push({
            run_id: runId,
            class_id: req.class_id,
            teacher_id: req.teacher_id,
            subject_name: req.subject_name,
            start_timestamp: toISO(slotStart),
            end_timestamp: toISO(slotEnd),
            status: 'DRAFT',
          });
          placed++;
          sessionPlaced = true;
          break;
        }
        slotStart = addHours(slotStart, 0.5); // essayer 30 min plus tard
      }
      if (sessionPlaced) break;
    }

    if (!sessionPlaced) {
      // Essayer les autres jours comme fallback
      for (let altDay = 1; altDay <= 5; altDay++) {
        if (altDay === preferredDay) continue;
        const altDate = addDays(monday, altDay - 1);
        if (isInClosure(altDate, closures)) continue;
        const altDispos = teacherDispos.filter((d) => d.day_of_week === altDay);
        for (const dispo of altDispos) {
          const [sh, sm] = dispo.start_time.split(':').map(Number);
          const altStart = new Date(altDate);
          altStart.setHours(sh, sm, 0, 0);
          const altEnd = addHours(altStart, req.session_duration_h);
          const [eh, em] = dispo.end_time.split(':').map(Number);
          const dispoEnd = new Date(altDate);
          dispoEnd.setHours(eh, em, 0, 0);
          if (altEnd <= dispoEnd && !hasOverlap(altStart, altEnd, teacherBooked) && !hasOverlap(altStart, altEnd, classBooked)) {
            teacherBooked.push({ start: altStart, end: altEnd });
            classBooked.push({ start: altStart, end: altEnd });
            sessions.push({
              run_id: runId,
              class_id: req.class_id,
              teacher_id: req.teacher_id,
              subject_name: req.subject_name,
              start_timestamp: toISO(altStart),
              end_timestamp: toISO(altEnd),
              status: 'DRAFT',
            });
            placed++;
            sessionPlaced = true;
            break;
          }
        }
        if (sessionPlaced) break;
      }
    }
  }

  // Sessions manquantes → CONFLICT_ERROR
  const missing = targetOccurrences - placed;
  if (missing > 0) {
    sessions.push({
      run_id: runId,
      class_id: req.class_id,
      teacher_id: req.teacher_id,
      subject_name: req.subject_name,
      start_timestamp: toISO(new Date()),
      end_timestamp: toISO(addHours(new Date(), req.session_duration_h)),
      status: 'CONFLICT_ERROR',
      conflict_reason: `${missing} occurrence(s) manquante(s) sur ${targetOccurrences} pour "${req.subject_name}". Jour préféré : ${['Lun','Mar','Mer','Jeu','Ven'][preferredDay - 1]}, aucun créneau trouvé.`,
    });
  }

  return { sessions, sessionsPlaced: placed, sessionsNeeded: targetOccurrences };
}

/**
 * CLASSIC : remplit les créneaux disponibles de manière greedy
 */
function placeClassic(
  req: SubjectReq,
  schoolWeeks: Date[],
  closures: ClosureRange[],
  teacherDispos: TeacherDispo[],
  teacherBooked: BookedSlot[],
  classBooked: BookedSlot[],
  runId: string
): { sessions: SessionInsert[]; sessionsPlaced: number; sessionsNeeded: number } {
  const sessionsNeeded = Math.ceil(req.total_hours_required / req.session_duration_h);
  const sessions: SessionInsert[] = [];
  let placed = 0;

  outer:
  for (const monday of schoolWeeks) {
    if (placed >= sessionsNeeded) break;

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      if (placed >= sessionsNeeded) break outer;
      const dayOfWeek = dayOffset + 1;
      const day = addDays(monday, dayOffset);
      if (isInClosure(day, closures)) continue;

      const dispos = teacherDispos.filter((d) => d.day_of_week === dayOfWeek);
      for (const dispo of dispos) {
        if (placed >= sessionsNeeded) break outer;
        const [sh, sm] = dispo.start_time.split(':').map(Number);
        const [eh, em] = dispo.end_time.split(':').map(Number);
        const dispoEnd = new Date(day);
        dispoEnd.setHours(eh, em, 0, 0);

        let slotStart = new Date(day);
        slotStart.setHours(sh, sm, 0, 0);

        while (placed < sessionsNeeded) {
          const slotEnd = addHours(slotStart, req.session_duration_h);
          if (slotEnd > dispoEnd) break;

          if (!hasOverlap(slotStart, slotEnd, teacherBooked) && !hasOverlap(slotStart, slotEnd, classBooked)) {
            teacherBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
            classBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
            sessions.push({
              run_id: runId,
              class_id: req.class_id,
              teacher_id: req.teacher_id,
              subject_name: req.subject_name,
              start_timestamp: toISO(slotStart),
              end_timestamp: toISO(slotEnd),
              status: 'DRAFT',
            });
            placed++;
            slotStart = addHours(slotEnd, 0); // suivant immédiat
          } else {
            slotStart = addHours(slotStart, 0.5); // essayer 30 min après
          }
        }
      }
    }
  }

  const missing = sessionsNeeded - placed;
  if (missing > 0) {
    sessions.push({
      run_id: runId,
      class_id: req.class_id,
      teacher_id: req.teacher_id,
      subject_name: req.subject_name,
      start_timestamp: toISO(new Date()),
      end_timestamp: toISO(addHours(new Date(), req.session_duration_h)),
      status: 'CONFLICT_ERROR',
      conflict_reason: `${missing} session(s) sur ${sessionsNeeded} impossible(s) à placer pour "${req.subject_name}" (${req.total_hours_required}h totales, séances de ${req.session_duration_h}h). Vérifiez les disponibilités du professeur.`,
    });
  }

  return { sessions, sessionsPlaced: placed, sessionsNeeded };
}

// ─── Moteur principal ─────────────────────────────────────────────────────────

export async function generatePlanning(
  classIds: string[],
  label: string,
  isGapFill = false,
  existingRunId?: string
): Promise<EngineResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé.');

  const admin = createAdminClient();
  const currentYear = new Date().getFullYear();
  const startYear = new Date().getMonth() >= 8 ? currentYear : currentYear - 1;
  const allMondays = getSchoolYearMondays(startYear);

  // ── Charger toutes les données nécessaires ──────────────────────────────────

  const [
    { data: classesData },
    { data: manualWeeksData },
    { data: closuresData },
    { data: availsData },
    { data: reqsData },
  ] = await Promise.all([
    admin.from('classes')
      .select('id, nom, calendar_mode, pattern_school_weeks, pattern_company_weeks, pattern_reference_date')
      .in('id', classIds),
    admin.from('school_calendar').select('*').in('class_id', classIds),
    admin.from('school_closures').select('date_start, date_end'),
    admin.from('teacher_availabilities').select('*'),
    admin.from('subject_requirements')
      .select('*')
      .in('class_id', classIds),
  ]);

  const classes = (classesData ?? []) as ClassCalendar[];
  const closures = (closuresData ?? []) as ClosureRange[];
  const allAvails = (availsData ?? []) as (TeacherDispo & { teacher_id: string })[];
  const allReqs = (reqsData ?? []) as SubjectReq[];

  // Map : class_id → semaines manuelles
  const manualByClass = new Map<string, Map<string, 'SCHOOL' | 'COMPANY'>>();
  for (const w of manualWeeksData ?? []) {
    if (!manualByClass.has(w.class_id)) manualByClass.set(w.class_id, new Map());
    manualByClass.get(w.class_id)!.set(w.week_start, w.location);
  }

  // Pour gap fill : charger les heures déjà planifiées
  const existingHoursByReq = new Map<string, number>();
  if (isGapFill && existingRunId) {
    const { data: existingSessions } = await admin
      .from('scheduled_sessions')
      .select('class_id, teacher_id, subject_name, start_timestamp, end_timestamp')
      .eq('run_id', existingRunId)
      .eq('status', 'VALIDATED');

    for (const s of existingSessions ?? []) {
      const key = `${s.class_id}__${s.teacher_id}__${s.subject_name}`;
      const hours = (new Date(s.end_timestamp).getTime() - new Date(s.start_timestamp).getTime()) / 3600000;
      existingHoursByReq.set(key, (existingHoursByReq.get(key) ?? 0) + hours);
    }
  }

  // ── Créer le run ────────────────────────────────────────────────────────────

  const { data: runData } = await admin
    .from('planning_runs')
    .insert({ label, class_ids: classIds, is_gap_fill: isGapFill, status: 'DRAFT' })
    .select('id')
    .single();

  if (!runData) throw new Error('Impossible de créer le planning run.');
  const runId = runData.id;

  // ── Mémoire partagée des créneaux réservés (par teacher_id et class_id) ─────
  const teacherBookedMap = new Map<string, BookedSlot[]>();
  const classBookedMap   = new Map<string, BookedSlot[]>();

  // Pré-charger les sessions existantes dans la mémoire (tous runs confondus pour les profs)
  const { data: existingAll } = await admin
    .from('scheduled_sessions')
    .select('teacher_id, class_id, start_timestamp, end_timestamp')
    .eq('status', 'VALIDATED');

  for (const s of existingAll ?? []) {
    const slot = { start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) };
    if (!teacherBookedMap.has(s.teacher_id)) teacherBookedMap.set(s.teacher_id, []);
    teacherBookedMap.get(s.teacher_id)!.push(slot);
    if (!classBookedMap.has(s.class_id)) classBookedMap.set(s.class_id, []);
    classBookedMap.get(s.class_id)!.push(slot);
  }

  // ── Génération par classe et par matière ────────────────────────────────────

  const allSessions: SessionInsert[] = [];
  const conflicts: ConflictDetail[] = [];

  // Ordre de priorité : INTENSIVE_BLOCK en premier (ils bloquent des semaines entières)
  const TYPE_ORDER: SubjectReq['session_type'][] = ['INTENSIVE_BLOCK', 'WEEKLY_DAY', 'CLASSIC'];

  for (const cls of classes) {
    const manualWeeks = manualByClass.get(cls.id) ?? new Map<string, 'SCHOOL' | 'COMPANY'>();

    // Semaines école pour cette classe
    const schoolWeeks = allMondays.filter(
      (m) => isSchoolWeek(m, cls, manualWeeks) && !isInClosure(m, closures)
    );

    const classReqs = allReqs
      .filter((r) => r.class_id === cls.id)
      .sort((a, b) => TYPE_ORDER.indexOf(a.session_type) - TYPE_ORDER.indexOf(b.session_type));

    if (!teacherBookedMap.has('__init')) {
      teacherBookedMap.set('__init', []);
    }

    for (const req of classReqs) {
      // Gap fill : calculer les heures restantes
      let effectiveReq = req;
      if (isGapFill) {
        const key = `${req.class_id}__${req.teacher_id}__${req.subject_name}`;
        const doneHours = existingHoursByReq.get(key) ?? 0;
        const remaining = req.total_hours_required - doneHours;
        if (remaining <= 0) continue; // déjà complet
        effectiveReq = { ...req, total_hours_required: remaining };
      }

      const teacherDispos = allAvails.filter((a) => a.teacher_id === req.teacher_id);
      if (!teacherBookedMap.has(req.teacher_id)) teacherBookedMap.set(req.teacher_id, []);
      if (!classBookedMap.has(req.class_id))     classBookedMap.set(req.class_id, []);

      const tBooked = teacherBookedMap.get(req.teacher_id)!;
      const cBooked = classBookedMap.get(req.class_id)!;

      let result: { sessions: SessionInsert[]; conflict?: string; sessionsPlaced?: number; sessionsNeeded?: number };

      if (effectiveReq.session_type === 'INTENSIVE_BLOCK') {
        result = placeIntensiveBlock(effectiveReq, schoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else if (effectiveReq.session_type === 'WEEKLY_DAY') {
        result = placeWeeklyDay(effectiveReq, schoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else {
        result = placeClassic(effectiveReq, schoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      }

      allSessions.push(...result.sessions);

      if (result.conflict || result.sessions.some((s) => s.status === 'CONFLICT_ERROR')) {
        const conflictSessions = result.sessions.filter((s) => s.status === 'CONFLICT_ERROR');
        conflicts.push({
          class_nom: cls.nom,
          subject_name: req.subject_name,
          teacher_name: req.teacher_id, // remplacé par le nom après
          reason: conflictSessions[0]?.conflict_reason ?? 'Conflit inconnu',
          sessions_missing: conflictSessions.length,
        });
      }
    }
  }

  // ── Insérer toutes les sessions en batch ────────────────────────────────────

  const BATCH_SIZE = 100;
  for (let i = 0; i < allSessions.length; i += BATCH_SIZE) {
    const batch = allSessions.slice(i, i + BATCH_SIZE);
    await admin.from('scheduled_sessions').insert(batch);
  }

  // ── Mettre à jour le run avec les stats ─────────────────────────────────────

  const totalPlaced  = allSessions.filter((s) => s.status === 'DRAFT').length;
  const totalConflicts = allSessions.filter((s) => s.status === 'CONFLICT_ERROR').length;

  await admin.from('planning_runs').update({
    total_sessions: totalPlaced,
    conflict_count: totalConflicts,
  }).eq('id', runId);

  return {
    run_id: runId,
    total_placed: totalPlaced,
    total_conflicts: totalConflicts,
    conflicts,
  };
}

// ─── Publication d'un run ──────────────────────────────────────────────────────

export async function publishPlanningRun(runId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Accès refusé.' };

  const admin = createAdminClient();

  // Archiver les anciens runs validés des mêmes classes
  const { data: run } = await admin.from('planning_runs').select('class_ids').eq('id', runId).single();
  if (!run) return { error: 'Run introuvable.' };

  // Les runs VALIDATED existants pour ces classes passent en ARCHIVED
  const { data: oldRuns } = await admin
    .from('planning_runs')
    .select('id')
    .eq('status', 'VALIDATED')
    .overlaps('class_ids', run.class_ids);

  if (oldRuns && oldRuns.length > 0) {
    await admin.from('planning_runs')
      .update({ status: 'ARCHIVED' })
      .in('id', oldRuns.map((r: { id: string }) => r.id));
  }

  const { error } = await admin
    .from('planning_runs')
    .update({ status: 'VALIDATED' })
    .eq('id', runId);

  if (error) return { error: error.message };

  // Publier aussi toutes les sessions DRAFT (pas les CONFLICT_ERROR)
  await admin
    .from('scheduled_sessions')
    .update({ status: 'VALIDATED' })
    .eq('run_id', runId)
    .eq('status', 'DRAFT');

  return {};
}

// ─── Lister les runs ──────────────────────────────────────────────────────────

export async function getPlanningRuns() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from('planning_runs')
    .select('*')
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function deletePlanningRun(runId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Accès refusé.' };

  const admin = createAdminClient();
  const { data: run } = await admin.from('planning_runs').select('status').eq('id', runId).single();
  if (run?.status === 'VALIDATED') return { error: 'Impossible de supprimer un planning publié.' };

  const { error } = await admin.from('planning_runs').delete().eq('id', runId);
  if (error) return { error: error.message };
  return {};
}
