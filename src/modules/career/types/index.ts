export interface JobOffer {
  id: string;
  titre: string;
  entreprise: string;
  description?: string;
  type_contrat: 'stage' | 'alternance' | 'cdi' | 'cdd';
  localisation?: string;
  lien_candidature?: string;
  publie_par: string;
  actif: boolean;
  created_at: string;
}

export interface CareerEvent {
  id: string;
  titre: string;
  description?: string;
  lieu?: string;
  date_debut: string;
  date_fin?: string;
  publie_par: string;
  created_at: string;
}

export interface EventRegistration {
  event_id: string;
  student_id: string;
  created_at: string;
}

export interface TripartiteChat {
  id: string;
  student_id: string;
  referent_id: string;
  maitre_id: string;
  created_at: string;
}

export interface TripartiteMessage {
  id: string;
  chat_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface ApprenticeshipEntry {
  id: string;
  student_id: string;
  chat_id: string;
  titre: string;
  description?: string;
  fichier_url: string;
  statut: 'soumis' | 'en_revision' | 'valide' | 'refuse';
  note?: number;
  valide_par?: string;
  created_at: string;
  updated_at: string;
}

export type ContratType = 'stage' | 'alternance' | 'cdi' | 'cdd';

export const CONTRAT_LABELS: Record<ContratType, string> = {
  stage: 'Stage',
  alternance: 'Alternance',
  cdi: 'CDI',
  cdd: 'CDD',
};

export const STATUT_LABELS: Record<ApprenticeshipEntry['statut'], string> = {
  soumis: 'Soumis',
  en_revision: 'En révision',
  valide: 'Validé',
  refuse: 'Refusé',
};

export interface ActionState {
  error?: string;
  success?: boolean;
}
