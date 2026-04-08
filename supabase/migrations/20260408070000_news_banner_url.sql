-- Ajout d'une bannière (miniature) sur les publications actualités
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Bucket public pour les bannières
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-banners',
  'news-banners',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "news_banners_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-banners');

-- Upload pour utilisateurs authentifiés ayant le droit de publier
CREATE POLICY "news_banners_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'news-banners' AND auth.uid() IS NOT NULL
  );

-- Suppression par l'auteur (même user_id dans le chemin)
CREATE POLICY "news_banners_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'news-banners' AND auth.uid() IS NOT NULL
  );
