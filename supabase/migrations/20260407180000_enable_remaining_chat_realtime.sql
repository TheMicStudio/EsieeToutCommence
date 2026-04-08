-- ============================================================
-- HUB ÉCOLE — Migration 008
-- Activer Realtime sur class_messages et tripartite_messages
-- (staff_messages déjà ajouté dans migration précédente)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'class_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tripartite_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tripartite_messages;
  END IF;
END $$;
