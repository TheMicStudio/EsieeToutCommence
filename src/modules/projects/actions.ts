'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type {
  ProjectWeek, ProjectGroup, GroupMember,
  SoutenanceSlot, RetroBoard, RetroPostit, PostitType,
  GroupMessage, GroupWhiteboard, WeekCourseMaterial,
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

export async function deleteProjectWeek(weekId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const profile = await getCurrentUserProfile();
  if (!profile) return { error: 'Non authentifié' };

  // Vérifier que l'utilisateur est le créateur ou admin/coordinateur
  const { data: week } = await supabase
    .from('project_weeks')
    .select('cree_par')
    .eq('id', weekId)
    .maybeSingle();

  const isAdmin = profile.role === 'admin' || profile.role === 'coordinateur';
  if (!isAdmin && week?.cree_par !== user.id) {
    return { error: 'Vous ne pouvez supprimer que les semaines que vous avez créées.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('project_weeks').delete().eq('id', weekId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/projets');
  revalidatePath('/dashboard/pedagogie/projets');
  return {};
}

// ── Groupes ──────────────────────────────────────────────────
export async function getGroups(weekId: string): Promise<ProjectGroup[]> {
  const admin = createAdminClient();
  const { data: groups } = await admin
    .from('project_groups')
    .select()
    .eq('week_id', weekId)
    .order('created_at');
  if (!groups) return [];

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
    .insert({ week_id: weekId, group_name: groupName, capacite_max: capaciteMax, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto-rejoindre le groupe créé
  await supabase.from('group_members').insert({ group_id: data.id, student_id: user.id });

  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/groupes`);
  return { group: data };
}

export async function deleteGroup(
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié' };

  const admin = createAdminClient();

  // Vérifier les droits : prof/admin/coordinateur peuvent tout supprimer
  // Un élève ne peut supprimer que le groupe qu'il a créé
  if (!['professeur', 'coordinateur', 'admin'].includes(userProfile.role)) {
    const { data: group } = await admin
      .from('project_groups')
      .select('created_by')
      .eq('id', groupId)
      .single();
    if (!group || group.created_by !== userProfile.profile.id) {
      return { error: 'Vous ne pouvez supprimer que les groupes que vous avez créés.' };
    }
  }

  const { error } = await admin.from('project_groups').delete().eq('id', groupId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/groupes`);
  revalidatePath(`/dashboard/projets/${weekId}`);
  return {};
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
  slidesFileUrl?: string,
  slidesFileName?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  // Vérifier que l'utilisateur est membre du groupe
  const { data: membership } = await supabase
    .from('group_members')
    .select('student_id')
    .eq('group_id', groupId)
    .eq('student_id', user.id)
    .maybeSingle();
  if (!membership) return { error: 'Vous n\'êtes pas membre de ce groupe.' };

  // Admin client pour éviter la récursion RLS (UPDATE project_groups → group_members → project_groups)
  const admin = createAdminClient();
  const { error } = await admin
    .from('project_groups')
    .update({
      repo_url: repoUrl || null,
      slides_url: slidesUrl || null,
      slides_file_url: slidesFileUrl || null,
      slides_file_name: slidesFileName || null,
    })
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
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || (userProfile.role !== 'professeur' && userProfile.role !== 'coordinateur' && userProfile.role !== 'admin')) {
    return { error: 'Seuls les professeurs peuvent noter un groupe.' };
  }

  const admin = createAdminClient();

  // 1. Sauvegarder note + feedback sur le groupe
  const { error } = await admin
    .from('project_groups')
    .update({ note, feedback_prof: feedbackProf, note_par: userProfile.profile.id })
    .eq('id', groupId);

  if (error) return { error: error.message };

  // 2. Récupérer les membres du groupe + infos de la semaine (class_id)
  const { data: group } = await admin
    .from('project_groups')
    .select('week_id, group_name, group_members(student_id), project_weeks(class_id, title)')
    .eq('id', groupId)
    .maybeSingle();

  if (group) {
    const weekMeta = group.project_weeks as unknown as { class_id: string; title: string } | null;
    const classId = weekMeta?.class_id;
    const weekTitle = weekMeta?.title ?? '';
    const members = (group.group_members as unknown as { student_id: string }[]) ?? [];
    const examen = weekTitle ? `${weekTitle} — ${group.group_name}` : group.group_name;

    if (classId && members.length > 0) {
      // Supprimer les anciennes notes pour ce groupe (évite les doublons)
      await admin
        .from('grades')
        .delete()
        .eq('class_id', classId)
        .eq('matiere', 'Projet')
        .eq('examen', examen)
        .in('student_id', members.map((m) => m.student_id));

      // Insérer la nouvelle note pour chaque membre
      const rows = members.map((m) => ({
        student_id: m.student_id,
        teacher_id: userProfile.profile.id,
        class_id: classId,
        matiere: 'Projet',
        examen,
        note,
        coefficient: 1,
      }));

      await admin.from('grades').insert(rows);
    }
  }

  revalidatePath('/dashboard/projets');
  revalidatePath('/dashboard/pedagogie/projets');
  revalidatePath('/dashboard/pedagogie/notes');
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
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Seuls les professeurs peuvent créer des créneaux.' };
  }
  const admin = createAdminClient();
  const rows = slots.map((s) => ({ week_id: weekId, ...s }));
  const { error } = await admin.from('soutenance_slots').insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets`);
  return {};
}

export async function clearSoutenanceSlots(weekId: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Non autorisé.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('soutenance_slots').delete().eq('week_id', weekId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets`);
  return {};
}

