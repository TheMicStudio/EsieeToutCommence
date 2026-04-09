'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { revalidatePath } from 'next/cache';

// ─── Guard admin ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé.');
  return profile;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CsvRow {
  nom_groupe: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface ParsedStudent {
  nom: string;
  prenom: string;
  email: string;
  classe_nom: string;
  type_parcours: 'temps_plein' | 'alternant';
  annee_debut: number;
  mot_de_passe: string;
}

export interface ImportPreview {
  students: ParsedStudent[];
  classe_nom: string;
  total: number;
  tp_count: number;
  alt_count: number;
  errors: string[];
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface RoomRow {
  id: string;
  nom: string;
  capacite: number | null;
  created_at: string;
}

export interface ClosureRow {
  id: string;
  label: string;
  date_start: string;
  date_end: string;
  created_at: string;
}

// ─── Parser XLSX pur Node.js (sans dépendance npm) ───────────────────────────
//
// Un fichier XLSX est un ZIP contenant des XML.
// On décompresse manuellement (format ZIP + DEFLATE via node:zlib),
// puis on parse xl/sharedStrings.xml et xl/worksheets/sheet1.xml.

function _u16(b: Buffer, o: number): number {
  return (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8);
}
function _u32(b: Buffer, o: number): number {
  return (((b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16) | ((b[o + 3] ?? 0) << 24)) >>> 0);
}

function _parseZip(data: Buffer): Map<string, Buffer> {
  const { inflateRawSync } = require('node:zlib') as typeof import('node:zlib');
  const files = new Map<string, Buffer>();
  let i = 0;
  while (i + 30 <= data.length) {
    if (_u32(data, i) !== 0x04034b50) { i++; continue; }
    const method  = _u16(data, i + 8);
    const csize   = _u32(data, i + 18);
    const nameLen = _u16(data, i + 26);
    const extLen  = _u16(data, i + 28);
    const name    = data.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const off     = i + 30 + nameLen + extLen;
    const raw     = data.slice(off, off + csize);
    try {
      files.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw));
    } catch { /* ignore corrupt entries */ }
    i = off + csize;
  }
  return files;
}

function _unescapeXml(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function _colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64;
  return n - 1;
}

function _xlsxBufferToCsv(buf: Buffer): string {
  const zip = _parseZip(buf);

  // Shared strings
  const shared: string[] = [];
  const ssXml = zip.get('xl/sharedStrings.xml');
  if (ssXml) {
    for (const m of ssXml.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const t = [...m[1].matchAll(/<t(?:[^>]*)>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('');
      shared.push(_unescapeXml(t));
    }
  }

  // First sheet
  const sheetBuf = zip.get('xl/worksheets/sheet1.xml') ?? zip.get('xl/worksheets/Sheet1.xml');
  if (!sheetBuf) return '';
  const sheetXml = sheetBuf.toString('utf8');

  const csvRows: string[] = [];
  for (const rowM of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cM of rowM[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cM[1], inner = cM[2];
      const rM = attrs.match(/\br="([A-Z]+)\d+"/);
      if (rM) {
        const idx = _colIndex(rM[1]);
        while (cells.length < idx) cells.push('');
      }
      const typeM = attrs.match(/\bt="([^"]+)"/);
      const vM    = inner.match(/<v>([\s\S]*?)<\/v>/);
      let val = '';
      if (vM) {
        val = typeM?.[1] === 's' ? (shared[parseInt(vM[1])] ?? '') : _unescapeXml(vM[1]);
      } else {
        // Inline string <is><t>…</t></is>
        const isM = inner.match(/<t(?:[^>]*)>([\s\S]*?)<\/t>/);
        if (isM) val = _unescapeXml(isM[1]);
      }
      cells.push(val);
    }
    csvRows.push(cells.join(';'));
  }
  return csvRows.join('\n');
}

/**
 * Reçoit un fichier XLSX encodé en base64, retourne son contenu CSV (séparateur ;).
 * Implémentation 100% Node.js natif — aucune dépendance npm.
 */
export async function parseXlsxToCSV(
  base64: string
): Promise<{ csv?: string; error?: string }> {
  try {
    const buf = Buffer.from(base64, 'base64');
    // Vérifier signature ZIP (PK\x03\x04)
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4B) {
      return { error: 'Le fichier ne semble pas être un XLSX valide.' };
    }
    const csv = _xlsxBufferToCsv(buf);
    if (!csv.trim()) return { error: 'Le fichier Excel semble vide ou dans un format non supporté.' };
    return { csv };
  } catch (e) {
    return { error: `Erreur de lecture XLSX : ${(e as Error).message}` };
  }
}

