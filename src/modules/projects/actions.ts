'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

  // Créer le board de rétro associé
  await supabase.from('retro_boards').insert({ week_id: data.id });

  revalidatePath('/dashboard/projets');
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

  // Fetch members + profiles
  const { data: members } = await supabase
    .from('group_members')
    .select('group_id, student_id, joined_at, student_profiles(nom, prenom)')
    .in('group_id', groups.map((g) => g.id));

  const membersMap: Record<string, GroupMember[]> = {};
  for (const m of members ?? []) {
    const profile = m.student_profiles as unknown as { nom: string; prenom: string } | null;
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

  revalidatePath(`/dashboard/projets/${weekId}/groupes`);
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

  revalidatePath(`/dashboard/projets/${weekId}/groupes`);
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
  revalidatePath(`/dashboard/projets/${weekId}/groupes`);
  return {};
}

export async function updateGroupLinks(
  groupId: string,
  repoUrl: string,
  slidesUrl: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('project_groups')
    .update({ repo_url: repoUrl || null, slides_url: slidesUrl || null })
    .eq('id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/projets');
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

  const { error } = await supabase
    .from('project_groups')
    .update({ note, feedback_prof: feedbackProf, note_par: user.id })
    .eq('id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/projets');
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
  const supabase = await createClient();
  const rows = slots.map((s) => ({ week_id: weekId, ...s }));
  const { error } = await supabase.from('soutenance_slots').insert(rows);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/projets');
  return {};
}

export async function bookSlot(
  slotId: string,
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('soutenance_slots')
    .update({ group_id: groupId })
    .eq('id', slotId)
    .is('group_id', null);

  if (error) return { error: 'Ce créneau vient d\'être pris' };
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
  return data ?? null;
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
  revalidatePath('/dashboard/projets');
  return {};
}

export async function getRetroPostits(boardId: string): Promise<RetroPostit[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('retro_postits')
    .select('*, student_profiles(nom, prenom)')
    .eq('board_id', boardId)
    .order('created_at');

  return (data ?? []).map((p) => {
    const profile = p.student_profiles as unknown as { nom: string; prenom: string } | null;
    return {
      ...p,
      author_name: p.is_anonymous ? 'Anonyme' : profile ? `${profile.prenom} ${profile.nom}` : 'Inconnu',
    };
  });
}

export async function addPostit(
  boardId: string,
  type: PostitType,
  content: string,
  isAnonymous: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { error } = await supabase.from('retro_postits').insert({
    board_id: boardId, type, content, is_anonymous: isAnonymous, author_id: user.id,
  });
  if (error) return { error: error.message };
  return {};
}

export async function deletePostit(postitId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('retro_postits').delete().eq('id', postitId);
  if (error) return { error: error.message };
  return {};
}
