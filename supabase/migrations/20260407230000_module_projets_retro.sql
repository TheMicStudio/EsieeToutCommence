-- Migration Module 7 - idempotente (tables déjà créées via init_module_projects)
-- Vérifie que realtime est activé sur les bonnes tables

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.retro_postits;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.soutenance_slots;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
