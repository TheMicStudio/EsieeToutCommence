'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';

// ─── Types internes ────────────────────────────────────────────────────────────

interface TeacherDispo {
  day_of_week: number;
  start_time: string;
  end_time: string;
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

// ─── Toutes les fonctions date travaillent en UTC ──────────────────────────────
// Le serveur peut être en fuseau non-UTC (WSL2 hérite de Windows).
// new Date(year, month, day) crée minuit LOCAL → toISOString() donne la veille en UTC+X.
// On utilise Date.UTC() + getUTC* partout pour garantir la cohérence avec la DB.

function toUTCDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getSchoolYearMondays(year: number): Date[] {
  const mondays: Date[] = [];
  let d = new Date(Date.UTC(year, 8, 1)); // 1er septembre UTC
  while (d.getUTCDay() !== 1) d = new Date(d.getTime() + 86400000);
  const end = new Date(Date.UTC(year + 1, 6, 31));
  while (d <= end) {
    mondays.push(new Date(d));
    d = new Date(d.getTime() + 7 * 86400000);
  }
  return mondays;
}

function toISO(d: Date): string {
  return d.toISOString().replace('Z', '+00:00');
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3600 * 1000);
}

function addDays(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function isInClosure(date: Date, closures: ClosureRange[]): boolean {
  const d = toUTCDateStr(date);
  return closures.some((c) => d >= c.date_start && d <= c.date_end);
}

/**
 * Retourne true si la semaine (lundi) est une semaine d'école.
 *
 * Fix important : MANUAL mode avec calendrier vide → traité comme FULL_TIME
 * (les classes importées par CSV ont MANUAL par défaut sans semaines configurées)
 */
function isSchoolWeek(
  monday: Date,
  cls: ClassCalendar,
  manualWeeks: Map<string, 'SCHOOL' | 'COMPANY'>
): boolean {
  if (cls.calendar_mode === 'FULL_TIME') return true;

  if (cls.calendar_mode === 'MANUAL') {
    // Si aucune semaine configurée → fallback FULL_TIME
    if (manualWeeks.size === 0) return true;
    // Si des semaines existent mais aucune n'est 'SCHOOL' → fallback FULL_TIME
    const hasAnySchoolWeek = [...manualWeeks.values()].some((v) => v === 'SCHOOL');
    if (!hasAnySchoolWeek) return true;
    return manualWeeks.get(toUTCDateStr(monday)) === 'SCHOOL';
  }

  // FIXED_PATTERN
  if (!cls.pattern_reference_date || !cls.pattern_school_weeks || !cls.pattern_company_weeks) {
    return true; // mal configuré → full time
  }
  const refDate = new Date(cls.pattern_reference_date);
  const refDay = refDate.getUTCDay();
  const refDiff = refDay === 0 ? -6 : 1 - refDay;
  const refMonday = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate() + refDiff));
  const diffWeeks = Math.round(
    (monday.getTime() - refMonday.getTime()) / (7 * 24 * 3600 * 1000)
  );
  const cycle = cls.pattern_school_weeks + cls.pattern_company_weeks;
  const posInCycle = ((diffWeeks % cycle) + cycle) % cycle;
  return posInCycle < cls.pattern_school_weeks;
}

// ─── Slots réservés ────────────────────────────────────────────────────────────

interface BookedSlot { start: Date; end: Date; }

function hasOverlap(a_start: Date, a_end: Date, slots: BookedSlot[]): boolean {
  return slots.some((s) => a_start < s.end && a_end > s.start);
}

// ─── Résolution des créneaux horaires du prof ──────────────────────────────────

/**
 * Retourne les créneaux disponibles pour un jour donné.
 * Fallback 8h-18h si le prof n'a aucun créneau horaire configuré.
 */
function getDayDispos(teacherDispos: TeacherDispo[], dayOfWeek: number): TeacherDispo[] {
  const specific = teacherDispos.filter((d) => d.day_of_week === dayOfWeek);
  if (specific.length > 0) return specific;
  // Fallback : journée complète si le prof n'a pas de contrainte horaire ce jour
  return [{ day_of_week: dayOfWeek, start_time: '08:00', end_time: '18:00' }];
}

// ─── INTENSIVE_BLOCK ──────────────────────────────────────────────────────────

