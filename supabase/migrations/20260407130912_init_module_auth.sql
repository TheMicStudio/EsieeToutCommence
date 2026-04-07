-- ============================================================
-- HUB ÉCOLE — Migration 001
-- Module 1 : Identité, Authentification et Profils
-- Ref: docs/features/01_module_auth_profils.md — US22, US23
-- ============================================================

-- ENUM : Rôle principal
CREATE TYPE public.role_principal AS ENUM (
  'eleve',
  'professeur',
  'admin',
  'entreprise'
);

-- TABLE : user_roles — pont auth.users <-> rôle métier
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.role_principal NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : student_profiles
CREATE TABLE public.student_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  type_parcours   TEXT NOT NULL CHECK (type_parcours IN ('temps_plein', 'alternant')),
  role_secondaire TEXT CHECK (role_secondaire IN ('delegue', 'ambassadeur')),
  class_id        UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : teacher_profiles
CREATE TABLE public.teacher_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom                 TEXT NOT NULL,
  prenom              TEXT NOT NULL,
  matieres_enseignees TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : admin_profiles
CREATE TABLE public.admin_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  fonction   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : company_profiles
CREATE TABLE public.company_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  poste      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles  ENABLE ROW LEVEL SECURITY;

-- user_roles : lecture du rôle propre
CREATE POLICY "Lecture role propre" ON public.user_roles
  FOR SELECT USING (auth.uid() = id);

-- user_roles : admin lit tout
CREATE POLICY "Admin lecture tous les roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Profils : chaque user gère le sien
CREATE POLICY "Acces profil eleve" ON public.student_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Acces profil prof" ON public.teacher_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Acces profil admin" ON public.admin_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Acces profil entreprise" ON public.company_profiles
  FOR ALL USING (auth.uid() = id);

-- Annuaire : tout utilisateur connecte peut lire eleves et profs
CREATE POLICY "Annuaire lecture eleves" ON public.student_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Annuaire lecture profs" ON public.teacher_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
