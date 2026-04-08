export interface ParentProfile {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  created_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
  // Données de l'enfant (résolues via actions)
  student_nom?: string;
  student_prenom?: string;
  student_class?: string;
  student_class_id?: string;
}

export interface ParentMessage {
  id: string;
  link_id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  content: string;
  created_at: string;
}
