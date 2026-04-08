-- ============================================================
-- Migration : Système de permissions granulaires
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.permissions (
  key         TEXT PRIMARY KEY,
  module      TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('read', 'write', 'manage', 'participate')),
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role           TEXT NOT NULL,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  enabled        BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (role, permission_key)
);

CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  enabled        BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, permission_key)
);

-- ─── Catalogue des 38 permissions ────────────────────────────

INSERT INTO public.permissions (key, module, level, description) VALUES
  ('news.read',                  'news',           'read',        'Voir toutes les publications'),
  ('news.write',                 'news',           'write',       'Créer, modifier et supprimer ses propres publications'),
  ('news.moderate',              'news',           'manage',      'Supprimer n''importe quelle publication, épingler'),
  ('directory.read',             'directory',      'read',        'Voir les profils (nom, classe, matières, téléphone, email)'),
  ('directory.export',           'directory',      'manage',      'Exporter l''annuaire en CSV'),
  ('class.read',                 'class',          'read',        'Voir la liste des classes et leurs membres'),
  ('class.manage',               'class',          'manage',      'Créer, modifier, supprimer des classes, gérer les membres'),
  ('course_material.read',       'course_material','read',        'Télécharger les supports de cours'),
  ('course_material.write',      'course_material','write',       'Déposer et supprimer ses propres supports'),
  ('course_material.moderate',   'course_material','manage',      'Supprimer n''importe quel support'),
  ('grade.read_own',             'grade',          'read',        'Voir ses propres notes et moyennes'),
  ('grade.read_class',           'grade',          'read',        'Voir les notes de toute une classe'),
  ('grade.manage',               'grade',          'manage',      'Saisir, modifier, supprimer des notes'),
  ('project_week.read',          'project',        'read',        'Voir les semaines projet et leur contenu'),
  ('project_week.manage',        'project',        'manage',      'Créer, modifier, supprimer des semaines projet'),
  ('project_group.read',         'project',        'read',        'Voir tous les groupes'),
  ('project_group.participate',  'project',        'participate', 'Rejoindre/quitter un groupe, chat, tableau blanc'),
  ('project_group.manage',       'project',        'manage',      'Créer/supprimer des groupes, gérer les membres, noter'),
  ('retro.participate',          'project',        'participate', 'Lire, créer et supprimer ses propres post-its'),
  ('retro.moderate',             'project',        'manage',      'Supprimer tout post-it, ouvrir/fermer le mur'),
  ('soutenance.read',            'project',        'read',        'Voir les créneaux disponibles'),
  ('soutenance.book',            'project',        'participate', 'Réserver un créneau (groupe)'),
  ('soutenance.manage',          'project',        'manage',      'Créer, modifier, supprimer des créneaux'),
  ('attendance.read_own',        'attendance',     'read',        'Voir son propre historique d''émargement'),
  ('attendance.read_class',      'attendance',     'read',        'Voir l''émargement d''une classe, exporter'),
  ('attendance.manage',          'attendance',     'manage',      'Ouvrir/fermer une session QR, marquer présent/absent'),
  ('job.read',                   'career',         'read',        'Voir les offres d''emploi'),
  ('job.manage',                 'career',         'manage',      'Publier, modifier, supprimer des offres'),
  ('career_event.read',          'career',         'read',        'Voir les événements carrière'),
  ('career_event.participate',   'career',         'participate', 'S''inscrire et se désinscrire aux événements'),
  ('career_event.manage',        'career',         'manage',      'Créer, modifier, supprimer des événements, voir inscrits'),
  ('alternance.access',          'alternance',     'participate', 'Accéder au chat tripartite, déposer des entrées livret'),
  ('alternance.validate',        'alternance',     'manage',      'Valider les entrées du livret, voir tous les livrets'),
  ('support.use',                'support',        'participate', 'Créer un ticket, suivre ses propres tickets'),
  ('support.manage',             'support',        'manage',      'Voir tous les tickets, répondre, clore, supprimer'),
  ('staff_channel.participate',  'messaging',      'participate', 'Lire et envoyer des messages dans les canaux staff'),
  ('staff_channel.manage',       'messaging',      'manage',      'Créer/supprimer des canaux, modérer les messages'),
  ('profile.edit_own',           'profile',        'write',       'Modifier son propre profil'),
  ('profile.manage_any',         'profile',        'manage',      'Modifier le profil d''un autre utilisateur'),
  ('user.manage',                'admin',          'manage',      'Créer, modifier le rôle, désactiver, supprimer des comptes'),
  ('permission.manage',          'admin',          'manage',      'Modifier la configuration des permissions par rôle')
