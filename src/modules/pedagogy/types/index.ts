export interface Class {
  id: string;
  nom: string;
  annee: number;
  created_at: string;
}

export interface ClassMember {
  class_id: string;
  student_id: string;
}

export interface TeacherClass {
  class_id: string;
  teacher_id: string;
  matiere: string;
}

export interface CourseMaterial {
  id: string;
  class_id: string;
  teacher_id: string;
  titre: string;
  type: 'video' | 'pdf' | 'lien';
  url: string;
  matiere: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  matiere: string;
  examen: string;
  note: number;
  coefficient: number;
  created_at: string;
}

export interface ClassChannel {
  id: string;
  class_id: string;
  nom: string;
  created_at: string;
}

export interface ClassMessage {
  id: string;
  channel_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
  // jointure auteur (optionnel selon query)
  author?: { prenom: string; nom: string } | null;
}

export interface AverageByMatiere {
  matiere: string;
  moyenne: number;
  total_coefficients: number;
}

export interface ActionState {
  error?: string;
  success?: boolean;
}
