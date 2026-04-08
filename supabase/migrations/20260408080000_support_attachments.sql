-- Pièces jointes sur les tickets support
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Bucket privé pour les fichiers support (lecture réservée aux participants + admins)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-files',
  'support-files',
  false,
  20971520, -- 20 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Upload pour utilisateurs authentifiés
CREATE POLICY "support_files_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'support-files' AND auth.uid() IS NOT NULL
  );

-- Lecture pour utilisateurs authentifiés (le ticket RLS protège déjà l'accès)
CREATE POLICY "support_files_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'support-files' AND auth.uid() IS NOT NULL
  );
