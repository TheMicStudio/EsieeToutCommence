'use server';

import { createAdminClient } from '@/lib/supabase/admin';
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


// ─── Guard admin ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (profile?.role !== 'admin') throw new Error('Accès refusé.');
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
  const annee = Number.parseInt(formData.get('annee') as string);

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


export async function getClassMembers(classId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from('class_members')
    .select('student_id, student_profiles(nom, prenom, type_parcours)')
    .eq('class_id', classId);

  return data ?? [];
}
