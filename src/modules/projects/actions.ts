'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ProjectWeek, ProjectGroup, GroupMember,
  SoutenanceSlot, RetroBoard, RetroPostit, PostitType,
} from './types';

// ── Semaines projets ─────────────────────────────────────────
export async function getProjectWeeks(classId: string): Promise<ProjectWeek[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('project_weeks')
    .select()
    .eq('class_id', classId)
    .order('start_date');
  return data ?? [];
}

export async function createProjectWeek(
  classId: string,
  title: string,
  startDate: string,
  endDate: string,
): Promise<{ week?: ProjectWeek; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('project_weeks')
    .insert({ class_id: classId, title, start_date: startDate, end_date: endDate, cree_par: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // Créer le board de rétro via admin (bypass RLS)
  const admin = createAdminClient();
  await admin.from('retro_boards').insert({ week_id: data.id });

  revalidatePath('/dashboard/pedagogie/projets');
  return { week: data };
}

// ── Groupes ──────────────────────────────────────────────────
export async function getGroups(weekId: string): Promise<ProjectGroup[]> {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from('project_groups')
    .select()
    .eq('week_id', weekId)
    .order('created_at');
  if (!groups) return [];

  // Fetch members (admin pour bypass RLS + résoudre les noms via deux requêtes séparées)
  const admin = createAdminClient();
  const groupIds = groups.map((g) => g.id);

  const { data: members } = await admin
    .from('group_members')
    .select('group_id, student_id, joined_at')
    .in('group_id', groupIds);

  const studentIds = [...new Set((members ?? []).map((m) => m.student_id as string))];
  const { data: profiles } = studentIds.length > 0
    ? await admin.from('student_profiles').select('id, nom, prenom').in('id', studentIds)
    : { data: [] };

  const profileMap = new Map<string, { nom: string; prenom: string }>();
  for (const p of profiles ?? []) profileMap.set(p.id, { nom: p.nom, prenom: p.prenom });

  const membersMap: Record<string, GroupMember[]> = {};
  for (const m of members ?? []) {
    const profile = profileMap.get(m.student_id as string);
    const member: GroupMember = {
      group_id: m.group_id,
      student_id: m.student_id,
      joined_at: m.joined_at,
      nom: profile?.nom,
      prenom: profile?.prenom,
    };
    if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
    membersMap[m.group_id].push(member);
  }

  return groups.map((g) => ({ ...g, members: membersMap[g.id] ?? [] }));
}

export async function createGroup(
  weekId: string,
  groupName: string,
  capaciteMax: number,
): Promise<{ group?: ProjectGroup; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('project_groups')
    .insert({ week_id: weekId, group_name: groupName, capacite_max: capaciteMax })
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto-rejoindre le groupe créé
  await supabase.from('group_members').insert({ group_id: data.id, student_id: user.id });

  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/groupes`);
  return { group: data };
}

export async function joinGroup(
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  // Vérifier qu'il n'est pas déjà dans un groupe de cette semaine
  const { data: existing } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('student_id', user.id)
    .in('group_id', (await supabase.from('project_groups').select('id').eq('week_id', weekId)).data?.map((g) => g.id) ?? []);
  if (existing && existing.length > 0) return { error: 'Vous êtes déjà dans un groupe pour cette semaine' };

  // Vérifier la capacité
  const { data: group } = await supabase.from('project_groups').select('capacite_max').eq('id', groupId).single();
  const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId);
  if (group && count !== null && count >= group.capacite_max) return { error: 'Ce groupe est complet' };

  const { error } = await supabase.from('group_members').insert({ group_id: groupId, student_id: user.id });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/groupes`);
  return {};
}

export async function leaveGroup(
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('student_id', user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/groupes`);
  return {};
}

export async function updateGroupLinks(
  groupId: string,
  repoUrl: string,
  slidesUrl: string,
): Promise<{ error?: string }> {
  // Admin client pour éviter la récursion RLS (UPDATE project_groups → group_members → project_groups)
  const admin = createAdminClient();
  const { error } = await admin
    .from('project_groups')
    .update({ repo_url: repoUrl || null, slides_url: slidesUrl || null })
    .eq('id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/pedagogie/projets');
  return {};
}

export async function gradeGroup(
  groupId: string,
  note: number,
  feedbackProf: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  // Admin client pour la même raison (récursion RLS sur project_groups UPDATE)
  const admin = createAdminClient();
  const { error } = await admin
    .from('project_groups')
    .update({ note, feedback_prof: feedbackProf, note_par: user.id })
    .eq('id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/pedagogie/projets');
  return {};
}

// ── Créneaux de soutenance ───────────────────────────────────
export async function getSoutenanceSlots(weekId: string): Promise<SoutenanceSlot[]> {
  const supabase = await createClient();
  const { data: slots } = await supabase
    .from('soutenance_slots')
    .select('*, project_groups(group_name)')
    .eq('week_id', weekId)
    .order('heure_debut');

  return (slots ?? []).map((s) => ({
    ...s,
    group_name: (s.project_groups as unknown as { group_name: string } | null)?.group_name,
  }));
}

export async function createSoutenanceSlots(
  weekId: string,
  slots: { heure_debut: string; heure_fin: string }[],
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const rows = slots.map((s) => ({ week_id: weekId, ...s }));
  const { error } = await admin.from('soutenance_slots').insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets`);
  return {};
}

export async function clearSoutenanceSlots(weekId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from('soutenance_slots').delete().eq('week_id', weekId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets`);
  return {};
}

export async function randomizeSlots(weekId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();

  // Récupérer créneaux libres + groupes
  const [{ data: slots }, { data: groups }] = await Promise.all([
    admin.from('soutenance_slots').select('id').eq('week_id', weekId).order('heure_debut'),
    admin.from('project_groups').select('id').eq('week_id', weekId),
  ]);

  if (!slots || !groups) return { error: 'Données introuvables' };

  // Reset toutes les assignations
  await admin.from('soutenance_slots').update({ group_id: null }).eq('week_id', weekId);

  // Mélanger les groupes (Fisher-Yates)
  const shuffled = [...groups];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Assigner chaque groupe à un créneau
  const updates = slots.slice(0, shuffled.length).map((slot, i) => ({
    id: slot.id,
    group_id: shuffled[i].id,
  }));

  for (const u of updates) {
    await admin.from('soutenance_slots').update({ group_id: u.group_id }).eq('id', u.id);
  }

  revalidatePath(`/dashboard/pedagogie/projets`);
  return {};
}

export async function updateSlot(
  slotId: string,
  heureDebut: string,
  heureFin: string,
  weekId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('soutenance_slots')
    .update({ heure_debut: heureDebut, heure_fin: heureFin })
    .eq('id', slotId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/soutenances`);
  return {};
}

export async function bookSlot(
  slotId: string,
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  // Vérifier que le créneau est libre
  const { data: slot } = await admin.from('soutenance_slots').select('group_id').eq('id', slotId).single();
  if (slot?.group_id) return { error: 'Ce créneau vient d\'être pris.' };

  // Vérifier que le groupe n'a pas déjà réservé un autre créneau sur cette semaine
  const { data: existingBooking } = await admin
    .from('soutenance_slots')
    .select('id')
    .eq('week_id', weekId)
    .eq('group_id', groupId)
    .maybeSingle();
  if (existingBooking) return { error: 'Votre groupe a déjà réservé un créneau pour cette semaine.' };

  const { error } = await admin
    .from('soutenance_slots')
    .update({ group_id: groupId })
    .eq('id', slotId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projets/${weekId}/soutenances`);
  return {};
}

// ── Rétro board ──────────────────────────────────────────────
export async function getRetroBoard(weekId: string): Promise<RetroBoard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('retro_boards')
    .select()
    .eq('week_id', weekId)
    .maybeSingle();

  if (data) return data;

  // Auto-création si absent (semaines créées avant le fix RLS)
  const admin = createAdminClient();
  const { data: created } = await admin
    .from('retro_boards')
    .insert({ week_id: weekId })
    .select()
    .single();
  return created ?? null;
}

export async function toggleRetroBoard(
  boardId: string,
  isOpen: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('retro_boards')
    .update({ is_open: isOpen })
    .eq('id', boardId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/pedagogie/projets');
  return {};
}

export async function getRetroPostits(boardId: string): Promise<RetroPostit[]> {
  const admin = createAdminClient();

  const { data: postits } = await admin
    .from('retro_postits')
    .select()
    .eq('board_id', boardId)
    .order('created_at');

  if (!postits || postits.length === 0) return [];

  // Récupérer les noms via student_profiles et teacher_profiles
  const authorIds = [...new Set(postits.map((p) => p.author_id as string))];

  const [{ data: students }, { data: teachers }] = await Promise.all([
    admin.from('student_profiles').select('id, nom, prenom').in('id', authorIds),
    admin.from('teacher_profiles').select('id, nom, prenom').in('id', authorIds),
  ]);

  const nameMap = new Map<string, string>();
  for (const s of students ?? []) nameMap.set(s.id, `${s.prenom} ${s.nom}`);
  for (const t of teachers ?? []) nameMap.set(t.id, `${t.prenom} ${t.nom}`);

  return postits.map((p) => ({
    ...p,
    author_name: p.is_anonymous ? 'Anonyme' : (nameMap.get(p.author_id) ?? 'Inconnu'),
  }));
}

export async function addPostit(
  boardId: string,
  type: PostitType,
  content: string,
  isAnonymous: boolean,
): Promise<{ postit?: RetroPostit; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('retro_postits')
    .insert({ board_id: boardId, type, content, is_anonymous: isAnonymous, author_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  return { postit: data as RetroPostit };
}

export async function deletePostit(postitId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('retro_postits').delete().eq('id', postitId);
  if (error) return { error: error.message };
  return {};
}