/**
 * Cherche N semaines d'école consécutives (dans le tableau schoolWeeks)
 * où le prof et la classe sont libres, puis place des sessions journée complète.
 *
 * "Consécutives" = consécutives dans le tableau des semaines d'école
 * (les semaines de fermeture ne comptent pas, elles ne sont pas dans le tableau).
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
  const durationWeeks = Math.max(1, req.duration_weeks ?? 1);

  if (schoolWeeks.length === 0) {
    return {
      sessions: [conflictSession(req, runId, 'Aucune semaine d\'école disponible pour cette classe. Vérifiez la configuration du calendrier.')],
      conflict: 'Pas de semaines d\'école',
    };
  }

  if (schoolWeeks.length < durationWeeks) {
    return {
      sessions: [conflictSession(req, runId,
        `Seulement ${schoolWeeks.length} semaine(s) d'école disponible(s) mais ${durationWeeks} requise(s) pour ce bloc.`)],
      conflict: `Semaines insuffisantes (${schoolWeeks.length}/${durationWeeks})`,
    };
  }

  // Parcourir toutes les positions possibles dans le tableau des semaines d'école
  for (let i = 0; i <= schoolWeeks.length - durationWeeks; i++) {
    const blockWeeks = schoolWeeks.slice(i, i + durationWeeks);
    const candidateSessions: SessionInsert[] = [];
    let blockFeasible = true;

    for (const monday of blockWeeks) {
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const day = addDays(monday, dayOffset);
        const dayOfWeek = dayOffset + 1;

        // Jour fermé → on saute (pas un problème pour le bloc)
        if (isInClosure(day, closures)) continue;

        const dispos = getDayDispos(teacherDispos, dayOfWeek);

        let dayPlaced = false;
        for (const dispo of dispos) {
          const [sh, sm] = dispo.start_time.split(':').map(Number);
          const [eh, em] = dispo.end_time.split(':').map(Number);
          const start = new Date(day);
          start.setUTCHours(sh, sm, 0, 0);
          const end = new Date(day);
          end.setUTCHours(eh, em, 0, 0);

          if (hasOverlap(start, end, teacherBooked) || hasOverlap(start, end, classBooked)) continue;

          candidateSessions.push({
            run_id: runId, class_id: req.class_id, teacher_id: req.teacher_id,
            subject_name: req.subject_name, start_timestamp: toISO(start), end_timestamp: toISO(end),
            status: 'DRAFT',
          });
          dayPlaced = true;
          break;
        }

        if (!dayPlaced) {
          // Prof non dispo ce jour spécifique de ce bloc → essayer un autre bloc
          blockFeasible = false;
          break;
        }
      }
      if (!blockFeasible) break;
    }

    if (blockFeasible && candidateSessions.length > 0) {
      for (const s of candidateSessions) {
        teacherBooked.push({ start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) });
        classBooked.push({ start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) });
      }
      return { sessions: candidateSessions };
    }
  }

  return {
    sessions: [conflictSession(req, runId,
      `Impossible de placer le bloc de ${durationWeeks} semaine(s) pour "${req.subject_name}". ` +
      `${schoolWeeks.length} semaine(s) disponible(s) mais le prof a des conflits sur toutes les positions.`)],
    conflict: `Bloc ${durationWeeks}sem introuvable`,
  };
}

// ─── WEEKLY_DAY ───────────────────────────────────────────────────────────────

function placeWeeklyDay(
  req: SubjectReq,
  schoolWeeks: Date[],
  closures: ClosureRange[],
  teacherDispos: TeacherDispo[],
  teacherBooked: BookedSlot[],
  classBooked: BookedSlot[],
  runId: string
): { sessions: SessionInsert[]; sessionsPlaced: number; sessionsNeeded: number } {
  const targetOccurrences = req.weekly_occurrences ?? Math.max(1, Math.ceil(req.total_hours_required / req.session_duration_h));
  const preferredDay = req.preferred_day ?? 1;
  const sessions: SessionInsert[] = [];
  let placed = 0;

  if (schoolWeeks.length === 0) {
    return {
      sessions: [conflictSession(req, runId, 'Aucune semaine d\'école disponible pour cette classe.')],
      sessionsPlaced: 0, sessionsNeeded: targetOccurrences,
    };
  }

  for (const monday of schoolWeeks) {
    if (placed >= targetOccurrences) break;

    // Essayer d'abord le jour préféré, puis les autres jours en fallback
    const dayOrder = [
      preferredDay,
      ...([1, 2, 3, 4, 5].filter((d) => d !== preferredDay)),
    ];

    let placedThisWeek = false;
    for (const dayNum of dayOrder) {
      if (placed >= targetOccurrences || placedThisWeek) break;
      const day = addDays(monday, dayNum - 1);
      if (isInClosure(day, closures)) continue;

      const dispos = getDayDispos(teacherDispos, dayNum);

      for (const dispo of dispos) {
        if (placed >= targetOccurrences || placedThisWeek) break;
        const [sh, sm] = dispo.start_time.split(':').map(Number);
        const [eh, em] = dispo.end_time.split(':').map(Number);
        const dispoEnd = new Date(day); dispoEnd.setUTCHours(eh, em, 0, 0);

        let slotStart = new Date(day); slotStart.setUTCHours(sh, sm, 0, 0);

        while (slotStart.getTime() + req.session_duration_h * 3600000 <= dispoEnd.getTime()) {
          const slotEnd = addHours(slotStart, req.session_duration_h);
          if (!hasOverlap(slotStart, slotEnd, teacherBooked) && !hasOverlap(slotStart, slotEnd, classBooked)) {
            teacherBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
            classBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
            sessions.push({
              run_id: runId, class_id: req.class_id, teacher_id: req.teacher_id,
              subject_name: req.subject_name, start_timestamp: toISO(slotStart), end_timestamp: toISO(slotEnd),
              status: 'DRAFT',
            });
            placed++;
            placedThisWeek = true;
            break;
          }
          slotStart = new Date(slotStart.getTime() + 30 * 60000); // +30 min
        }
      }
    }
  }

  const missing = targetOccurrences - placed;
  if (missing > 0) {
    sessions.push(conflictSession(req, runId,
      `${missing} occurrence(s) manquante(s) sur ${targetOccurrences} pour "${req.subject_name}" ` +
      `(${placed} placée(s)). Vérifiez que le prof a assez de créneaux libres.`));
  }

  return { sessions, sessionsPlaced: placed, sessionsNeeded: targetOccurrences };
}

// ─── CLASSIC ──────────────────────────────────────────────────────────────────

/**
 * Place les sessions en mode CLASSIC.
 *
 * Règle FULL_TIME "packing" :
 *   Pour les classes en temps plein, on limite le nombre de sessions placées par
 *   semaine à `maxPerWeek` (calculé à partir du rapport sessions/semaines).
 *   Cela évite de front-loader toutes les sessions en semaine 1-2 et d'avoir
 *   ensuite un trou de plusieurs semaines : les sessions sont réparties une (ou
 *   quelques-unes) par semaine sur toute l'année, en continu.
 *
 *   Exemple : 10 séances sur 40 semaines → maxPerWeek = 1 → sessions en sem 1-10
 *   sans aucun trou.  Si le prof est bloqué sem 3, on passe en sem 4 (1 semaine
 *   de trou max au lieu de potentiellement 5-6).
 *
 *   Un second passage ("backfill") place les sessions restantes sans limite si
 *   le premier passage n'a pas suffi à cause de conflits.
 */
