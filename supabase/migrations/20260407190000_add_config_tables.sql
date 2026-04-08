-- ─── Tables de configuration dynamique ────────────────────────────────────────
-- Remplace les listes hardcodées dans le code (MATIERES, FONCTIONS, catégories tickets, rôles secondaires)

-- Matières (remplace le tableau MATIERES dans constants.ts)
CREATE TABLE IF NOT EXISTS subjects (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom  text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fonctions admin (remplace le tableau FONCTIONS dans constants.ts)
CREATE TABLE IF NOT EXISTS admin_functions (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom  text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Catégories de tickets (remplace le type TicketCategorie hardcodé)
CREATE TABLE IF NOT EXISTS ticket_categories (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  text NOT NULL UNIQUE,   -- ex: 'pedagogie'
  label text NOT NULL,          -- ex: 'Pédagogie'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rôles secondaires (remplace 'delegue' | 'ambassadeur' hardcodé)
CREATE TABLE IF NOT EXISTS secondary_roles (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  text NOT NULL UNIQUE,   -- ex: 'delegue'
  label text NOT NULL,          -- ex: 'Délégué·e de classe'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Données par défaut ───────────────────────────────────────────────────────

INSERT INTO subjects (nom) VALUES
  ('Mathématiques'), ('Physique'), ('Chimie'), ('Informatique'), ('Algorithmique'),
  ('Réseaux & Systèmes'), ('Développement Web'), ('Bases de données'),
  ('Anglais'), ('Français'), ('Management'), ('Économie'), ('Droit'), ('SIO'), ('Électronique')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO admin_functions (nom) VALUES
  ('Directeur·trice'), ('Directeur·trice adjoint·e'), ('Responsable pédagogique'),
  ('Responsable administratif·ve'), ('Secrétariat'), ('Comptabilité'),
  ('Ressources humaines'), ('Chargé·e de communication'), ('Référent·e numérique'),
  ('Vie scolaire'), ('Autre')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO ticket_categories (slug, label) VALUES
  ('pedagogie', 'Pédagogie'), ('batiment', 'Bâtiment'), ('informatique', 'Informatique'),
  ('restauration', 'Restauration'), ('vie_scolaire', 'Vie scolaire'), ('autre', 'Autre')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO secondary_roles (slug, label) VALUES
  ('delegue', 'Délégué·e de classe'), ('ambassadeur', 'Ambassadeur·rice'),
  ('bde', 'Membre BDE'), ('tuteur', 'Tuteur·rice pédagogique')
ON CONFLICT (slug) DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Lecture publique (authentifiés), écriture admin uniquement via service_role (server actions)

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_roles ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "subjects_read" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_functions_read" ON admin_functions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ticket_categories_read" ON ticket_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "secondary_roles_read" ON secondary_roles FOR SELECT TO authenticated USING (true);
