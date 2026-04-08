'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type {
  ActionState,
  ApprenticeshipEntry,
  CareerEvent,
  JobOffer,
  TripartiteChat,
  TripartiteMessage,
} from './types';

// ─── Job Board ────────────────────────────────────────────────────────────────

export async function getJobOffers(): Promise<JobOffer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('job_offers')
    .select('*')
    .eq('actif', true)
    .order('created_at', { ascending: false });
  return (data as JobOffer[]) ?? [];
}

export async function publishJobOffer(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const titre = formData.get('titre') as string;
  const entreprise = formData.get('entreprise') as string;
  const type_contrat = formData.get('type_contrat') as string;
  const description = formData.get('description') as string;
  const localisation = formData.get('localisation') as string;
  const lien_candidature = formData.get('lien_candidature') as string;

  if (!titre || !entreprise || !type_contrat) {
    return { error: 'Titre, entreprise et type de contrat sont requis.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('job_offers').insert({
    titre, entreprise, type_contrat, description, localisation,
    lien_candidature, publie_par: userProfile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la publication.' };
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/carriere/job-board');
  return { success: true };
}

export async function toggleJobOffer(offerId: string, actif: boolean): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('job_offers').update({ actif }).eq('id', offerId);
  if (error) return { error: 'Erreur lors de la mise à jour.' };
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/carriere/job-board');
  return { success: true };
}

// ─── Événements ───────────────────────────────────────────────────────────────

export async function getCareerEvents(): Promise<CareerEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('career_events')
    .select('*')
    .order('date_debut', { ascending: true });
  return (data as CareerEvent[]) ?? [];
}

export async function publishCareerEvent(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Accès refusé.' };
  const { getUserPermissions } = await import('@/lib/permissions');
  const perms = await getUserPermissions(userProfile.profile.id, userProfile.role);
  if (!perms.has('career_event.manage')) return { error: 'Accès refusé.' };

  const titre = formData.get('titre') as string;
  const date_debut = formData.get('date_debut') as string;

  if (!titre || !date_debut) return { error: 'Titre et date sont requis.' };

  const supabase = await createClient();
  const { error } = await supabase.from('career_events').insert({
    titre,
    date_debut,
    description: formData.get('description') as string,
    lieu: formData.get('lieu') as string,
    date_fin: (formData.get('date_fin') as string) || null,
    publie_par: userProfile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la publication.' };
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/carriere/evenements');
  return { success: true };
}

export async function getAllJobOffers(): Promise<JobOffer[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('job_offers')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as JobOffer[]) ?? [];
}

export async function deleteJobOffer(offerId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase.from('job_offers').delete().eq('id', offerId);
  if (error) return { error: 'Erreur lors de la suppression.' };
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/carriere/job-board');
  return { success: true };
}

export async function getAllCareerEvents(): Promise<CareerEvent[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('career_events')
    .select('*')
    .order('date_debut', { ascending: true });
  return (data as CareerEvent[]) ?? [];
}

export async function deleteCareerEvent(eventId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase.from('career_events').delete().eq('id', eventId);
  if (error) return { error: 'Erreur lors de la suppression.' };
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/carriere/evenements');
  return { success: true };
}

export async function registerToEvent(eventId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase.from('event_registrations').insert({
    event_id: eventId, student_id: userProfile.profile.id,
  });

  if (error?.code === '23505') return { error: 'Déjà inscrit.' };
  if (error) return { error: 'Erreur lors de l\'inscription.' };
  revalidatePath('/dashboard/carriere/evenements');
  return { success: true };
}

export async function unregisterFromEvent(eventId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase.from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('student_id', userProfile.profile.id);

  if (error) return { error: 'Erreur lors de la désinscription.' };
  revalidatePath('/dashboard/carriere/evenements');
  return { success: true };
}

export async function getMyEventRegistrations(): Promise<string[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('student_id', userProfile.profile.id);
  return (data ?? []).map((r) => r.event_id as string);
}

// ─── Chat Tripartite ──────────────────────────────────────────────────────────

export async function getMyTripartiteChat(): Promise<TripartiteChat | null> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const supabase = await createClient();
  const uid = userProfile.profile.id;

  let query = supabase.from('tripartite_chats').select('*');

  if (userProfile.role === 'eleve') {
    if (userProfile.profile.type_parcours !== 'alternant') return null;
    query = query.eq('student_id', uid);
  } else if (userProfile.role === 'admin') {
    query = query.eq('referent_id', uid);
  } else if (userProfile.role === 'entreprise') {
    query = query.eq('maitre_id', uid);
  } else {
    return null;
  }

  const { data } = await query.single();
  return (data as TripartiteChat) ?? null;
}

export async function getTripartiteMessages(chatId: string): Promise<TripartiteMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tripartite_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100);
  return (data as TripartiteMessage[]) ?? [];
}

export async function sendTripartiteMessage(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const chatId = formData.get('chat_id') as string;
  const contenu = (formData.get('contenu') as string)?.trim();
  if (!contenu) return { error: 'Message vide.' };

  const supabase = await createClient();
  const { error } = await supabase.from('tripartite_messages').insert({
    chat_id: chatId, author_id: userProfile.profile.id, contenu,
  });

  if (error) return { error: 'Erreur lors de l\'envoi.' };
  return { success: true };
}

// ─── Livret d'apprentissage ───────────────────────────────────────────────────

export async function getMyEntries(): Promise<ApprenticeshipEntry[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return [];

  const supabase = await createClient();
  const uid = userProfile.profile.id;

  let query = supabase.from('apprenticeship_entries').select('*');
  if (userProfile.role === 'eleve') query = query.eq('student_id', uid);

  const { data } = await query.order('created_at', { ascending: false });
  return (data as ApprenticeshipEntry[]) ?? [];
}

export async function uploadApprenticeshipEntry(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return { error: 'Accès refusé.' };
  if (userProfile.profile.type_parcours !== 'alternant') return { error: 'Réservé aux alternants.' };

  const chatId = formData.get('chat_id') as string;
  const titre = formData.get('titre') as string;
  const description = formData.get('description') as string;
  const file = formData.get('fichier') as File;

  if (!chatId || !titre || !file || file.size === 0) {
    return { error: 'Titre et fichier sont requis.' };
  }

  const supabase = await createClient();
  const filePath = `${userProfile.profile.id}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('apprenticeship-files')
    .upload(filePath, file);

  if (uploadError) return { error: 'Erreur lors de l\'upload du fichier.' };

  const { data: urlData } = supabase.storage
    .from('apprenticeship-files')
    .getPublicUrl(filePath);

  const { error } = await supabase.from('apprenticeship_entries').insert({
    student_id: userProfile.profile.id,
    chat_id: chatId,
    titre,
    description,
    fichier_url: urlData.publicUrl,
  });

  if (error) return { error: 'Erreur lors de l\'enregistrement.' };
  revalidatePath('/dashboard/carriere/livret');
  return { success: true };
}

export async function validateEntry(
  entryId: string,
  note: number | null,
  statut: 'valide' | 'refuse' | 'en_revision'
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !['admin', 'entreprise'].includes(userProfile.role)) {
    return { error: 'Accès refusé.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('apprenticeship_entries')
    .update({ statut, note: note ?? null, valide_par: userProfile.profile.id })
    .eq('id', entryId);

  if (error) return { error: 'Erreur lors de la validation.' };
  revalidatePath('/dashboard/carriere/livret');
  return { success: true };
}