function placeClassic(
  req: SubjectReq,
  schoolWeeks: Date[],
  closures: ClosureRange[],
  teacherDispos: TeacherDispo[],
  teacherBooked: BookedSlot[],
  classBooked: BookedSlot[],
  runId: string,
  maxPerWeek?: number,  // undefined = pas de limite (comportement original)
): { sessions: SessionInsert[]; sessionsPlaced: number; sessionsNeeded: number } {
  const sessionsNeeded = Math.max(1, Math.ceil(req.total_hours_required / req.session_duration_h));
  const sessions: SessionInsert[] = [];
  let placed = 0;

  if (schoolWeeks.length === 0) {
    return {
      sessions: [conflictSession(req, runId, 'Aucune semaine d\'école disponible pour cette classe.')],
      sessionsPlaced: 0, sessionsNeeded,
    };
  }

  // ── Fonction interne : un passage sur les semaines ──────────────────────────
  function runPass(weekLimit: number | undefined) {
    outer:
    for (const monday of schoolWeeks) {
      if (placed >= sessionsNeeded) break;
      let placedThisWeek = 0;

      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        if (placed >= sessionsNeeded) break outer;
        if (weekLimit !== undefined && placedThisWeek >= weekLimit) break;
        const dayOfWeek = dayOffset + 1;
        const day = addDays(monday, dayOffset);
        if (isInClosure(day, closures)) continue;

        const dispos = getDayDispos(teacherDispos, dayOfWeek);

        for (const dispo of dispos) {
          if (placed >= sessionsNeeded) break outer;
          if (weekLimit !== undefined && placedThisWeek >= weekLimit) break;
          const [sh, sm] = dispo.start_time.split(':').map(Number);
          const [eh, em] = dispo.end_time.split(':').map(Number);
          const dispoEnd = new Date(day); dispoEnd.setUTCHours(eh, em, 0, 0);
          let slotStart = new Date(day); slotStart.setUTCHours(sh, sm, 0, 0);

          while (placed < sessionsNeeded && (weekLimit === undefined || placedThisWeek < weekLimit)) {
            const slotEnd = addHours(slotStart, req.session_duration_h);
            if (slotEnd > dispoEnd) break;

            if (!hasOverlap(slotStart, slotEnd, teacherBooked) && !hasOverlap(slotStart, slotEnd, classBooked)) {
              teacherBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
              classBooked.push({ start: new Date(slotStart), end: new Date(slotEnd) });
              sessions.push({
                run_id: runId, class_id: req.class_id, teacher_id: req.teacher_id,
                subject_name: req.subject_name, start_timestamp: toISO(slotStart), end_timestamp: toISO(slotEnd),
                status: 'DRAFT',
              });
              placed++;
              placedThisWeek++;
              slotStart = new Date(slotEnd); // session suivante juste après
            } else {
              slotStart = new Date(slotStart.getTime() + 30 * 60000); // +30 min
            }
          }
        }
      }
    }
  }

  // 1er passage : avec la limite par semaine (packing régulier)
  runPass(maxPerWeek);

  // 2ème passage (backfill) : sans limite, pour placer ce qui reste si le 1er
  // passage n'a pas suffi à cause de conflits épars
  if (placed < sessionsNeeded && maxPerWeek !== undefined) {
    runPass(undefined);
  }

  const missing = sessionsNeeded - placed;
  if (missing > 0) {
    sessions.push(conflictSession(req, runId,
      `${missing} session(s) sur ${sessionsNeeded} impossible(s) à placer pour "${req.subject_name}" ` +
      `(${req.total_hours_required}h totales, séances de ${req.session_duration_h}h). ` +
      `Vérifiez les disponibilités du professeur ou réduisez le volume horaire.`));
  }

  return { sessions, sessionsPlaced: placed, sessionsNeeded };
}

// ─── Helper session conflit ───────────────────────────────────────────────────

// anchorDate : date de référence pour les sessions en conflit (1ère semaine d'école)
// → permet de les afficher dans le calendrier à la bonne période
let _conflictAnchor: Date | null = null;
function setConflictAnchor(d: Date) { _conflictAnchor = d; }

