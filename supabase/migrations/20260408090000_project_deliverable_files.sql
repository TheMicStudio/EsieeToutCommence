-- Livrables fichiers sur les groupes projet (en plus des liens)
ALTER TABLE project_groups ADD COLUMN IF NOT EXISTS slides_file_url TEXT;
ALTER TABLE project_groups ADD COLUMN IF NOT EXISTS slides_file_name TEXT;

-- Bucket public pour les livrables projet (profs peuvent accéder directement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-deliverables',
  'project-deliverables',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/zip','application/x-zip-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.google-apps.presentation',
    'image/jpeg','image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project_deliverables_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-deliverables');

CREATE POLICY "project_deliverables_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-deliverables' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "project_deliverables_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-deliverables' AND auth.uid() IS NOT NULL
  );
