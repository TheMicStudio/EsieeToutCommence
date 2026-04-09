-- ============================================================
-- HUB ÉCOLE — Migration 032
-- Module 08 : Types de sessions + Planning Runs
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- SECTION 1 : Étendre subject_requirements avec le type de session
-- ───────────────────────────────────────────────────────────

ALTER TABLE public.subject_requirements
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'CLASSIC'
    CHECK (session_type IN (
      'INTENSIVE_BLOCK',  -- bloque 1-N semaines complètes (lun→ven journée)
      'WEEKLY_DAY',       -- 1 jour fixe par semaine pendant N semaines
      'CLASSIC'           -- créneaux standards de session_duration_h heures
    )),
  -- Pour INTENSIVE_BLOCK : nb de semaines consécutives à bloquer
  ADD COLUMN IF NOT EXISTS duration_weeks SMALLINT DEFAULT 1
    CHECK (duration_weeks BETWEEN 1 AND 8),
  -- Pour WEEKLY_DAY : jour préféré (1=Lundi…5=Vendredi) et nb de semaines
  ADD COLUMN IF NOT EXISTS preferred_day SMALLINT
    CHECK (preferred_day BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS weekly_occurrences SMALLINT DEFAULT 1
    CHECK (weekly_occurrences BETWEEN 1 AND 52);

-- ───────────────────────────────────────────────────────────
-- SECTION 2 : Planning Runs
-- Chaque génération = 1 run distinct, les anciens sont conservés
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.planning_runs (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT  NOT NULL,           -- ex: "Génération 1 - 09/04/2026"
  status      TEXT  NOT NULL DEFAULT 'DRAFT'
                CHECK (status IN ('DRAFT', 'VALIDATED', 'ARCHIVED')),
  class_ids   UUID[]  NOT NULL DEFAULT '{}',  -- classes concernées par ce run
  is_gap_fill BOOLEAN NOT NULL DEFAULT false, -- true si c'est un "Compléter les trous"
  ai_provider TEXT,                     -- provider utilisé pour la review
  ai_review   JSONB,                    -- réponse structurée de l'IA
  total_sessions   INT DEFAULT 0,
  conflict_count   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter run_id à scheduled_sessions
ALTER TABLE public.scheduled_sessions
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.planning_runs(id) ON DELETE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS idx_sessions_run ON public.scheduled_sessions (run_id);
CREATE INDEX IF NOT EXISTS idx_runs_status  ON public.planning_runs (status);

-- ───────────────────────────────────────────────────────────
-- RLS planning_runs
-- ───────────────────────────────────────────────────────────

ALTER TABLE public.planning_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere les runs" ON public.planning_runs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Profs et élèves voient les runs VALIDATED (pour savoir quel planning est actif)
CREATE POLICY "Runs valides visibles" ON public.planning_runs
  FOR SELECT USING (status = 'VALIDATED');
