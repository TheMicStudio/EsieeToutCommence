-- ── Module : Parents d'élèves — Tables et RLS ───────────────────────────────

-- TABLE : parent_profiles
CREATE TABLE public.parent_profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        text        NOT NULL,
  prenom     text        NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE : parent_student_links — lien parent ↔ enfant
CREATE TABLE public.parent_student_links (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- TABLE : parent_messages — canal parent ↔ école
CREATE TABLE public.parent_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id    uuid        NOT NULL REFERENCES public.parent_student_links(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.parent_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_messages      ENABLE ROW LEVEL SECURITY;

-- parent_profiles : accès propre
CREATE POLICY "pp_own" ON public.parent_profiles
  FOR ALL USING (auth.uid() = id);

-- parent_profiles : admin lit tout
CREATE POLICY "pp_admin_read" ON public.parent_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND role = 'admin')
  );

-- parent_student_links : le parent voit ses liens, admin et profs voient tout
CREATE POLICY "psl_select" ON public.parent_student_links
  FOR SELECT USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid() AND role IN ('admin', 'professeur')
    )
  );

-- parent_student_links : le parent crée son lien
CREATE POLICY "psl_insert" ON public.parent_student_links
  FOR INSERT WITH CHECK (parent_id = auth.uid());

-- parent_student_links : le parent ou l'admin peut supprimer
CREATE POLICY "psl_delete" ON public.parent_student_links
  FOR DELETE USING (
    parent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND role = 'admin')
  );

-- parent_messages : tous les connectés lisent (filtrage côté app par link_id)
CREATE POLICY "pm_select" ON public.parent_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- parent_messages : parent / prof / admin peut envoyer
CREATE POLICY "pm_insert" ON public.parent_messages
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid() AND role IN ('professeur', 'admin')
    ) OR (
      author_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_id = auth.uid()
      )
    )
  );

-- parent_messages : auteur peut supprimer le sien
CREATE POLICY "pm_delete" ON public.parent_messages
  FOR DELETE USING (author_id = auth.uid());