function conflictSession(req: SubjectReq, runId: string, reason: string): SessionInsert {
  const base = _conflictAnchor ?? new Date();
  return {
    run_id: runId, class_id: req.class_id, teacher_id: req.teacher_id,
    subject_name: req.subject_name,
    start_timestamp: toISO(base),
    end_timestamp: toISO(addHours(base, req.session_duration_h)),
    status: 'CONFLICT_ERROR',
    conflict_reason: reason,
  };
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
  const today = new Date();
  const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const allMondays = getSchoolYearMondays(startYear);
  // Ancre pour les sessions en conflit : 1ère semaine d'école à 8h UTC
  if (allMondays.length > 0) {
    const anchor = new Date(allMondays[0]);
    anchor.setUTCHours(8, 0, 0, 0);
    setConflictAnchor(anchor);
  }

  const [
    { data: classesData },
    { data: manualWeeksData },
    { data: closuresData },
    { data: availsData },
    { data: reqsData },
    { data: weekAvailsData },
  ] = await Promise.all([
    admin.from('classes')
      .select('id, nom, calendar_mode, pattern_school_weeks, pattern_company_weeks, pattern_reference_date')
      .in('id', classIds),
    admin.from('school_calendar').select('*').in('class_id', classIds),
    admin.from('school_closures').select('date_start, date_end'),
    admin.from('teacher_availabilities').select('*'),
    admin.from('subject_requirements').select('*').in('class_id', classIds),
    admin.from('teacher_week_availabilities').select('teacher_id, week_start'),
  ]);

  const classes  = (classesData ?? []) as ClassCalendar[];
  const closures = (closuresData ?? []) as ClosureRange[];
  const allAvails = (availsData ?? []) as (TeacherDispo & { teacher_id: string })[];
  const allReqs  = (reqsData ?? []) as SubjectReq[];

  // Map class_id → semaines manuelles
  const manualByClass = new Map<string, Map<string, 'SCHOOL' | 'COMPANY'>>();
  for (const w of manualWeeksData ?? []) {
    if (!manualByClass.has(w.class_id)) manualByClass.set(w.class_id, new Map());
    manualByClass.get(w.class_id)!.set(w.week_start, w.location);
  }

  // Map teacher_id → Set de lundis disponibles (vide = toute l'année)
  const teacherWeekSets = new Map<string, Set<string>>();
  for (const r of weekAvailsData ?? []) {
    if (!teacherWeekSets.has(r.teacher_id)) teacherWeekSets.set(r.teacher_id, new Set());
    teacherWeekSets.get(r.teacher_id)!.add(r.week_start as string);
  }

  // Gap fill : heures déjà planifiées
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

  // Créer le run
  const { data: runData } = await admin
    .from('planning_runs')
    .insert({ label, class_ids: classIds, is_gap_fill: isGapFill, status: 'DRAFT' })
    .select('id')
    .single();
  if (!runData) throw new Error('Impossible de créer le planning run.');
  const runId = runData.id;

  // Slots déjà réservés (sessions VALIDATED existantes)
  const teacherBookedMap = new Map<string, BookedSlot[]>();
  const classBookedMap   = new Map<string, BookedSlot[]>();
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

  // Génération
  const allSessions: SessionInsert[] = [];
  const conflicts: ConflictDetail[] = [];
  const TYPE_ORDER: SubjectReq['session_type'][] = ['INTENSIVE_BLOCK', 'WEEKLY_DAY', 'CLASSIC'];

  for (const cls of classes) {
    const manualWeeks = manualByClass.get(cls.id) ?? new Map<string, 'SCHOOL' | 'COMPANY'>();

    // Semaines d'école pour cette classe (sans les fermetures)
    const schoolWeeks = allMondays.filter(
      (m) => isSchoolWeek(m, cls, manualWeeks) && !isInClosure(m, closures)
    );

    // Classe sans semaines d'école → erreur explicite sur toutes les matières
    if (schoolWeeks.length === 0) {
      const weeksBeforeClosures = allMondays.filter((m) => isSchoolWeek(m, cls, manualWeeks)).length;
      const modeLabel = cls.calendar_mode === 'FULL_TIME' ? 'Temps plein' :
                        cls.calendar_mode === 'MANUAL'    ? 'Manuel' : 'Alternance';
      const diagReason = `Classe en mode "${modeLabel}" mais 0 semaine d'école trouvée. ` +
        (cls.calendar_mode === 'MANUAL' && manualWeeks.size > 0
          ? `Le calendrier manuel a ${manualWeeks.size} entrée(s) dont aucune n'est 'SCHOOL'. `
          : '') +
        (weeksBeforeClosures === 0 && cls.calendar_mode !== 'MANUAL'
          ? `Aucune semaine générée pour l'année scolaire ${startYear}-${startYear + 1}. `
          : '') +
        (weeksBeforeClosures > 0 && schoolWeeks.length === 0
          ? `${weeksBeforeClosures} semaine(s) filtrée(s) par les fermetures (${closures.length} fermeture(s) configurée(s)). `
          : '') +
        'Vérifiez le mode calendrier de la classe dans l\'onglet Calendriers.';

      console.warn(`[Planning] Classe "${cls.nom}": ${diagReason}`);

      for (const req of allReqs.filter((r) => r.class_id === cls.id)) {
        const s = conflictSession(req, runId, diagReason);
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason: diagReason, sessions_missing: 1 });
      }
      continue;
    }

    const classReqs = allReqs
      .filter((r) => r.class_id === cls.id)
      .sort((a, b) => TYPE_ORDER.indexOf(a.session_type) - TYPE_ORDER.indexOf(b.session_type));

    for (const req of classReqs) {
      let effectiveReq = req;
      if (isGapFill) {
        const key = `${req.class_id}__${req.teacher_id}__${req.subject_name}`;
        const doneHours = existingHoursByReq.get(key) ?? 0;
        const remaining = req.total_hours_required - doneHours;
        if (remaining <= 0) continue;
        effectiveReq = { ...req, total_hours_required: remaining };
      }

      // Intersection semaines école × semaines dispo du prof
      const teacherWeeks = teacherWeekSets.get(req.teacher_id);
      const teacherSchoolWeeks = (!teacherWeeks || teacherWeeks.size === 0)
        ? schoolWeeks
        : schoolWeeks.filter((m) => teacherWeeks.has(toUTCDateStr(m)));

      // Diagnostic si le prof n'a aucune semaine après intersection
      if (schoolWeeks.length > 0 && teacherSchoolWeeks.length === 0) {
        const reason = `Aucune semaine disponible pour le prof après intersection avec ses disponibilités annuelles. ` +
          `(${schoolWeeks.length} sem. école, prof a ${teacherWeeks?.size ?? 0} sem. sélectionnées qui ne couvrent pas cette période)`;
        const s = conflictSession(effectiveReq, runId, reason);
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason, sessions_missing: 1 });
        continue;
      }

      // Créneaux horaires (fallback 8h-18h si non configuré)
      const rawDispos = allAvails.filter((a) => a.teacher_id === req.teacher_id);
      const teacherDispos: TeacherDispo[] = rawDispos.length > 0 ? rawDispos : [];

      if (!teacherBookedMap.has(req.teacher_id)) teacherBookedMap.set(req.teacher_id, []);
      if (!classBookedMap.has(req.class_id))     classBookedMap.set(req.class_id, []);

      const tBooked = teacherBookedMap.get(req.teacher_id)!;
      const cBooked = classBookedMap.get(req.class_id)!;

      let result: { sessions: SessionInsert[]; conflict?: string; sessionsPlaced?: number; sessionsNeeded?: number };

      if (effectiveReq.session_type === 'INTENSIVE_BLOCK') {
        result = placeIntensiveBlock(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else if (effectiveReq.session_type === 'WEEKLY_DAY') {
        result = placeWeeklyDay(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else {
        // Règle FULL_TIME : limiter les sessions par semaine pour éviter les trous
        // On calcule le minimum de sessions par semaine nécessaire pour couvrir
        // l'année sans gap (ex: 10 séances / 40 semaines → 1/sem → sem 1 à 10 consécutives).
        let maxPerWeek: number | undefined;
        if (cls.calendar_mode === 'FULL_TIME' && teacherSchoolWeeks.length > 0) {
          const totalSessions = Math.max(1, Math.ceil(effectiveReq.total_hours_required / effectiveReq.session_duration_h));
          maxPerWeek = Math.max(1, Math.ceil(totalSessions / teacherSchoolWeeks.length));
        }
        result = placeClassic(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId, maxPerWeek);
      }

      allSessions.push(...result.sessions);

      const conflictSessions = result.sessions.filter((s) => s.status === 'CONFLICT_ERROR');
      if (conflictSessions.length > 0) {
        conflicts.push({
          class_nom: cls.nom,
          subject_name: req.subject_name,
          teacher_name: req.teacher_id,
          reason: conflictSessions[0]?.conflict_reason ?? 'Conflit inconnu',
          sessions_missing: conflictSessions.length,
        });
      }
    }
  }

  // Insert sessions par batch
  const BATCH = 100;
  for (let i = 0; i < allSessions.length; i += BATCH) {
    await admin.from('scheduled_sessions').insert(allSessions.slice(i, i + BATCH));
  }

  const totalPlaced    = allSessions.filter((s) => s.status === 'DRAFT').length;
  const totalConflicts = allSessions.filter((s) => s.status === 'CONFLICT_ERROR').length;

  await admin.from('planning_runs').update({
    total_sessions: totalPlaced,
    conflict_count: totalConflicts,
  }).eq('id', runId);

  return { run_id: runId, total_placed: totalPlaced, total_conflicts: totalConflicts, conflicts };
}

// ─── Relancer uniquement les conflits ────────────────────────────────────────

/**
 * Retente le placement des sessions en CONFLICT_ERROR d'un run existant.
 * Les sessions DRAFT déjà placées sont conservées et servent de contraintes.
 * Utile après une modification de config (dispo prof, calendrier, fermetures).
 */
export async function retryPlanningConflicts(
  runId: string
): Promise<{ total_placed: number; total_conflicts: number; conflicts: ConflictDetail[] }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé.');

  const admin = createAdminClient();

  // Identifier les sujets en conflit
  const { data: conflictRows } = await admin
    .from('scheduled_sessions')
    .select('class_id, teacher_id, subject_name')
    .eq('run_id', runId)
    .eq('status', 'CONFLICT_ERROR');

  if (!conflictRows || conflictRows.length === 0) {
    return { total_placed: 0, total_conflicts: 0, conflicts: [] };
  }

  // Dédupliquer par (class_id, teacher_id, subject_name)
  const subjectsToRetry = new Map<string, { class_id: string; teacher_id: string; subject_name: string }>();
  for (const s of conflictRows) {
    const key = `${s.class_id}__${s.teacher_id}__${s.subject_name}`;
    if (!subjectsToRetry.has(key)) subjectsToRetry.set(key, s as { class_id: string; teacher_id: string; subject_name: string });
  }
  const classIds = [...new Set([...subjectsToRetry.values()].map((s) => s.class_id))];

  // Supprimer les anciennes sessions en conflit
  await admin.from('scheduled_sessions').delete().eq('run_id', runId).eq('status', 'CONFLICT_ERROR');

  // Charger la config actuelle
  const today = new Date();
  const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const allMondays = getSchoolYearMondays(startYear);
  if (allMondays.length > 0) {
    const anchor = new Date(allMondays[0]);
    anchor.setUTCHours(8, 0, 0, 0);
    setConflictAnchor(anchor);
  }

  const [
    { data: classesData },
    { data: manualWeeksData },
    { data: closuresData },
    { data: availsData },
    { data: reqsData },
    { data: weekAvailsData },
    { data: draftSessionsData },
    { data: existingValidated },
  ] = await Promise.all([
    admin.from('classes')
      .select('id, nom, calendar_mode, pattern_school_weeks, pattern_company_weeks, pattern_reference_date')
      .in('id', classIds),
    admin.from('school_calendar').select('*').in('class_id', classIds),
    admin.from('school_closures').select('date_start, date_end'),
    admin.from('teacher_availabilities').select('*'),
    admin.from('subject_requirements').select('*').in('class_id', classIds),
    admin.from('teacher_week_availabilities').select('teacher_id, week_start'),
    // Sessions DRAFT déjà placées dans ce run (contraintes de booking)
    admin.from('scheduled_sessions')
      .select('teacher_id, class_id, subject_name, start_timestamp, end_timestamp')
      .eq('run_id', runId).eq('status', 'DRAFT'),
    // Sessions VALIDATED d'autres runs
    admin.from('scheduled_sessions')
      .select('teacher_id, class_id, start_timestamp, end_timestamp')
      .eq('status', 'VALIDATED'),
  ]);

  const classes   = (classesData  ?? []) as ClassCalendar[];
  const closures  = (closuresData ?? []) as ClosureRange[];
  const allAvails = (availsData   ?? []) as (TeacherDispo & { teacher_id: string })[];
  const allReqs   = (reqsData     ?? []) as SubjectReq[];

  const manualByClass = new Map<string, Map<string, 'SCHOOL' | 'COMPANY'>>();
  for (const w of manualWeeksData ?? []) {
    if (!manualByClass.has(w.class_id)) manualByClass.set(w.class_id, new Map());
    manualByClass.get(w.class_id)!.set(w.week_start, w.location);
  }

  const teacherWeekSets = new Map<string, Set<string>>();
  for (const r of weekAvailsData ?? []) {
    if (!teacherWeekSets.has(r.teacher_id)) teacherWeekSets.set(r.teacher_id, new Set());
    teacherWeekSets.get(r.teacher_id)!.add(r.week_start as string);
  }

  // Slots réservés = DRAFT du run + VALIDATED existants
  const teacherBookedMap = new Map<string, BookedSlot[]>();
  const classBookedMap   = new Map<string, BookedSlot[]>();
  for (const s of [...(draftSessionsData ?? []), ...(existingValidated ?? [])]) {
    const slot = { start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) };
    if (!teacherBookedMap.has(s.teacher_id)) teacherBookedMap.set(s.teacher_id, []);
    teacherBookedMap.get(s.teacher_id)!.push(slot);
    if (!classBookedMap.has(s.class_id)) classBookedMap.set(s.class_id, []);
    classBookedMap.get(s.class_id)!.push(slot);
  }

  // Heures déjà placées en DRAFT pour calculer le reste à placer
  const placedHoursByKey = new Map<string, number>();
  for (const s of draftSessionsData ?? []) {
    const key = `${s.class_id}__${s.teacher_id}__${s.subject_name}`;
    const hours = (new Date(s.end_timestamp).getTime() - new Date(s.start_timestamp).getTime()) / 3600000;
    placedHoursByKey.set(key, (placedHoursByKey.get(key) ?? 0) + hours);
  }

  const allSessions: SessionInsert[] = [];
  const conflicts: ConflictDetail[] = [];
  const TYPE_ORDER: SubjectReq['session_type'][] = ['INTENSIVE_BLOCK', 'WEEKLY_DAY', 'CLASSIC'];

  for (const cls of classes) {
    const manualWeeks = manualByClass.get(cls.id) ?? new Map<string, 'SCHOOL' | 'COMPANY'>();
    const schoolWeeks = allMondays.filter(
      (m) => isSchoolWeek(m, cls, manualWeeks) && !isInClosure(m, closures)
    );

    const classReqs = allReqs
      .filter((r) => {
        const key = `${r.class_id}__${r.teacher_id}__${r.subject_name}`;
        return r.class_id === cls.id && subjectsToRetry.has(key);
      })
      .sort((a, b) => TYPE_ORDER.indexOf(a.session_type) - TYPE_ORDER.indexOf(b.session_type));

    for (const req of classReqs) {
      const key = `${req.class_id}__${req.teacher_id}__${req.subject_name}`;
      const alreadyPlaced = placedHoursByKey.get(key) ?? 0;
      const remaining = req.total_hours_required - alreadyPlaced;
      if (remaining <= 0) continue;

      const effectiveReq: SubjectReq = { ...req, total_hours_required: remaining };

      if (schoolWeeks.length === 0) {
        const s = conflictSession(effectiveReq, runId, 'Aucune semaine d\'école disponible pour cette classe.');
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason: s.conflict_reason!, sessions_missing: 1 });
        continue;
      }

      const teacherWeeks = teacherWeekSets.get(req.teacher_id);
      const teacherSchoolWeeks = (!teacherWeeks || teacherWeeks.size === 0)
        ? schoolWeeks
        : schoolWeeks.filter((m) => teacherWeeks.has(toUTCDateStr(m)));

      if (schoolWeeks.length > 0 && teacherSchoolWeeks.length === 0) {
        const reason = `Aucune semaine disponible pour le prof après intersection avec ses disponibilités.`;
        const s = conflictSession(effectiveReq, runId, reason);
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason, sessions_missing: 1 });
        continue;
      }

      const rawDispos = allAvails.filter((a) => a.teacher_id === req.teacher_id);
      const teacherDispos: TeacherDispo[] = rawDispos.length > 0 ? rawDispos : [];

      if (!teacherBookedMap.has(req.teacher_id)) teacherBookedMap.set(req.teacher_id, []);
      if (!classBookedMap.has(req.class_id))     classBookedMap.set(req.class_id, []);

      const tBooked = teacherBookedMap.get(req.teacher_id)!;
      const cBooked = classBookedMap.get(req.class_id)!;

      let result: { sessions: SessionInsert[]; conflict?: string; sessionsPlaced?: number; sessionsNeeded?: number };

      if (effectiveReq.session_type === 'INTENSIVE_BLOCK') {
        result = placeIntensiveBlock(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else if (effectiveReq.session_type === 'WEEKLY_DAY') {
        result = placeWeeklyDay(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else {
        let maxPerWeek: number | undefined;
        if (cls.calendar_mode === 'FULL_TIME' && teacherSchoolWeeks.length > 0) {
          const totalSessions = Math.max(1, Math.ceil(effectiveReq.total_hours_required / effectiveReq.session_duration_h));
          maxPerWeek = Math.max(1, Math.ceil(totalSessions / teacherSchoolWeeks.length));
        }
        result = placeClassic(effectiveReq, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId, maxPerWeek);
      }

      allSessions.push(...result.sessions);
      const conflictSessions = result.sessions.filter((s) => s.status === 'CONFLICT_ERROR');
      if (conflictSessions.length > 0) {
        conflicts.push({
          class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id,
          reason: conflictSessions[0]?.conflict_reason ?? 'Conflit inconnu',
          sessions_missing: conflictSessions.length,
        });
      }
    }
  }

  // Insérer les nouvelles sessions
  const BATCH = 100;
  for (let i = 0; i < allSessions.length; i += BATCH) {
    await admin.from('scheduled_sessions').insert(allSessions.slice(i, i + BATCH));
  }

  // Recompter le total du run
  const [{ count: draftCount }, { count: conflictCount }] = await Promise.all([
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'DRAFT'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'CONFLICT_ERROR'),
  ]);

  await admin.from('planning_runs').update({
    total_sessions: draftCount ?? 0,
    conflict_count: conflictCount ?? 0,
  }).eq('id', runId);

  return {
    total_placed: allSessions.filter((s) => s.status === 'DRAFT').length,
    total_conflicts: conflicts.length,
    conflicts,
  };
}

