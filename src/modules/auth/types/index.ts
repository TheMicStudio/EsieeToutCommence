export type RolePrincipal = 'eleve' | 'professeur' | 'admin' | 'entreprise' | 'parent';

export const ROLE_LABELS: Record<RolePrincipal, string> = {
  eleve: 'Élève',
  professeur: 'Professeur',
  admin: 'Administration',
  entreprise: 'Entreprise',
  parent: 'Parent d\'élève',
};

export interface UserRole {
  id: string;
  role: RolePrincipal;
}

export interface StudentProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone_mobile?: string;
  phone_fixed?: string;
  type_parcours: 'temps_plein' | 'alternant';
  role_secondaire?: 'delegue' | 'ambassadeur';
  class_id?: string;
}

export interface TeacherProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone_mobile?: string;
  phone_fixed?: string;
  matieres_enseignees: string[];
}

export interface AdminProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone_mobile?: string;
  phone_fixed?: string;
  fonction?: string;
}

export interface CompanyProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone_mobile?: string;
  phone_fixed?: string;
  entreprise: string;
  poste?: string;
}

export interface ParentProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone_mobile?: string;
  phone_fixed?: string;
}

export type UserProfile =
  | { role: 'eleve'; profile: StudentProfile }
  | { role: 'professeur'; profile: TeacherProfile }
  | { role: 'admin'; profile: AdminProfile }
  | { role: 'entreprise'; profile: CompanyProfile }
  | { role: 'parent'; profile: ParentProfile };

export interface ActionState {
  error?: string;
  success?: boolean;
}
