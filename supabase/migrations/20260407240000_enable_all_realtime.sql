-- Migration : active realtime sur toutes les tables qui en ont besoin
-- Idempotente via EXCEPTION WHEN duplicate_object

-- class_messages (chat pédagogie)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- staff_messages (communication interne)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- tripartite_messages (chat alternance)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tripartite_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- retro_postits (rétrospective projets)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.retro_postits;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- soutenance_slots (créneaux soutenances)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.soutenance_slots;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- attendance_records (émargement)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- REPLICA IDENTITY FULL pour les événements DELETE/UPDATE (inclut les anciennes valeurs)
ALTER TABLE public.class_messages      REPLICA IDENTITY FULL;
ALTER TABLE public.staff_messages      REPLICA IDENTITY FULL;
ALTER TABLE public.tripartite_messages REPLICA IDENTITY FULL;
ALTER TABLE public.retro_postits       REPLICA IDENTITY FULL;
ALTER TABLE public.soutenance_slots    REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_records  REPLICA IDENTITY FULL;
