-- ============================================================
-- HUB ÉCOLE - Initialisation du schéma Supabase
-- Module 1 : Identité, Authentification et Profils
-- Ref: base.md - Section 1 / backlog.md - US22
-- ============================================================

-- Les users sont gérés par auth.users de Supabase.
-- On crée les profils métier en 1:1 avec auth.users.

-- -----------------------------------------------------------
-- ENUM : Rôle principal
-- -----------------------------------------------------------
CREATE TYPE public.role_principal AS ENUM (
  'eleve',
  'professeur',
  'admin',
  'entreprise'
);

-- -----------------------------------------------------------
-- TABLE : StudentProfile (1:1 avec auth.users)
-- -----------------------------------------------------------
CREATE TABLE public.student_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  prenom      TEXT NOT NULL,
  type_parcours TEXT NOT NULL CHECK (type_parcours IN ('temps_plein', 'alternant')),
  role_secondaire TEXT CHECK (role_secondaire IN ('delegue', 'ambassadeur')),
  class_id    UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : TeacherProfile (1:1 avec auth.users)
-- -----------------------------------------------------------
CREATE TABLE public.teacher_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom                 TEXT NOT NULL,
  prenom              TEXT NOT NULL,
  matieres_enseignees TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : AdminProfile (1:1 avec auth.users)
-- -----------------------------------------------------------
CREATE TABLE public.admin_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  fonction   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : CompanyProfile (1:1 avec auth.users)
-- -----------------------------------------------------------
CREATE TABLE public.company_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  poste      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- RLS : Row Level Security
-- -----------------------------------------------------------
ALTER TABLE public.student_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles  ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne peut lire/modifier que son propre profil
CREATE POLICY "Own profile access" ON public.student_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Own profile access" ON public.teacher_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Own profile access" ON public.admin_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Own profile access" ON public.company_profiles
  FOR ALL USING (auth.uid() = id);