ON CONFLICT (key) DO NOTHING;

-- ─── Valeurs par défaut par rôle ─────────────────────────────
-- (matrice complète issue de docs/fix/permissions-system.md)

INSERT INTO public.role_permissions (role, permission_key, enabled) VALUES
  -- eleve
  ('eleve', 'news.read',                 true),
  ('eleve', 'directory.read',            true),
  ('eleve', 'class.read',                true),
  ('eleve', 'course_material.read',      true),
  ('eleve', 'grade.read_own',            true),
  ('eleve', 'project_week.read',         true),
  ('eleve', 'project_group.read',        true),
  ('eleve', 'project_group.participate', true),
  ('eleve', 'retro.participate',         true),
  ('eleve', 'soutenance.read',           true),
  ('eleve', 'soutenance.book',           true),
  ('eleve', 'attendance.read_own',       true),
  ('eleve', 'job.read',                  true),
  ('eleve', 'career_event.read',         true),
  ('eleve', 'career_event.participate',  true),
  ('eleve', 'alternance.access',         true),
  ('eleve', 'support.use',               true),
  ('eleve', 'profile.edit_own',          true),

  -- professeur
  ('professeur', 'news.read',                true),
  ('professeur', 'news.write',               true),
  ('professeur', 'directory.read',           true),
  ('professeur', 'class.read',               true),
  ('professeur', 'course_material.read',     true),
  ('professeur', 'course_material.write',    true),
  ('professeur', 'grade.read_class',         true),
  ('professeur', 'grade.manage',             true),
  ('professeur', 'project_week.read',        true),
  ('professeur', 'project_week.manage',      true),
  ('professeur', 'project_group.read',       true),
  ('professeur', 'project_group.manage',     true),
  ('professeur', 'retro.participate',        true),
  ('professeur', 'retro.moderate',           true),
  ('professeur', 'soutenance.read',          true),
  ('professeur', 'soutenance.manage',        true),
  ('professeur', 'attendance.read_class',    true),
  ('professeur', 'attendance.manage',        true),
  ('professeur', 'job.read',                 true),
  ('professeur', 'career_event.read',        true),
  ('professeur', 'alternance.validate',      true),
  ('professeur', 'support.use',              true),
  ('professeur', 'staff_channel.participate',true),
  ('professeur', 'profile.edit_own',         true),

  -- coordinateur
  ('coordinateur', 'news.read',                 true),
  ('coordinateur', 'news.write',                true),
  ('coordinateur', 'directory.read',            true),
  ('coordinateur', 'directory.export',          true),
  ('coordinateur', 'class.read',                true),
  ('coordinateur', 'class.manage',              true),
  ('coordinateur', 'course_material.read',      true),
  ('coordinateur', 'course_material.write',     true),
  ('coordinateur', 'course_material.moderate',  true),
  ('coordinateur', 'grade.read_own',            true),
  ('coordinateur', 'grade.read_class',          true),
  ('coordinateur', 'grade.manage',              true),
  ('coordinateur', 'project_week.read',         true),
  ('coordinateur', 'project_week.manage',       true),
  ('coordinateur', 'project_group.read',        true),
  ('coordinateur', 'project_group.manage',      true),
  ('coordinateur', 'retro.participate',         true),
  ('coordinateur', 'retro.moderate',            true),
  ('coordinateur', 'soutenance.read',           true),
  ('coordinateur', 'soutenance.manage',         true),
  ('coordinateur', 'attendance.read_own',       true),
  ('coordinateur', 'attendance.read_class',     true),
  ('coordinateur', 'attendance.manage',         true),
  ('coordinateur', 'job.read',                  true),
  ('coordinateur', 'career_event.read',         true),
  ('coordinateur', 'alternance.validate',       true),
  ('coordinateur', 'support.use',               true),
  ('coordinateur', 'staff_channel.participate', true),
  ('coordinateur', 'profile.edit_own',          true),

  -- staff
  ('staff', 'news.read',                 true),
  ('staff', 'news.write',                true),
  ('staff', 'news.moderate',             true),
  ('staff', 'directory.read',            true),
  ('staff', 'directory.export',          true),
  ('staff', 'class.read',                true),
  ('staff', 'attendance.read_class',     true),
  ('staff', 'job.read',                  true),
  ('staff', 'job.manage',                true),
  ('staff', 'career_event.read',         true),
  ('staff', 'career_event.manage',       true),
  ('staff', 'support.use',               true),
  ('staff', 'support.manage',            true),
  ('staff', 'staff_channel.participate', true),
  ('staff', 'profile.edit_own',          true),

  -- admin (accès total)
  ('admin', 'news.read',                 true),
  ('admin', 'news.write',                true),
  ('admin', 'news.moderate',             true),
  ('admin', 'directory.read',            true),
  ('admin', 'directory.export',          true),
  ('admin', 'class.read',                true),
  ('admin', 'class.manage',              true),
  ('admin', 'course_material.read',      true),
  ('admin', 'course_material.write',     true),
  ('admin', 'course_material.moderate',  true),
  ('admin', 'grade.read_own',            true),
  ('admin', 'grade.read_class',          true),
  ('admin', 'grade.manage',              true),
  ('admin', 'project_week.read',         true),
  ('admin', 'project_week.manage',       true),
  ('admin', 'project_group.read',        true),
  ('admin', 'project_group.manage',      true),
  ('admin', 'retro.participate',         true),
  ('admin', 'retro.moderate',            true),
  ('admin', 'soutenance.read',           true),
  ('admin', 'soutenance.manage',         true),
  ('admin', 'attendance.read_own',       true),
  ('admin', 'attendance.read_class',     true),
  ('admin', 'attendance.manage',         true),
  ('admin', 'job.read',                  true),
  ('admin', 'job.manage',                true),
  ('admin', 'career_event.read',         true),
  ('admin', 'career_event.manage',       true),
  ('admin', 'alternance.validate',       true),
  ('admin', 'support.use',               true),
  ('admin', 'support.manage',            true),
  ('admin', 'staff_channel.participate', true),
  ('admin', 'staff_channel.manage',      true),
  ('admin', 'profile.edit_own',          true),
  ('admin', 'profile.manage_any',        true),
  ('admin', 'user.manage',               true),
  ('admin', 'permission.manage',         true),

  -- entreprise
  ('entreprise', 'news.read',            true),
  ('entreprise', 'job.read',             true),
  ('entreprise', 'career_event.read',    true),
  ('entreprise', 'alternance.access',    true),
  ('entreprise', 'alternance.validate',  true),
  ('entreprise', 'support.use',          true),
  ('entreprise', 'profile.edit_own',     true),

  -- parent
  ('parent', 'grade.read_own',           true),
  ('parent', 'attendance.read_own',      true),
  ('parent', 'support.use',              true),
  ('parent', 'profile.edit_own',         true)

ON CONFLICT (role, permission_key) DO NOTHING;

-- ─── RLS : seul l'admin peut modifier les permissions ─────────
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_read_all" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "role_permissions_read_all" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "user_overrides_read_own" ON public.user_permission_overrides
  FOR SELECT USING (auth.uid() = user_id);