// ─── Ajouter de nouvelles classes à un run existant ──────────────────────────

/**
 * Génère le planning de nouvelles classes dans un run existant (DRAFT ou VALIDATED).
 * - Les sessions déjà dans le run + les sessions VALIDATED d'autres runs servent de contraintes.
 * - Si le run est VALIDATED, les nouvelles sessions sont directement insérées en VALIDATED.
 * - La liste class_ids du run est mise à jour.
 */
export async function addClassesToRun(
  runId: string,
  newClassIds: string[]
): Promise<{ total_placed: number; total_conflicts: number; conflicts: ConflictDetail[] }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé.');

  const admin = createAdminClient();

  // Charger le run pour connaître son statut et ses classes actuelles
  const { data: runData } = await admin
    .from('planning_runs')
    .select('status, class_ids')
    .eq('id', runId)
    .single();
  if (!runData) throw new Error('Run introuvable.');

  const runStatus = runData.status as 'DRAFT' | 'VALIDATED' | 'ARCHIVED';
  const existingClassIds = (runData.class_ids ?? []) as string[];
  // Filtrer les classes déjà présentes
  const classIds = newClassIds.filter((id) => !existingClassIds.includes(id));
  if (classIds.length === 0) return { total_placed: 0, total_conflicts: 0, conflicts: [] };

  // Charger la config
  const today = new Date();
  const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const allMondays = getSchoolYearMondays(startYear);
  if (allMondays.length > 0) {
    const anchor = new Date(allMondays[0]);
    anchor.setUTCHours(8, 0, 0, 0);
    setConflictAnchor(anchor);
  }

  const [
    { data: classesData },
    { data: manualWeeksData },
    { data: closuresData },
    { data: availsData },
    { data: reqsData },
    { data: weekAvailsData },
    { data: existingRunSessions },
    { data: existingValidated },
  ] = await Promise.all([
    admin.from('classes')
      .select('id, nom, calendar_mode, pattern_school_weeks, pattern_company_weeks, pattern_reference_date')
      .in('id', classIds),
    admin.from('school_calendar').select('*').in('class_id', classIds),
    admin.from('school_closures').select('date_start, date_end'),
    admin.from('teacher_availabilities').select('*'),
    admin.from('subject_requirements').select('*').in('class_id', classIds),
    admin.from('teacher_week_availabilities').select('teacher_id, week_start'),
    // Sessions déjà dans ce run (toutes statuts)
    admin.from('scheduled_sessions')
      .select('teacher_id, class_id, start_timestamp, end_timestamp')
      .eq('run_id', runId),
    // Sessions VALIDATED d'autres runs
    admin.from('scheduled_sessions')
      .select('teacher_id, class_id, start_timestamp, end_timestamp')
      .eq('status', 'VALIDATED')
      .neq('run_id', runId),
  ]);

  const classes   = (classesData  ?? []) as ClassCalendar[];
  const closures  = (closuresData ?? []) as ClosureRange[];
  const allAvails = (availsData   ?? []) as (TeacherDispo & { teacher_id: string })[];
  const allReqs   = (reqsData     ?? []) as SubjectReq[];

  const manualByClass = new Map<string, Map<string, 'SCHOOL' | 'COMPANY'>>();
  for (const w of manualWeeksData ?? []) {
    if (!manualByClass.has(w.class_id)) manualByClass.set(w.class_id, new Map());
    manualByClass.get(w.class_id)!.set(w.week_start, w.location);
  }

  const teacherWeekSets = new Map<string, Set<string>>();
  for (const r of weekAvailsData ?? []) {
    if (!teacherWeekSets.has(r.teacher_id)) teacherWeekSets.set(r.teacher_id, new Set());
    teacherWeekSets.get(r.teacher_id)!.add(r.week_start as string);
  }

  // Slots réservés = sessions du run courant + VALIDATED des autres runs
  const teacherBookedMap = new Map<string, BookedSlot[]>();
  const classBookedMap   = new Map<string, BookedSlot[]>();
  for (const s of [...(existingRunSessions ?? []), ...(existingValidated ?? [])]) {
    const slot = { start: new Date(s.start_timestamp), end: new Date(s.end_timestamp) };
    if (!teacherBookedMap.has(s.teacher_id)) teacherBookedMap.set(s.teacher_id, []);
    teacherBookedMap.get(s.teacher_id)!.push(slot);
    if (!classBookedMap.has(s.class_id)) classBookedMap.set(s.class_id, []);
    classBookedMap.get(s.class_id)!.push(slot);
  }

  const allSessions: SessionInsert[] = [];
  const conflicts: ConflictDetail[] = [];
  const TYPE_ORDER: SubjectReq['session_type'][] = ['INTENSIVE_BLOCK', 'WEEKLY_DAY', 'CLASSIC'];

  for (const cls of classes) {
    const manualWeeks = manualByClass.get(cls.id) ?? new Map<string, 'SCHOOL' | 'COMPANY'>();
    const schoolWeeks = allMondays.filter(
      (m) => isSchoolWeek(m, cls, manualWeeks) && !isInClosure(m, closures)
    );

    const classReqs = allReqs
      .filter((r) => r.class_id === cls.id)
      .sort((a, b) => TYPE_ORDER.indexOf(a.session_type) - TYPE_ORDER.indexOf(b.session_type));

    if (schoolWeeks.length === 0) {
      for (const req of classReqs) {
        const s = conflictSession(req, runId, 'Aucune semaine d\'école disponible pour cette classe.');
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason: s.conflict_reason!, sessions_missing: 1 });
      }
      continue;
    }

    for (const req of classReqs) {
      const teacherWeeks = teacherWeekSets.get(req.teacher_id);
      const teacherSchoolWeeks = (!teacherWeeks || teacherWeeks.size === 0)
        ? schoolWeeks
        : schoolWeeks.filter((m) => teacherWeeks.has(toUTCDateStr(m)));

      if (schoolWeeks.length > 0 && teacherSchoolWeeks.length === 0) {
        const reason = `Aucune semaine disponible pour le prof après intersection avec ses disponibilités.`;
        const s = conflictSession(req, runId, reason);
        allSessions.push(s);
        conflicts.push({ class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id, reason, sessions_missing: 1 });
        continue;
      }

      const rawDispos = allAvails.filter((a) => a.teacher_id === req.teacher_id);
      const teacherDispos: TeacherDispo[] = rawDispos.length > 0 ? rawDispos : [];

      if (!teacherBookedMap.has(req.teacher_id)) teacherBookedMap.set(req.teacher_id, []);
      if (!classBookedMap.has(req.class_id))     classBookedMap.set(req.class_id, []);
      const tBooked = teacherBookedMap.get(req.teacher_id)!;
      const cBooked = classBookedMap.get(req.class_id)!;

      let result: { sessions: SessionInsert[]; conflict?: string; sessionsPlaced?: number; sessionsNeeded?: number };

      if (req.session_type === 'INTENSIVE_BLOCK') {
        result = placeIntensiveBlock(req, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else if (req.session_type === 'WEEKLY_DAY') {
        result = placeWeeklyDay(req, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId);
      } else {
        let maxPerWeek: number | undefined;
        if (cls.calendar_mode === 'FULL_TIME' && teacherSchoolWeeks.length > 0) {
          const totalSessions = Math.max(1, Math.ceil(req.total_hours_required / req.session_duration_h));
          maxPerWeek = Math.max(1, Math.ceil(totalSessions / teacherSchoolWeeks.length));
        }
        result = placeClassic(req, teacherSchoolWeeks, closures, teacherDispos, tBooked, cBooked, runId, maxPerWeek);
      }

      allSessions.push(...result.sessions);
      const conflictSessions = result.sessions.filter((s) => s.status === 'CONFLICT_ERROR');
      if (conflictSessions.length > 0) {
        conflicts.push({
          class_nom: cls.nom, subject_name: req.subject_name, teacher_name: req.teacher_id,
          reason: conflictSessions[0]?.conflict_reason ?? 'Conflit inconnu',
          sessions_missing: conflictSessions.length,
        });
      }
    }
  }

  // Si le run est VALIDATED, les nouvelles sessions sont directement validées
  if (runStatus === 'VALIDATED') {
    for (const s of allSessions) {
      if (s.status === 'DRAFT') s.status = 'VALIDATED';
    }
  }

  const BATCH = 100;
  for (let i = 0; i < allSessions.length; i += BATCH) {
    await admin.from('scheduled_sessions').insert(allSessions.slice(i, i + BATCH));
  }

  // Mettre à jour class_ids + recompter
  const updatedClassIds = [...existingClassIds, ...classIds];
  const [{ count: draftCount }, { count: validatedCount }, { count: conflictCount }] = await Promise.all([
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'DRAFT'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'VALIDATED'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'CONFLICT_ERROR'),
  ]);

  await admin.from('planning_runs').update({
    class_ids: updatedClassIds,
    total_sessions: (draftCount ?? 0) + (validatedCount ?? 0),
    conflict_count: conflictCount ?? 0,
  }).eq('id', runId);

  return {
    total_placed: allSessions.filter((s) => s.status !== 'CONFLICT_ERROR').length,
    total_conflicts: conflicts.length,
    conflicts,
  };
}

