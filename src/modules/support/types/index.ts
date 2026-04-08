export type TicketStatut = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
export type TicketCategorie = 'pedagogie' | 'batiment' | 'informatique' | 'autre';

export interface Ticket {
  id: string;
  sujet: string;
  description: string;
  categorie: TicketCategorie;
  statut: TicketStatut;
  auteur_id: string;
  au_nom_de_classe: boolean;
  class_id?: string;
  assigne_a?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface FaqArticle {
  id: string;
  question: string;
  reponse: string;
  categorie: TicketCategorie;
  publie: boolean;
  auteur_id: string;
  source_ticket_id?: string;
  created_at: string;
}

export const CATEGORIE_LABELS: Record<TicketCategorie, string> = {
  pedagogie: 'Pédagogie',
  batiment: 'Bâtiment',
  informatique: 'Informatique',
  autre: 'Autre',
};

export const STATUT_LABELS: Record<TicketStatut, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
  ferme: 'Fermé',
};

export interface AdminContact {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
}

export interface ActionState {
  error?: string;
  success?: boolean;
}
