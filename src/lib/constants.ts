// ─── Source de vérité unique pour les listes de valeurs ────────────────────────
// Ces constantes sont utilisées en attendant les tables dynamiques en base.
// Phase 2 : remplacer par un fetch depuis subjects / admin_functions / ticket_categories.

export const MATIERES: string[] = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Informatique',
  'Algorithmique',
  'Réseaux & Systèmes',
  'Développement Web',
  'Bases de données',
  'Anglais',
  'Français',
  'Management',
  'Économie',
  'Droit',
  'SIO',
  'Électronique',
];

export const FONCTIONS: string[] = [
  'Directeur·trice',
  'Directeur·trice adjoint·e',
  'Responsable pédagogique',
  'Responsable administratif·ve',
  'Secrétariat',
  'Comptabilité',
  'Ressources humaines',
  'Chargé·e de communication',
  'Référent·e numérique',
  'Vie scolaire',
  'Autre',
];

export const TICKET_CATEGORIES: { value: string; label: string }[] = [
  { value: 'pedagogie', label: 'Pédagogie' },
  { value: 'batiment', label: 'Bâtiment' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'vie_scolaire', label: 'Vie scolaire' },
  { value: 'autre', label: 'Autre' },
];

export const ROLES_SECONDAIRES: { value: string; label: string }[] = [
  { value: 'delegue', label: 'Délégué·e de classe' },
  { value: 'ambassadeur', label: 'Ambassadeur·rice' },
  { value: 'bde', label: 'Membre BDE' },
  { value: 'tuteur', label: 'Tuteur·rice pédagogique' },
];
