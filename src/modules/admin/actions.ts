'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassRow {
  id: string;
  nom: string;
  annee: number;
  created_at: string;
  member_count: number;
  teacher_count: number;
}

export interface StudentRow {
  id: string;
  nom: string;
  prenom: string;
  type_parcours: string;
  class_id: string | null;
  class_nom: string | null;
}

export interface TeacherRow {
  id: string;
  nom: string;
  prenom: string;
  matieres_enseignees: string[];
}

// ─── Guard admin ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé.');
  return profile;
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(): Promise<ClassRow[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: classes } = await admin
    .from('classes')
    .select('*')
    .order('annee', { ascending: false });

  if (!classes) return [];

  const result: ClassRow[] = await Promise.all(
    classes.map(async (c) => {
      const { count: memberCount } = await admin
        .from('class_members')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', c.id)
        .eq('is_current', true);

      const { data: teacherData } = await admin
        .from('teacher_classes')
        .select('teacher_id')
        .eq('class_id', c.id);

      const uniqueTeachers = new Set(teacherData?.map((t) => t.teacher_id) ?? []);

      return {
        ...c,
        member_count: memberCount ?? 0,
        teacher_count: uniqueTeachers.size,
      };
    })
  );

  return result;
}

export async function createClass(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const nom = formData.get('nom') as string;
  const annee = parseInt(formData.get('annee') as string);

  if (!nom || !annee) return { error: 'Nom et année sont requis.' };

  const admin = createAdminClient();
  const { error } = await admin.from('classes').insert({ nom, annee });

  if (error) return { error: 'Erreur lors de la création.' };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteClass(classId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('classes').delete().eq('id', classId);
  revalidatePath('/dashboard/admin');
}

// ─── Étudiants ────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<StudentRow[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: students } = await admin
    .from('student_profiles')
    .select('id, nom, prenom, type_parcours');

  if (!students) return [];

  const { data: members } = await admin
    .from('class_members')
    .select('student_id, classes(id, nom)')
    .eq('is_current', true);

  const memberMap = new Map<string, { class_id: string; class_nom: string }>();
  for (const m of members ?? []) {
    const cls = m.classes as unknown as { id: string; nom: string } | null;
    if (cls) memberMap.set(m.student_id, { class_id: cls.id, class_nom: cls.nom });
  }

  return students.map((s) => ({
    ...s,
    class_id: memberMap.get(s.id)?.class_id ?? null,
    class_nom: memberMap.get(s.id)?.class_nom ?? null,
  }));
}

export async function assignStudentToClass(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const studentId = formData.get('student_id') as string;
  const classId = formData.get('class_id') as string;

  if (!studentId || !classId) return { error: 'Données manquantes.' };

  const admin = createAdminClient();
  // Archiver l'ancienne affectation (is_current = false) pour garder l'historique
  await admin.from('class_members').update({ is_current: false }).eq('student_id', studentId).eq('is_current', true);
  // Insérer la nouvelle affectation comme classe courante
  const { error } = await admin.from('class_members').insert({ class_id: classId, student_id: studentId, is_current: true });

  if (error) return { error: 'Erreur lors de l\'affectation.' };

  // Synchroniser student_profiles.class_id (utilisé par l'emploi du temps et autres modules)
  await admin.from('student_profiles').update({ class_id: classId }).eq('id', studentId);

  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function removeStudentFromClass(studentId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('class_members').delete().eq('student_id', studentId);
  revalidatePath('/dashboard/admin');
}

// ─── Profs ────────────────────────────────────────────────────────────────────

export async function getTeachers(): Promise<TeacherRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from('teacher_profiles').select('id, nom, prenom, matieres_enseignees');
  return (data as TeacherRow[]) ?? [];
}

export async function assignTeacherToClass(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const teacherId = formData.get('teacher_id') as string;
  const classId = formData.get('class_id') as string;
  const matiere = formData.get('matiere') as string;

  if (!teacherId || !classId || !matiere) return { error: 'Données manquantes.' };

  const admin = createAdminClient();
  const { error } = await admin.from('teacher_classes').upsert(
    { class_id: classId, teacher_id: teacherId, matiere },
    { onConflict: 'class_id,teacher_id,matiere' }
  );

  if (error) return { error: 'Erreur lors de l\'affectation.' };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function removeTeacherFromClass(teacherId: string, classId: string, matiere: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from('teacher_classes')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('matiere', matiere);
  revalidatePath('/dashboard/admin');
}

export async function getClassTeacherAssignments(classId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // teacher_classes.teacher_id → auth.users, pas teacher_profiles → join manuelle
  const { data: assignments } = await admin
    .from('teacher_classes')
    .select('teacher_id, matiere')
    .eq('class_id', classId);

  if (!assignments || assignments.length === 0) return [];

  const teacherIds = [...new Set(assignments.map((a) => a.teacher_id))];
  const { data: profiles } = await admin
    .from('teacher_profiles')
    .select('id, nom, prenom')
    .in('id', teacherIds);

  const profileMap = new Map<string, { nom: string; prenom: string }>();
  for (const p of profiles ?? []) profileMap.set(p.id, { nom: p.nom, prenom: p.prenom });

  return assignments.map((a) => ({
    teacher_id: a.teacher_id,
    matiere: a.matiere,
    teacher_profiles: profileMap.get(a.teacher_id) ?? null,
  }));
}

export async function getClassMembers(classId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from('class_members')
    .select('student_id, student_profiles(nom, prenom, type_parcours)')
    .eq('class_id', classId);

  return data ?? [];
}