export async function randomizeSlots(weekId: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Non autorisé.' };
  }
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
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Non autorisé.' };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('soutenance_slots')
    .update({ heure_debut: heureDebut, heure_fin: heureFin })
    .eq('id', slotId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/soutenances`);
  return {};
}

export async function releaseSlot(
  slotId: string,
  groupId: string,
  weekId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  // Vérifier que le créneau appartient bien au groupe
  const { data: slot } = await admin.from('soutenance_slots').select('group_id').eq('id', slotId).single();
  if (slot?.group_id !== groupId) return { error: 'Ce créneau ne vous appartient pas.' };

  const { error } = await admin
    .from('soutenance_slots')
    .update({ group_id: null })
    .eq('id', slotId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projets/${weekId}/soutenances`);
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
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}/soutenances`);
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

// ── Workspace groupe : chat ───────────────────────────────────

export async function getGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(200);
  return (data as GroupMessage[]) ?? [];
}

export async function sendGroupMessage(
  _prevState: { error?: string; success?: boolean; message?: GroupMessage } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: GroupMessage }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const groupId = formData.get('group_id') as string;
  const contenu = (formData.get('contenu') as string)?.trim();
  if (!contenu) return { error: 'Message vide.' };

  const admin = createAdminClient();
  const { data, error } = await admin.from('group_messages').insert({
    group_id: groupId,
    author_id: userProfile.profile.id,
    contenu,
  }).select('*').single();

  if (error) return { error: 'Erreur lors de l\'envoi.' };
  return { success: true, message: data as GroupMessage };
}

// ── Workspace groupe : tableau blanc ─────────────────────────

export async function getGroupWhiteboard(groupId: string): Promise<GroupWhiteboard | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('group_whiteboard')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle();
  return (data as GroupWhiteboard) ?? null;
}

export async function saveGroupWhiteboard(groupId: string, data: unknown): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('group_whiteboard')
    .upsert({
      group_id: groupId,
      data,
      updated_at: new Date().toISOString(),
      updated_by: userProfile.profile.id,
    }, { onConflict: 'group_id' });

  if (error) return { error: 'Erreur lors de la sauvegarde.' };
  return {};
}

// ── Supports de cours de la semaine ──────────────────────────

export async function getWeekCourseMaterials(weekId: string): Promise<WeekCourseMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('week_course_materials')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: false });
  return (data as WeekCourseMaterial[]) ?? [];
}

export async function addWeekCourseMaterial(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const userProfile = await getCurrentUserProfile();
  const allowed = ['professeur', 'coordinateur', 'admin'];
  if (!userProfile || !allowed.includes(userProfile.role)) return { error: 'Accès refusé.' };

  const weekId = formData.get('week_id') as string;
  const titre = formData.get('titre') as string;
  const type = formData.get('type') as 'video' | 'pdf' | 'lien';
  if (!weekId || !titre || !type) return { error: 'Tous les champs sont requis.' };

  const admin = createAdminClient();
  let url: string;

  const file = formData.get('fichier') as File | null;
  if (file && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) return { error: 'Le fichier ne doit pas dépasser 20 Mo.' };
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `weeks/${weekId}/${Date.now()}-${titre.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from('course_materials')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: 'Erreur lors de l\'upload du fichier.' };
    const { data: publicUrl } = admin.storage.from('course_materials').getPublicUrl(path);
    url = publicUrl.publicUrl;
  } else {
    url = formData.get('url') as string;
    if (!url) return { error: 'Veuillez fournir une URL ou un fichier.' };
  }

  const { error } = await admin.from('week_course_materials').insert({
    week_id: weekId,
    uploaded_by: userProfile.profile.id,
    titre,
    type,
    url,
  });

  if (error) return { error: 'Erreur lors de l\'ajout.' };
  revalidatePath(`/dashboard/projets/${weekId}`);
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}`);
  return { success: true };
}

export async function deleteWeekCourseMaterial(materialId: string, weekId: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  const allowed = ['professeur', 'coordinateur', 'admin'];
  if (!userProfile || !allowed.includes(userProfile.role)) return { error: 'Accès refusé.' };

  const admin = createAdminClient();
  const { error } = await admin.from('week_course_materials').delete().eq('id', materialId);
  if (error) return { error: 'Erreur lors de la suppression.' };
  revalidatePath(`/dashboard/projets/${weekId}`);
  revalidatePath(`/dashboard/pedagogie/projets/${weekId}`);
  return {};
}

// ── Tous les supports accessibles (toutes semaines projets) ──────────────────

export interface AccessibleMaterial extends WeekCourseMaterial {
  week_title: string;
  class_id: string;
  class_nom: string;
}

export async function getAllAccessibleWeekMaterials(): Promise<AccessibleMaterial[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return [];

  const admin = createAdminClient();

  // Déterminer les classes accessibles selon le rôle
  let classIds: string[] = [];

  if (userProfile.role === 'admin' || userProfile.role === 'coordinateur') {
    const { data } = await admin.from('classes').select('id');
    classIds = (data ?? []).map((c: { id: string }) => c.id);
  } else if (userProfile.role === 'professeur') {
    const { data } = await admin
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', userProfile.profile.id);
    const seen = new Set<string>();
    for (const r of data ?? []) seen.add((r as { class_id: string }).class_id);
    classIds = [...seen];
  } else {
    // Étudiant — via class_members
    const { data } = await admin
      .from('class_members')
      .select('class_id')
      .eq('student_id', userProfile.profile.id)
      .eq('is_current', true);
    classIds = (data ?? []).map((r: { class_id: string }) => r.class_id);
    // Fallback student_profiles.class_id
    if (classIds.length === 0 && (userProfile.profile as { class_id?: string }).class_id) {
      classIds = [(userProfile.profile as { class_id: string }).class_id];
    }
  }

  if (classIds.length === 0) return [];

  // Récupérer les semaines projet accessibles
  const { data: weeks } = await admin
    .from('project_weeks')
    .select('id, title, class_id')
    .in('class_id', classIds);

  if (!weeks || weeks.length === 0) return [];

  const weekIds = (weeks as { id: string; title: string; class_id: string }[]).map((w) => w.id);
  const weekMap = new Map(
    (weeks as { id: string; title: string; class_id: string }[]).map((w) => [w.id, w])
  );

  // Récupérer les noms des classes
  const { data: classes } = await admin
    .from('classes')
    .select('id, nom')
    .in('id', classIds);
  const classMap = new Map((classes ?? []).map((c: { id: string; nom: string }) => [c.id, c.nom]));

  // Récupérer les supports
  const { data: materials } = await admin
    .from('week_course_materials')
    .select('*')
    .in('week_id', weekIds)
    .order('created_at', { ascending: false });

  if (!materials) return [];

  return (materials as WeekCourseMaterial[]).map((m) => {
    const week = weekMap.get(m.week_id);
    return {
      ...m,
      week_title: week?.title ?? '',
      class_id: week?.class_id ?? '',
      class_nom: classMap.get(week?.class_id ?? '') ?? '',
    };
  });
}
