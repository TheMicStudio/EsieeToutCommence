-- Active Realtime sur course_materials
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.course_materials;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.course_materials REPLICA IDENTITY FULL;