// ─── Parsing CSV ──────────────────────────────────────────────────────────────

// Format NOM_GROUPE : "CC_TH6_BACH_DEV WEB SÉC 2 TP 25-26"
// Regex : capture tout avant le dernier (TP|ALT), puis l'année
const GROUPE_REGEX = /^(.+?)\s+(TP|ALT)\s+(\d{2})-(\d{2})$/;

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Mot de passe temporaire : Prenom.NOM2025
function generatePassword(prenom: string, nom: string): string {
  const cleanPrenom = capitalize(prenom.trim());
  const cleanNom = nom.trim().toUpperCase();
  return `${cleanPrenom}.${cleanNom}2025`;
}

export async function parseCsvContent(content: string): Promise<ImportPreview> {
  const lines = content.trim().split('\n');
  const errors: string[] = [];
  const students: ParsedStudent[] = [];

  // Détection du séparateur (virgule ou point-virgule)
  const header = lines[0];
  const sep = header.includes(';') ? ';' : ',';
  const cols = header.split(sep).map((c) => c.trim().replace(/^"|"$/g, '').toUpperCase());

  const idxGroupe = cols.indexOf('NOM_GROUPE_APPRENANT');
  const idxNom    = cols.indexOf('NOM_APPRENANT');
  const idxPrenom = cols.indexOf('PRENOM_APPRENANT');
  const idxEmail  = cols.indexOf('EMAIL_APPRENANT');

  if ([idxGroupe, idxNom, idxPrenom, idxEmail].some((i) => i === -1)) {
    errors.push('Colonnes manquantes. Colonnes attendues : NOM_GROUPE_APPRENANT, NOM_APPRENANT, PRENOM_APPRENANT, EMAIL_APPRENANT');
    return { students: [], classe_nom: '', total: 0, tp_count: 0, alt_count: 0, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const nomGroupe = cells[idxGroupe] ?? '';
    const nom       = cells[idxNom] ?? '';
    const prenom    = cells[idxPrenom] ?? '';
    const email     = cells[idxEmail] ?? '';

    if (!nomGroupe || !nom || !prenom || !email) {
      errors.push(`Ligne ${i + 1} : données incomplètes, ignorée.`);
      continue;
    }

    if (!email.includes('@')) {
      errors.push(`Ligne ${i + 1} : email invalide "${email}", ignorée.`);
      continue;
    }

    const match = nomGroupe.trim().match(GROUPE_REGEX);
    if (!match) {
      errors.push(`Ligne ${i + 1} : format de groupe non reconnu "${nomGroupe}", ignorée.`);
      continue;
    }

    const classeNom    = match[1].trim();
    const typeParcours = match[2] === 'ALT' ? 'alternant' : 'temps_plein';
    const anneeDebut   = 2000 + parseInt(match[3], 10);

    students.push({
      nom,
      prenom,
      email: email.toLowerCase(),
      classe_nom: classeNom,
      type_parcours: typeParcours,
      annee_debut: anneeDebut,
      mot_de_passe: generatePassword(prenom, nom),
    });
  }

  const classeNom = students[0]?.classe_nom ?? '';
  const tpCount   = students.filter((s) => s.type_parcours === 'temps_plein').length;
  const altCount  = students.filter((s) => s.type_parcours === 'alternant').length;

  return {
    students,
    classe_nom: classeNom,
    total: students.length,
    tp_count: tpCount,
    alt_count: altCount,
    errors,
  };
}

// ─── Import CSV réel ──────────────────────────────────────────────────────────

export async function importCsvStudents(
  students: ParsedStudent[]
): Promise<ImportResult> {
  await requireAdmin();
  const admin = createAdminClient();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 1. Récupérer ou créer la classe (une seule — toujours la même pour ce CSV)
  const classeNom = students[0]?.classe_nom;
  if (!classeNom) return { created: 0, skipped: 0, errors: ['Aucun étudiant valide.'] };

  const anneeDebut = students[0]?.annee_debut ?? new Date().getFullYear();

  let classeId: string;
  const { data: existingClass } = await admin
    .from('classes')
    .select('id')
    .eq('nom', classeNom)
    .eq('annee', anneeDebut)
    .single();

  if (existingClass) {
    classeId = existingClass.id;
  } else {
    const { data: newClass, error: classErr } = await admin
      .from('classes')
      .insert({ nom: classeNom, annee: anneeDebut })
      .select('id')
      .single();
    if (classErr || !newClass) {
      return { created: 0, skipped: 0, errors: [`Erreur création classe : ${classErr?.message}`] };
    }
    classeId = newClass.id;
  }

  // 2. Créer les comptes utilisateurs un par un
  for (const student of students) {
    try {
      // Vérifier si l'email existe déjà dans auth.users
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const alreadyExists = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === student.email
      );

      if (alreadyExists) {
        skipped++;
        continue;
      }

      // Créer le compte auth avec mot de passe temporaire
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: student.email,
        password: student.mot_de_passe,
        email_confirm: true,
      });

      if (authErr || !authData.user) {
        errors.push(`${student.email} : ${authErr?.message ?? 'Erreur création compte'}`);
        continue;
      }

      const userId = authData.user.id;

      // Rôle
      await admin.from('user_roles').insert({ id: userId, role: 'eleve' });

      // Profil étudiant
      await admin.from('student_profiles').insert({
        id: userId,
        nom: student.nom,
        prenom: student.prenom,
        type_parcours: student.type_parcours,
        class_id: classeId,
      });

      // Membre de la classe
      await admin.from('class_members').insert({
        class_id: classeId,
        student_id: userId,
      });

      created++;
    } catch (e) {
      errors.push(`${student.email} : erreur inattendue`);
    }
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/planning');

  return { created, skipped, errors };
}

