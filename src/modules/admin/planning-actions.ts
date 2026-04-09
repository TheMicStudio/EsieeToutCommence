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
  const { data } = await admin
    .from('subject_requirements')
    .select('*, teacher_profiles(nom, prenom)')
    .eq('class_id', classId)
    .order('subject_name');

  return (data ?? []).map((r: Record<string, unknown>) => {
    const tp = r.teacher_profiles as { nom: string; prenom: string } | null;
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

export async function createSubjectRequirement(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const class_id             = formData.get('class_id') as string;
  const teacher_id           = formData.get('teacher_id') as string;
  const subject_name         = formData.get('subject_name') as string;
  const total_hours_required = parseFloat(formData.get('total_hours_required') as string);
  const session_duration_h   = parseFloat(formData.get('session_duration_h') as string);

  if (!class_id || !teacher_id || !subject_name || !total_hours_required)
    return { error: 'Tous les champs sont requis.' };
  if (isNaN(total_hours_required) || total_hours_required <= 0)
    return { error: 'Le volume horaire doit être positif.' };

  const { error } = await admin.from('subject_requirements').insert({
    class_id,
    teacher_id,
    subject_name: subject_name.trim(),
    total_hours_required,
    session_duration_h: isNaN(session_duration_h) ? 2.0 : session_duration_h,
  });

  if (error?.code === '23505') return { error: 'Cette matière est déjà assignée à ce prof pour cette classe.' };
  if (error) return { error: error.message };

  revalidatePath('/dashboard/planning');
  return {};
}

export async function deleteSubjectRequirement(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('subject_requirements').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/planning');
  return {};
}
