export type SessionStatut = 'ouvert' | 'ferme';
export type PresenceStatut = 'present' | 'en_retard';

export interface AttendanceSession {
  id: string;
  class_id: string;
  teacher_id: string;
  code_unique: string;
  expiration: string;
  statut: SessionStatut;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  statut_presence: PresenceStatut;
  heure_pointage: string;
  device_fingerprint: string;
}

export interface AttendanceReport {
  session: AttendanceSession;
  presents: (AttendanceRecord & { nom?: string; prenom?: string })[];
  absents: { student_id: string; nom: string; prenom: string }[];
  taux_presence: number;
}
