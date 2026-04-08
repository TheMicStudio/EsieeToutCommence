'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ParentMessage, ParentStudentLink } from './types';

// ── Liens parent-enfant ───────────────────────────────────────

export async function getMyLinks(): Promise<ParentStudentLink[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();

  const { data: links } = await admin
    .from('parent_student_links')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at');

  if (!links || links.length === 0) return [];

  const studentIds = links.map((l) => l.student_id as string);

  // Profils élèves
  const { data: students } = await admin
    .from('student_profiles')
    .select('id, nom, prenom, class_id')
    .in('id', studentIds);

  // Classes
  const classIds = [...new Set((students ?? []).map((s) => s.class_id).filter(Boolean) as string[])];
  const { data: classes } = classIds.length > 0
    ? await admin.from('classes').select('id, nom').in('id', classIds)
    : { data: [] };

  const classMap = new Map((classes ?? []).map((c) => [c.id, c.nom]));
  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

  return links.map((l) => {
    const student = studentMap.get(l.student_id);
    return {
      ...l,
      student_nom: student?.nom,
      student_prenom: student?.prenom,
      student_class: student?.class_id ? classMap.get(student.class_id) : undefined,
      student_class_id: student?.class_id ?? undefined,
    };
  });
}

export async function linkChild(
  childEmail: string,
): Promise<{ error?: string; linked?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const admin = createAdminClient();

  // Trouver l'élève par email
  const { data: student } = await admin
    .from('student_profiles')
    .select('id')
    .eq('email', childEmail.trim().toLowerCase())
    .maybeSingle();

  if (!student) return { error: 'Aucun élève trouvé avec cet email. Vérifiez avec l\'administration.' };

  // Créer le lien
  const { error } = await supabase
    .from('parent_student_links')
    .insert({ parent_id: user.id, student_id: student.id });

  if (error) {
    if (error.code === '23505') return { error: 'Ce lien existe déjà.' };
    return { error: error.message };
  }

  revalidatePath('/dashboard/enfant');
  revalidatePath('/dashboard');
  return { linked: true };
}

export async function unlinkChild(linkId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('parent_student_links')
    .delete()
    .eq('id', linkId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/enfant');
  revalidatePath('/dashboard');
  return {};
}

// ── Notes et présence de l'enfant ────────────────────────────

export async function getChildGrades(studentId: string, classId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('grades')
    .select('*, subject_id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getChildAttendance(studentId: string) {
  const admin = createAdminClient();

  const { data: records } = await admin
    .from('attendance_records')
    .select('*, attendance_sessions(created_at, class_id)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);

  return records ?? [];
}

// ── Messages parent ↔ école ───────────────────────────────────

export async function getParentMessages(linkId: string): Promise<ParentMessage[]> {
  const admin = createAdminClient();

  const { data: messages } = await admin
    .from('parent_messages')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at');

  if (!messages || messages.length === 0) return [];

  const authorIds = [...new Set(messages.map((m) => m.author_id as string))];

  const [{ data: students }, { data: teachers }, { data: admins }, { data: parents }] =
    await Promise.all([
      admin.from('student_profiles').select('id, nom, prenom').in('id', authorIds),
      admin.from('teacher_profiles').select('id, nom, prenom').in('id', authorIds),
      admin.from('admin_profiles').select('id, nom, prenom').in('id', authorIds),
      admin.from('parent_profiles').select('id, nom, prenom').in('id', authorIds),
    ]);

  const nameMap = new Map<string, { name: string; role: string }>();
  for (const p of students ?? []) nameMap.set(p.id, { name: `${p.prenom} ${p.nom}`, role: 'Élève' });
  for (const p of teachers ?? []) nameMap.set(p.id, { name: `${p.prenom} ${p.nom}`, role: 'Professeur' });
  for (const p of admins ?? []) nameMap.set(p.id, { name: `${p.prenom} ${p.nom}`, role: 'Administration' });
  for (const p of parents ?? []) nameMap.set(p.id, { name: `${p.prenom} ${p.nom}`, role: 'Parent' });

  return messages.map((m) => ({
    ...m,
    author_name: nameMap.get(m.author_id)?.name ?? 'Inconnu',
    author_role: nameMap.get(m.author_id)?.role,
  }));
}

export async function sendParentMessage(
  linkId: string,
  content: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { error } = await supabase
    .from('parent_messages')
    .insert({ link_id: linkId, author_id: user.id, content: content.trim() });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/parent/messages');
  revalidatePath('/dashboard/communication');
  return {};
}

// ── Pour les profs/admins : voir tous les threads parents ────

export async function getAllParentThreads() {
  const admin = createAdminClient();

  const { data: links } = await admin
    .from('parent_student_links')
    .select('id, parent_id, student_id, created_at')
    .order('created_at', { ascending: false });

  if (!links || links.length === 0) return [];

  const parentIds = [...new Set(links.map((l) => l.parent_id as string))];
  const studentIds = [...new Set(links.map((l) => l.student_id as string))];

  const [{ data: parents }, { data: students }] = await Promise.all([
    admin.from('parent_profiles').select('id, nom, prenom').in('id', parentIds),
    admin.from('student_profiles').select('id, nom, prenom, class_id').in('id', studentIds),
  ]);

  const parentMap = new Map((parents ?? []).map((p) => [p.id, `${p.prenom} ${p.nom}`]));
  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

  // Dernier message par thread
  const { data: lastMessages } = await admin
    .from('parent_messages')
    .select('link_id, content, created_at')
    .in('link_id', links.map((l) => l.id))
    .order('created_at', { ascending: false });

  const lastMsgMap = new Map<string, { content: string; created_at: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastMsgMap.has(m.link_id)) lastMsgMap.set(m.link_id, m);
  }

  return links.map((l) => {
    const student = studentMap.get(l.student_id);
    return {
      id: l.id,
      parent_name: parentMap.get(l.parent_id) ?? 'Inconnu',
      student_name: student ? `${student.prenom} ${student.nom}` : 'Inconnu',
      student_class_id: student?.class_id,
      last_message: lastMsgMap.get(l.id),
    };
  });
}
