export interface ProjectWeek {
  id: string;
  title: string;
  class_id: string;
  start_date: string;
  end_date: string;
  cree_par: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  student_id: string;
  joined_at: string;
  nom?: string;
  prenom?: string;
}

export interface ProjectGroup {
  id: string;
  week_id: string;
  group_name: string;
  repo_url?: string;
  slides_url?: string;
  capacite_max: number;
  note?: number;
  feedback_prof?: string;
  note_par?: string;
  members?: GroupMember[];
}

export interface SoutenanceSlot {
  id: string;
  week_id: string;
  heure_debut: string;
  heure_fin: string;
  group_id?: string;
  group_name?: string;
}

export interface RetroBoard {
  id: string;
  week_id: string;
  is_open: boolean;
}

export type PostitType = 'POSITIVE' | 'NEGATIVE' | 'IDEA';

export interface RetroPostit {
  id: string;
  board_id: string;
  type: PostitType;
  content: string;
  is_anonymous: boolean;
  author_id: string;
  author_name?: string;
  created_at: string;
}
