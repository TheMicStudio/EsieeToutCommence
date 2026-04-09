-- Ajoute le créateur du groupe pour gérer les permissions de suppression
ALTER TABLE public.project_groups
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
