-- ============================================================
-- HUB ÉCOLE — Migration 037
-- Suppression des colonnes ai_provider et ai_review de planning_runs
-- Ces colonnes ont été créées pour une future intégration IA de review
-- mais ne sont jamais lues ni écrites dans le code.
-- ============================================================

ALTER TABLE public.planning_runs
  DROP COLUMN IF EXISTS ai_provider,
  DROP COLUMN IF EXISTS ai_review;
