-- ============================================================
-- HUB ÉCOLE — Migration 007
-- Activer Supabase Realtime sur les tables de chat
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
    WHERE pubname = 'supabase_realtime' AND tablename = 'staff_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_messages;
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
