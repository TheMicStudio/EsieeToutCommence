-- Création des buckets Storage
-- course_materials : fichiers cours (PDF, Word, PowerPoint)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course_materials',
  'course_materials',
  true,
  20971520, -- 20 Mo
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS : lecture publique
CREATE POLICY "course_materials_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course_materials');

-- Politique RLS : upload pour profs authentifiés
CREATE POLICY "course_materials_prof_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course_materials'
    AND auth.role() = 'authenticated'
  );
