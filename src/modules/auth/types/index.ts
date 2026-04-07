export type RolePrincipal = 'eleve' | 'professeur' | 'admin' | 'entreprise';

export const ROLE_LABELS: Record<RolePrincipal, string> = {
  eleve: 'Élève',
  professeur: 'Professeur',
  admin: 'Administration',
  entreprise: 'Entreprise',
};

export interface UserRole {
  id: string;
  role: RolePrincipal;
}

export interface StudentProfile {
  id: string;
  nom: string;
  prenom: string;
  type_parcours: 'temps_plein' | 'alternant';
  role_secondaire?: 'delegue' | 'ambassadeur';
  class_id?: string;
}

export interface TeacherProfile {
  id: string;
  nom: string;
  prenom: string;
  matieres_enseignees: string[];
}

export interface AdminProfile {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
}

export interface CompanyProfile {
  id: string;
  nom: string;
  prenom: string;
  entreprise: string;
  poste?: string;
}

export type UserProfile =
  | { role: 'eleve'; profile: StudentProfile }
  | { role: 'professeur'; profile: TeacherProfile }
  | { role: 'admin'; profile: AdminProfile }
  | { role: 'entreprise'; profile: CompanyProfile };

export interface ActionState {
  error?: string;
  success?: boolean;
}
