-- Ajout de la colonne is_current pour gérer le multi-année
-- Un élève peut appartenir à plusieurs classes (une par année scolaire)
-- is_current = true → classe de l'année en cours
-- is_current = false → classe d'une année précédente (accès lecture seule)

ALTER TABLE public.class_members
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
