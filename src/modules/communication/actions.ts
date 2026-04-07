'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type { ActionState, StaffChannel, StaffContact, StaffMessage } from './types';

function isStaffRole(role: string) {
  return role === 'professeur' || role === 'admin';
}

export async function getStaffChannels(): Promise<StaffChannel[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !isStaffRole(userProfile.role)) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('staff_channels').select('*').order('created_at');
  return (data as StaffChannel[]) ?? [];
}

export async function createStaffChannel(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const nom = formData.get('nom') as string;
  if (!nom?.trim()) return { error: 'Le nom du canal est requis.' };

  const supabase = await createClient();
  const { error } = await supabase.from('staff_channels').insert({
    nom: nom.trim(),
    description: (formData.get('description') as string) || null,
    cree_par: userProfile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la création du canal.' };
  revalidatePath('/dashboard/communication');
  return { success: true };
}

export async function deleteStaffChannel(channelId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_channels').delete().eq('id', channelId);

  if (error) return { error: 'Erreur lors de la suppression.' };
  revalidatePath('/dashboard/communication');
  return { success: true };
}

export async function getChannelMessages(channelId: string): Promise<StaffMessage[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !isStaffRole(userProfile.role)) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('staff_messages').select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100);
  return (data as StaffMessage[]) ?? [];
}

export async function sendStaffMessage(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !isStaffRole(userProfile.role)) return { error: 'Accès refusé.' };

  const channelId = formData.get('channel_id') as string;
  const contenu = (formData.get('contenu') as string)?.trim();
  if (!contenu) return { error: 'Message vide.' };

  const supabase = await createClient();
  const { error } = await supabase.from('staff_messages').insert({
    channel_id: channelId, author_id: userProfile.profile.id, contenu,
  });

  if (error) return { error: 'Erreur lors de l\'envoi.' };
  return { success: true };
}

export async function getStaffDirectory(): Promise<StaffContact[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !isStaffRole(userProfile.role)) return [];

  const supabase = await createClient();
  const [{ data: teachers }, { data: admins }] = await Promise.all([
    supabase.from('teacher_profiles').select('id, nom, prenom, matieres_enseignees'),
    supabase.from('admin_profiles').select('id, nom, prenom, fonction'),
  ]);

  const contacts: StaffContact[] = [
    ...((teachers ?? []).map((t) => ({
      id: t.id as string, nom: t.nom as string, prenom: t.prenom as string,
      role: 'professeur' as const,
      matieres_enseignees: t.matieres_enseignees as string[],
    }))),
    ...((admins ?? []).map((a) => ({
      id: a.id as string, nom: a.nom as string, prenom: a.prenom as string,
      role: 'admin' as const,
      fonction: a.fonction as string | undefined,
    }))),
  ];

  return contacts.sort((a, b) => a.nom.localeCompare(b.nom));
}
