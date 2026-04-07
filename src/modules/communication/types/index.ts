export interface StaffChannel {
  id: string;
  nom: string;
  description?: string;
  cree_par: string;
  created_at: string;
}

export interface StaffMessage {
  id: string;
  channel_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface StaffContact {
  id: string;
  nom: string;
  prenom: string;
  role: 'professeur' | 'admin';
  matieres_enseignees?: string[];
  fonction?: string;
}

export interface ActionState {
  error?: string;
  success?: boolean;
}