// ─── Salles ───────────────────────────────────────────────────────────────────

export async function getRooms(): Promise<RoomRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from('rooms').select('*').order('nom');
  return data ?? [];
}

export async function createRoom(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const nom      = formData.get('nom') as string;
  const capacite = formData.get('capacite') ? Number(formData.get('capacite')) : null;

  if (!nom?.trim()) return { error: 'Le nom de la salle est requis.' };

  const { error } = await admin.from('rooms').insert({ nom: nom.trim(), capacite });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/planning');
  return {};
}

export async function deleteRoom(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('rooms').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

// ─── Fermetures scolaires ─────────────────────────────────────────────────────

export async function getClosures(): Promise<ClosureRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('school_closures')
    .select('*')
    .order('date_start');
  return data ?? [];
}

export async function createClosure(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const label      = formData.get('label') as string;
  const date_start = formData.get('date_start') as string;
  const date_end   = formData.get('date_end') as string;

  if (!label?.trim() || !date_start || !date_end)
    return { error: 'Tous les champs sont requis.' };
  if (date_end < date_start)
    return { error: 'La date de fin doit être après la date de début.' };

  const { error } = await admin
    .from('school_closures')
    .insert({ label: label.trim(), date_start, date_end });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/planning');
  return {};
}

export async function deleteClosure(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('school_closures').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

// ─── Calendrier classe ────────────────────────────────────────────────────────

export interface ClassWithCalendar {
  id: string;
  nom: string;
  annee: number;
  calendar_mode: 'FULL_TIME' | 'FIXED_PATTERN' | 'MANUAL';
  pattern_school_weeks: number | null;
  pattern_company_weeks: number | null;
  pattern_reference_date: string | null;
}

export interface CalendarWeek {
  id: string;
  class_id: string;
  week_start: string;
  location: 'SCHOOL' | 'COMPANY';
}

export async function getClassesWithCalendar(): Promise<ClassWithCalendar[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('classes')
    .select('id, nom, annee, calendar_mode, pattern_school_weeks, pattern_company_weeks, pattern_reference_date')
    .order('annee', { ascending: false });
  return (data ?? []) as ClassWithCalendar[];
}

export async function updateCalendarMode(
  classId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const mode = formData.get('calendar_mode') as string;
  const patch: Record<string, unknown> = { calendar_mode: mode };

  if (mode === 'FIXED_PATTERN') {
    const schoolWeeks  = parseInt(formData.get('pattern_school_weeks') as string);
    const companyWeeks = parseInt(formData.get('pattern_company_weeks') as string);
    const refDate      = formData.get('pattern_reference_date') as string;
    if (!schoolWeeks || !companyWeeks || !refDate)
      return { error: 'Renseignez le nombre de semaines et la date de référence.' };
    patch.pattern_school_weeks  = schoolWeeks;
    patch.pattern_company_weeks = companyWeeks;
    patch.pattern_reference_date = refDate;
  }

  const { error } = await admin.from('classes').update(patch).eq('id', classId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/planning');
  return {};
}

export async function getCalendarWeeks(classId: string): Promise<CalendarWeek[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('school_calendar')
    .select('*')
    .eq('class_id', classId)
    .order('week_start');
  return (data ?? []) as CalendarWeek[];
}

export async function upsertCalendarWeek(
  classId: string,
  weekStart: string,
  location: 'SCHOOL' | 'COMPANY'
): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('school_calendar')
    .upsert({ class_id: classId, week_start: weekStart, location }, { onConflict: 'class_id,week_start' });
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

export async function deleteCalendarWeek(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('school_calendar').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

// ─── Disponibilités professeurs ───────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface TeacherForPlanning {
  id: string;
  nom: string;
  prenom: string;
  matieres_enseignees: string[];
}

export async function getTeachersForPlanning(): Promise<TeacherForPlanning[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('teacher_profiles')
    .select('id, nom, prenom, matieres_enseignees')
    .order('nom');
  return (data ?? []) as TeacherForPlanning[];
}

export async function getTeacherAvailabilities(teacherId: string): Promise<AvailabilitySlot[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('teacher_availabilities')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('start_time');
  return (data ?? []) as AvailabilitySlot[];
}

export async function upsertAvailabilitySlot(
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isAvailable: boolean
): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  if (endTime <= startTime) return { error: "L'heure de fin doit être après le début." };

  const { error } = await admin.from('teacher_availabilities').upsert(
    { teacher_id: teacherId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, is_available: isAvailable },
    { onConflict: 'teacher_id,day_of_week,start_time' }
  );
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

export async function deleteAvailabilitySlot(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('teacher_availabilities').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

// ─── Disponibilités par semaine (nouveau système) ─────────────────────────────

/** Retourne les week_start (YYYY-MM-DD) des semaines disponibles d'un prof */
export async function getTeacherWeekAvailabilities(teacherId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('teacher_week_availabilities')
    .select('week_start')
    .eq('teacher_id', teacherId)
    .order('week_start');
  return (data ?? []).map((r: { week_start: string }) => r.week_start);
}

/** Charge toutes les dispo semaines de plusieurs profs en une requête */
export async function getAllTeacherWeekAvailabilities(
  teacherIds: string[]
): Promise<Record<string, string[]>> {
  if (teacherIds.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from('teacher_week_availabilities')
    .select('teacher_id, week_start')
    .in('teacher_id', teacherIds)
    .order('week_start');

  const result: Record<string, string[]> = {};
  for (const r of data ?? []) {
    if (!result[r.teacher_id]) result[r.teacher_id] = [];
    result[r.teacher_id].push(r.week_start);
  }
  return result;
}

/** Toggle une semaine (insert si absente, delete si présente) */
export async function toggleTeacherWeek(
  teacherId: string,
  weekStart: string
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) return { error: 'Non authentifié.' };
  if (profile.role !== 'admin' && profile.profile.id !== teacherId) {
    return { error: 'Accès refusé.' };
  }
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('teacher_week_availabilities')
    .select('teacher_id')
    .eq('teacher_id', teacherId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (existing) {
    await admin.from('teacher_week_availabilities')
      .delete().eq('teacher_id', teacherId).eq('week_start', weekStart);
  } else {
    await admin.from('teacher_week_availabilities')
      .insert({ teacher_id: teacherId, week_start: weekStart });
  }
  revalidatePath('/dashboard/planning');
  revalidatePath('/dashboard/pedagogie/disponibilites');
  return {};
}

/** Remplace toutes les semaines d'un prof d'un coup (bulk set) */
export async function setTeacherAllWeeks(
  teacherId: string,
  weekStarts: string[]
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) return { error: 'Non authentifié.' };
  if (profile.role !== 'admin' && profile.profile.id !== teacherId) {
    return { error: 'Accès refusé.' };
  }
  const admin = createAdminClient();
  await admin.from('teacher_week_availabilities').delete().eq('teacher_id', teacherId);
  if (weekStarts.length > 0) {
    await admin.from('teacher_week_availabilities').insert(
      weekStarts.map((w) => ({ teacher_id: teacherId, week_start: w }))
    );
  }
  revalidatePath('/dashboard/planning');
  revalidatePath('/dashboard/pedagogie/disponibilites');
  return {};
}

// ─── Besoins horaires par matière ─────────────────────────────────────────────

export interface SubjectRequirement {
  id: string;
  class_id: string;
  teacher_id: string;
  subject_name: string;
  total_hours_required: number;
  session_duration_h: number;
  teacher_nom?: string;
  teacher_prenom?: string;
}

export async function getSubjectRequirements(classId: string): Promise<SubjectRequirement[]> {
  await requireAdmin();
  const admin = createAdminClient();

  // Deux requêtes séparées pour éviter le join indirect teacher_id → auth.users → teacher_profiles
  const { data, error } = await admin
    .from('subject_requirements')
    .select('*')
    .eq('class_id', classId)
    .order('subject_name');

  if (error) { console.error('[getSubjectRequirements]', error.message); return []; }
  if (!data?.length) return [];

  const teacherIds = [...new Set(data.map((r) => r.teacher_id as string))];
  const { data: teachers } = await admin
    .from('teacher_profiles')
    .select('id, nom, prenom')
    .in('id', teacherIds);

  const teacherMap = new Map((teachers ?? []).map((t) => [t.id as string, t as { id: string; nom: string; prenom: string }]));

  return data.map((r: Record<string, unknown>) => {
    const tp = teacherMap.get(r.teacher_id as string);
    return {
      id: r.id as string,
      class_id: r.class_id as string,
      teacher_id: r.teacher_id as string,
      subject_name: r.subject_name as string,
      total_hours_required: r.total_hours_required as number,
      session_duration_h: r.session_duration_h as number,
      teacher_nom: tp?.nom,
      teacher_prenom: tp?.prenom,
    };
  });
}

export interface CreateSubjectRequirementInput {
  class_id: string;
  teacher_id: string;
  subject_name: string;
  total_hours_required: number;
  session_duration_h: number;
  session_type: 'CLASSIC' | 'INTENSIVE_BLOCK' | 'WEEKLY_DAY';
  duration_weeks: number | null;
  preferred_day: number | null;
  weekly_occurrences: number | null;
}

export async function createSubjectRequirement(
  input: CreateSubjectRequirementInput
): Promise<{ id?: string; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { class_id, teacher_id, subject_name, total_hours_required,
          session_duration_h, session_type, duration_weeks, preferred_day, weekly_occurrences } = input;

  if (!class_id || !teacher_id || !subject_name)
    return { error: 'Tous les champs sont requis.' };
  if (!total_hours_required || total_hours_required <= 0)
    return { error: 'Le volume horaire doit être positif.' };

  const { data, error } = await admin
    .from('subject_requirements')
    .insert({
      class_id,
      teacher_id,
      subject_name: subject_name.trim(),
      total_hours_required,
      session_duration_h,
      session_type,
      duration_weeks,
      preferred_day,
      weekly_occurrences,
    })
    .select('id')
    .single();

  if (error?.code === '23505') return { error: 'Cette matière est déjà configurée pour ce prof et cette classe.' };
  if (error) return { error: error.message };

  revalidatePath('/dashboard/planning');
  return { id: data?.id };
}

export async function deleteSubjectRequirement(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('subject_requirements').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

// ─── Sessions calendrier ──────────────────────────────────────────────────────

export interface SessionEvent {
  id: string;
  class_id: string;
  class_nom: string;
  teacher_id: string;
  teacher_nom: string;
  teacher_prenom: string;
  subject_name: string;
  room_id: string | null;
  room_nom: string | null;
  start_timestamp: string;
  end_timestamp: string;
  status: 'DRAFT' | 'VALIDATED' | 'CONFLICT_ERROR';
  conflict_reason: string | null;
}

// Helper : enrichit des sessions brutes avec les noms de classes, profs et salles
async function _enrichSessions(
  rows: Record<string, unknown>[],
  client: ReturnType<typeof createAdminClient>
): Promise<SessionEvent[]> {
  if (!rows.length) return [];

  const classIds   = [...new Set(rows.map((r) => r.class_id as string))];
  const teacherIds = [...new Set(rows.map((r) => r.teacher_id as string))];
  const roomIds    = [...new Set(rows.map((r) => r.room_id as string | null).filter(Boolean))] as string[];

  const [{ data: cls }, { data: tps }, { data: rms }] = await Promise.all([
    client.from('classes').select('id, nom').in('id', classIds),
    client.from('teacher_profiles').select('id, nom, prenom').in('id', teacherIds),
    roomIds.length ? client.from('rooms').select('id, nom').in('id', roomIds) : Promise.resolve({ data: [] }),
  ]);

  const classMap   = new Map((cls  ?? []).map((c) => [c.id as string, c.nom as string]));
  const teacherMap = new Map((tps  ?? []).map((t) => [t.id as string, t as { id: string; nom: string; prenom: string }]));
  const roomMap    = new Map((rms  ?? []).map((r) => [r.id as string, r.nom as string]));

  return rows.map((s) => ({
    id:              s.id as string,
    class_id:        s.class_id as string,
    class_nom:       classMap.get(s.class_id as string) ?? '',
    teacher_id:      s.teacher_id as string,
    teacher_nom:     teacherMap.get(s.teacher_id as string)?.nom ?? '',
    teacher_prenom:  teacherMap.get(s.teacher_id as string)?.prenom ?? '',
    subject_name:    s.subject_name as string,
    room_id:         s.room_id as string | null,
    room_nom:        s.room_id ? (roomMap.get(s.room_id as string) ?? null) : null,
    start_timestamp: s.start_timestamp as string,
    end_timestamp:   s.end_timestamp as string,
    status:          s.status as SessionEvent['status'],
    conflict_reason: s.conflict_reason as string | null,
  }));
}

/** Sessions d'un planning run (admin) */
export async function getSessionsForRun(runId: string): Promise<SessionEvent[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('scheduled_sessions')
    .select('id, class_id, teacher_id, subject_name, room_id, start_timestamp, end_timestamp, status, conflict_reason')
    .eq('run_id', runId)
    .order('start_timestamp');
  return _enrichSessions((data ?? []) as Record<string, unknown>[], admin);
}

// ─── Gestion manuelle des sessions ───────────────────────────────────────────

/** Supprime une session et met à jour les compteurs du run */
export async function deleteManualSession(sessionId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  // Récupérer le run_id avant suppression
  const { data: sess } = await admin
    .from('scheduled_sessions')
    .select('run_id, status')
    .eq('id', sessionId)
    .maybeSingle();
  if (!sess) return { error: 'Session introuvable.' };

  const { error } = await admin.from('scheduled_sessions').delete().eq('id', sessionId);
  if (error) return { error: error.message };

  // Recompter
  const [{ count: draftCount }, { count: validatedCount }, { count: conflictCount }] = await Promise.all([
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', sess.run_id).eq('status', 'DRAFT'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', sess.run_id).eq('status', 'VALIDATED'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', sess.run_id).eq('status', 'CONFLICT_ERROR'),
  ]);
  await admin.from('planning_runs').update({
    total_sessions: (draftCount ?? 0) + (validatedCount ?? 0),
    conflict_count: conflictCount ?? 0,
  }).eq('id', sess.run_id);

  revalidatePath('/dashboard/planning');
  return {};
}

/** Déplace une session (change ses timestamps) */
export async function moveManualSession(
  sessionId: string,
  newStart: string,
  newEnd: string
): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('scheduled_sessions')
    .update({ start_timestamp: newStart, end_timestamp: newEnd })
    .eq('id', sessionId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}

/** Ajoute une session manuellement dans un run */
export async function addManualSession(
  runId: string,
  data: {
    class_id: string;
    teacher_id: string;
    subject_name: string;
    start_timestamp: string;
    end_timestamp: string;
  }
): Promise<{ error?: string; session?: SessionEvent }> {
  await requireAdmin();
  const admin = createAdminClient();

  // Statut = même que les autres sessions du run
  const { data: runData } = await admin
    .from('planning_runs')
    .select('status')
    .eq('id', runId)
    .single();
  const sessionStatus = runData?.status === 'VALIDATED' ? 'VALIDATED' : 'DRAFT';

  const { data: inserted, error } = await admin
    .from('scheduled_sessions')
    .insert({ run_id: runId, status: sessionStatus, ...data })
    .select('id, class_id, teacher_id, subject_name, room_id, start_timestamp, end_timestamp, status, conflict_reason')
    .single();
  if (error || !inserted) return { error: error?.message ?? 'Erreur insertion.' };

  // Recompter
  const [{ count: draftCount }, { count: validatedCount }, { count: conflictCount }] = await Promise.all([
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'DRAFT'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'VALIDATED'),
    admin.from('scheduled_sessions').select('id', { count: 'exact', head: true }).eq('run_id', runId).eq('status', 'CONFLICT_ERROR'),
  ]);
  await admin.from('planning_runs').update({
    total_sessions: (draftCount ?? 0) + (validatedCount ?? 0),
    conflict_count: conflictCount ?? 0,
  }).eq('id', runId);

  const [enriched] = await _enrichSessions([inserted as Record<string, unknown>], admin);
  revalidatePath('/dashboard/planning');
  return { session: enriched };
}

/** Sessions VALIDATED pour un élève (sa classe) */
export async function getSessionsForStudent(classId: string): Promise<SessionEvent[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('scheduled_sessions')
    .select('id, class_id, teacher_id, subject_name, room_id, start_timestamp, end_timestamp, status, conflict_reason')
    .eq('class_id', classId)
    .eq('status', 'VALIDATED')
    .order('start_timestamp');
  return _enrichSessions((data ?? []) as Record<string, unknown>[], admin);
}

/** Sessions VALIDATED pour un professeur */
export async function getSessionsForTeacher(teacherId: string): Promise<SessionEvent[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('scheduled_sessions')
    .select('id, class_id, teacher_id, subject_name, room_id, start_timestamp, end_timestamp, status, conflict_reason')
    .eq('teacher_id', teacherId)
    .eq('status', 'VALIDATED')
    .order('start_timestamp');
  return _enrichSessions((data ?? []) as Record<string, unknown>[], admin);
}
