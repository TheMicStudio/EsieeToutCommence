-- ============================================================
-- HUB ÉCOLE — Migration 031
-- Module 08 : Préparation de la Rentrée & Planning Engine
-- Ref: docs/features/09_module_gestion_planning — US23, US24
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- SECTION 1 : Extension de la table classes
-- Ajout du mode de calendrier (FULL_TIME / FIXED_PATTERN / MANUAL)
-- ───────────────────────────────────────────────────────────

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS calendar_mode TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (calendar_mode IN ('FULL_TIME', 'FIXED_PATTERN', 'MANUAL')),
  -- Pour FIXED_PATTERN : nb semaines consécutives école / entreprise
  ADD COLUMN IF NOT EXISTS pattern_school_weeks  SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pattern_company_weeks SMALLINT DEFAULT 3,
  -- Lundi de référence pour le calcul du pattern
  ADD COLUMN IF NOT EXISTS pattern_reference_date DATE;

-- ───────────────────────────────────────────────────────────
-- SECTION 2 : Salles de cours
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rooms (
  id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        TEXT     NOT NULL UNIQUE,
  capacite   SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- SECTION 3 : Fermetures scolaires (vacances, jours fériés)
-- Globales — bloquent toutes les classes
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_closures (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  label      TEXT  NOT NULL,
  date_start DATE  NOT NULL,
  date_end   DATE  NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_closure_range CHECK (date_end >= date_start)
);

-- ───────────────────────────────────────────────────────────
-- SECTION 4 : Calendrier école/entreprise — mode MANUAL
-- Pour FULL_TIME → moteur ignore cette table
-- Pour FIXED_PATTERN → moteur calcule depuis pattern_* de classes
-- Pour MANUAL → moteur lit cette table
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_calendar (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID  NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  week_start DATE  NOT NULL,  -- lundi de la semaine (ISO)
  location   TEXT  NOT NULL CHECK (location IN ('SCHOOL', 'COMPANY')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, week_start)
);

-- ───────────────────────────────────────────────────────────
-- SECTION 5 : Disponibilités des professeurs
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teacher_availabilities (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),  -- 1=Lundi
  start_time   TIME     NOT NULL,
  end_time     TIME     NOT NULL,
  is_available BOOLEAN  NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dispo_time_range CHECK (end_time > start_time),
  UNIQUE (teacher_id, day_of_week, start_time)
);

-- ───────────────────────────────────────────────────────────
-- SECTION 6 : Besoins horaires par matière et par classe
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subject_requirements (
  id                   UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id             UUID     NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id           UUID     NOT NULL REFERENCES auth.users(id),
  subject_name         TEXT     NOT NULL,
  total_hours_required NUMERIC(5,1) NOT NULL CHECK (total_hours_required > 0),
  session_duration_h   NUMERIC(3,1) NOT NULL DEFAULT 2.0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, teacher_id, subject_name)
);

-- ───────────────────────────────────────────────────────────
-- SECTION 7 : Sessions planifiées — output du moteur
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id                   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id             UUID  NOT NULL REFERENCES public.classes(id),
  teacher_id           UUID  NOT NULL REFERENCES auth.users(id),
  subject_name         TEXT  NOT NULL,
  room_id              UUID  REFERENCES public.rooms(id),
  start_timestamp      TIMESTAMPTZ NOT NULL,
  end_timestamp        TIMESTAMPTZ NOT NULL,
  status               TEXT  NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'VALIDATED', 'CONFLICT_ERROR')),
  conflict_reason      TEXT,
  suggested_teacher_id UUID  REFERENCES auth.users(id),
  suggested_slot_start TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_session_range CHECK (end_timestamp > start_timestamp)
);

-- Index performance pour les checks d'overlap (cœur de l'algorithme)
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_time ON public.scheduled_sessions
  (teacher_id, start_timestamp, end_timestamp) WHERE status != 'CONFLICT_ERROR';
CREATE INDEX IF NOT EXISTS idx_sessions_class_time ON public.scheduled_sessions
  (class_id, start_timestamp, end_timestamp) WHERE status != 'CONFLICT_ERROR';
CREATE INDEX IF NOT EXISTS idx_sessions_room_time ON public.scheduled_sessions
  (room_id, start_timestamp, end_timestamp) WHERE status != 'CONFLICT_ERROR';
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.scheduled_sessions (status);

-- ───────────────────────────────────────────────────────────
-- RLS
-- ───────────────────────────────────────────────────────────

ALTER TABLE public.rooms                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_closures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_calendar        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_requirements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions     ENABLE ROW LEVEL SECURITY;

-- Helper : est-ce un admin ?
-- (réutilise le pattern existant du projet, pas de nouvelle fonction)

-- Salles & Fermetures : lecture pour tous les connectés, écriture admin only
CREATE POLICY "Salles lecture connectes" ON public.rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gere salles" ON public.rooms
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Fermetures lecture connectes" ON public.school_closures
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gere fermetures" ON public.school_closures
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Calendrier : admin gère, élèves/profs lisent leur classe
CREATE POLICY "Admin gere calendrier" ON public.school_calendar
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Calendrier lecture classe" ON public.school_calendar
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- Disponibilités : admin gère tout, prof gère les siennes
CREATE POLICY "Admin gere dispos" ON public.teacher_availabilities
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Prof gere ses dispos" ON public.teacher_availabilities
  FOR ALL USING (auth.uid() = teacher_id);

-- Besoins matières : admin only
CREATE POLICY "Admin gere besoins matieres" ON public.subject_requirements
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Besoins lecture profs et eleves" ON public.subject_requirements
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- Sessions : admin gère tout, prof/élève lisent uniquement VALIDATED
CREATE POLICY "Admin gere sessions" ON public.scheduled_sessions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Prof voit ses sessions validees" ON public.scheduled_sessions
  FOR SELECT USING (auth.uid() = teacher_id AND status = 'VALIDATED');
CREATE POLICY "Eleve voit planning classe valide" ON public.scheduled_sessions
  FOR SELECT USING (
    status = 'VALIDATED' AND public.is_class_member(class_id)
  );
