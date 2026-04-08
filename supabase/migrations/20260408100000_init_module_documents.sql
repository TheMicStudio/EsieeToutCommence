-- ============================================================
-- Migration : Module 8 — Espace Documentaire
-- Accès : admin + coordinateur uniquement
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.doc_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   UUID REFERENCES public.doc_folders(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_folders_parent_idx ON public.doc_folders(parent_id);

CREATE TABLE IF NOT EXISTS public.doc_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id    UUID REFERENCES public.doc_folders(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  tags         TEXT[] DEFAULT '{}',
  mime_type    TEXT,
  size_bytes   BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by  UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at  TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_files_folder_idx   ON public.doc_files(folder_id);
CREATE INDEX IF NOT EXISTS doc_files_tags_idx     ON public.doc_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS doc_files_name_idx     ON public.doc_files USING GIN(to_tsvector('french', name));

-- Permissions par dossier (héritées par sous-dossiers et fichiers côté app)
-- role_target et user_target sont mutuellement exclusifs (check constraint)
-- Défaut si aucune règle : accès write pour tous les utilisateurs du module
CREATE TABLE IF NOT EXISTS public.doc_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   UUID REFERENCES public.doc_folders(id) ON DELETE CASCADE NOT NULL,
  role_target TEXT CHECK (role_target IN ('eleve','professeur','coordinateur','staff','admin','entreprise','parent')),
  user_target UUID REFERENCES auth.users(id),
  level       TEXT NOT NULL CHECK (level IN ('read', 'write', 'admin')),
  granted_by  UUID REFERENCES auth.users(id) NOT NULL,
  granted_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT doc_perm_one_target CHECK (
    (role_target IS NULL) != (user_target IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS doc_permissions_folder_idx ON public.doc_permissions(folder_id);

-- Liens de partage (fichier OU dossier — mutuellement exclusifs)
CREATE TABLE IF NOT EXISTS public.doc_share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID REFERENCES public.doc_files(id) ON DELETE CASCADE,
  folder_id   UUID REFERENCES public.doc_folders(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'base64url'),
  label       TEXT,
  expires_at  TIMESTAMPTZ,
  max_uses    INT,
  uses_count  INT NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT doc_share_one_target CHECK (
    (file_id IS NULL) != (folder_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS doc_share_links_token_idx ON public.doc_share_links(token);

-- ─── RLS ──────────────────────────────────────────────────────
-- Vérification du rôle déléguée au client admin (pattern du projet)
-- RLS : accès aux utilisateurs authentifiés uniquement

ALTER TABLE public.doc_folders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_folders_authenticated"
  ON public.doc_folders FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "doc_files_authenticated"
  ON public.doc_files FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "doc_permissions_authenticated"
  ON public.doc_permissions FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "doc_share_links_authenticated"
  ON public.doc_share_links FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ─── Storage bucket (privé) ───────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800) -- 50 Mo
ON CONFLICT (id) DO NOTHING;

-- Upload : utilisateurs authentifiés (vérification rôle dans les server actions)
CREATE POLICY "documents_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Select : utilisateurs authentifiés (téléchargements via URL signées)
CREATE POLICY "documents_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Delete : utilisateurs authentifiés (vérification rôle dans les server actions)
CREATE POLICY "documents_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- ─── Permissions système ──────────────────────────────────────

INSERT INTO public.permissions (key, module, level, description) VALUES
  ('doc.access', 'documents', 'read',   'Accéder à l''espace documentaire'),
  ('doc.manage', 'documents', 'manage', 'Créer/supprimer des dossiers, gérer les permissions et liens de partage')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key, enabled) VALUES
  ('admin',        'doc.access', true),
  ('admin',        'doc.manage', true),
  ('coordinateur', 'doc.access', true),
  ('coordinateur', 'doc.manage', true)
ON CONFLICT (role, permission_key) DO NOTHING;
