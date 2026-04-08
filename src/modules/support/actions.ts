'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type { ActionState, AdminContact, FaqArticle, Ticket, TicketCategorie, TicketMessage, TicketStatut } from './types';

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function createTicket(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const sujet = formData.get('sujet') as string;
  const description = formData.get('description') as string;
  const categorie = formData.get('categorie') as TicketCategorie;
  const auNomDeLaClasse = formData.get('au_nom_de_classe') === 'on';
  const attachmentUrl = (formData.get('attachment_url') as string) || null;
  const attachmentName = (formData.get('attachment_name') as string) || null;

  if (!sujet || !description || !categorie) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (auNomDeLaClasse) {
    if (userProfile.role !== 'eleve' || userProfile.profile.role_secondaire !== 'delegue') {
      return { error: 'Seuls les délégués peuvent ouvrir un ticket au nom de la classe.' };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tickets').insert({
    sujet, description, categorie,
    auteur_id: userProfile.profile.id,
    au_nom_de_classe: auNomDeLaClasse,
    class_id: auNomDeLaClasse && userProfile.role === 'eleve' ? userProfile.profile.class_id : null,
    attachment_url: attachmentUrl,
    attachment_name: attachmentName,
  });

  if (error) return { error: 'Erreur lors de la création du ticket.' };
  redirect('/dashboard/support');
}

export async function getMyTickets(): Promise<Ticket[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('auteur_id', userProfile.profile.id)
    .order('created_at', { ascending: false });

  return (data as Ticket[]) ?? [];
}

export async function getAllTickets(): Promise<Ticket[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  return (data as Ticket[]) ?? [];
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tickets').select('*').eq('id', ticketId).single();
  return (data as Ticket) ?? null;
}

export async function updateTicketStatus(
  ticketId: string,
  statut: TicketStatut
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tickets').update({ statut }).eq('id', ticketId);

  if (error) return { error: 'Erreur lors de la mise à jour.' };
  revalidatePath('/dashboard/support');
  revalidatePath('/dashboard/support/admin');
  return { success: true };
}

export async function addTicketMessage(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const ticketId = formData.get('ticket_id') as string;
  const contenu = (formData.get('contenu') as string)?.trim();
  if (!contenu) return { error: 'Message vide.' };

  const supabase = await createClient();
  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId, author_id: userProfile.profile.id, contenu,
  });

  if (error) return { error: 'Erreur lors de l\'envoi.' };
  revalidatePath('/dashboard/support');
  return { success: true };
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ticket_messages').select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  return (data as TicketMessage[]) ?? [];
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export async function getFaqArticles(categorie?: TicketCategorie): Promise<FaqArticle[]> {
  const supabase = await createClient();
  let query = supabase.from('faq_articles').select('*').eq('publie', true);
  if (categorie) query = query.eq('categorie', categorie);
  const { data } = await query.order('created_at', { ascending: false });
  return (data as FaqArticle[]) ?? [];
}

export async function searchFaqArticles(query: string): Promise<FaqArticle[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('faq_articles')
    .select('*')
    .eq('publie', true)
    .or(`question.ilike.%${query}%,reponse.ilike.%${query}%`)
    .limit(5);
  return (data as FaqArticle[]) ?? [];
}

export async function createFaqArticle(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const question = formData.get('question') as string;
  const reponse = formData.get('reponse') as string;
  const categorie = formData.get('categorie') as TicketCategorie;

  if (!question || !reponse || !categorie) return { error: 'Tous les champs sont requis.' };

  const supabase = await createClient();
  const { error } = await supabase.from('faq_articles').insert({
    question, reponse, categorie, auteur_id: userProfile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la création.' };
  revalidatePath('/dashboard/support');
  revalidatePath('/dashboard/support/admin');
  return { success: true };
}

export async function assignTicket(ticketId: string, adminId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tickets')
    .update({ assigne_a: adminId || null })
    .eq('id', ticketId);

  if (error) return { error: 'Erreur lors de l\'assignation.' };
  revalidatePath('/dashboard/support/admin');
  return { success: true };
}

export async function getAdminList(): Promise<AdminContact[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from('admin_profiles')
    .select('id, nom, prenom, fonction');
  return (data as AdminContact[]) ?? [];
}

export async function convertTicketToFaq(ticketId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') return { error: 'Accès refusé.' };

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from('tickets').select('*').eq('id', ticketId).single();

  if (!ticket) return { error: 'Ticket introuvable.' };
  if (ticket.statut !== 'resolu') return { error: 'Seuls les tickets résolus peuvent être convertis.' };

  // Chercher la dernière réponse d'un admin dans le fil de messages
  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('author_id, contenu')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  // Identifier les admins
  const adminClient = createAdminClient();
  const { data: adminProfiles } = await adminClient.from('admin_profiles').select('id');
  const adminIds = new Set((adminProfiles ?? []).map((a: { id: string }) => a.id));

  // Utiliser la dernière réponse admin comme réponse FAQ, sinon la description du ticket
  const lastAdminMessage = (messages ?? []).find((m: { author_id: string; contenu: string }) =>
    adminIds.has(m.author_id)
  );
  const reponse = lastAdminMessage?.contenu ?? ticket.description;

  const { error } = await supabase.from('faq_articles').insert({
    question: ticket.sujet,
    reponse,
    categorie: ticket.categorie,
    auteur_id: userProfile.profile.id,
    source_ticket_id: ticketId,
  });

  if (error) return { error: 'Erreur lors de la conversion.' };
  revalidatePath('/dashboard/support');
  revalidatePath('/dashboard/support/admin');
  return { success: true };
}