// ─── Publication ──────────────────────────────────────────────────────────────

export async function publishPlanningRun(runId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Accès refusé.' };

  const admin = createAdminClient();
  const { data: run } = await admin.from('planning_runs').select('class_ids').eq('id', runId).single();
  if (!run) return { error: 'Run introuvable.' };

  const { data: oldRuns } = await admin
    .from('planning_runs').select('id').eq('status', 'VALIDATED').overlaps('class_ids', run.class_ids);
  if (oldRuns?.length) {
    await admin.from('planning_runs').update({ status: 'ARCHIVED' }).in('id', oldRuns.map((r: { id: string }) => r.id));
  }

  const { error } = await admin.from('planning_runs').update({ status: 'VALIDATED' }).eq('id', runId);
  if (error) return { error: error.message };

  await admin.from('scheduled_sessions').update({ status: 'VALIDATED' }).eq('run_id', runId).eq('status', 'DRAFT');
  return {};
}

// ─── Lister / supprimer les runs ─────────────────────────────────────────────

export async function getPlanningRuns() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return [];
  const admin = createAdminClient();
  const { data } = await admin.from('planning_runs').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function deletePlanningRun(runId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Accès refusé.' };
  const admin = createAdminClient();
  const { error } = await admin.from('planning_runs').delete().eq('id', runId);
  if (error) return { error: error.message };
  return {};
}
