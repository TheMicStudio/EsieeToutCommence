-- ── Module : Actualités / Newsletter ────────────────────────────────────────

CREATE TABLE news_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  content     text        NOT NULL,
  author_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text        NOT NULL DEFAULT 'annonce'
                          CHECK (category IN ('annonce', 'actu', 'evenement')),
  pinned      boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs connectés peuvent lire
CREATE POLICY "news_posts_select"
  ON news_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seuls admin et professeur peuvent créer
CREATE POLICY "news_posts_insert"
  ON news_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid()
        AND role IN ('admin', 'professeur')
    )
  );

-- Auteur ou admin peut modifier
CREATE POLICY "news_posts_update"
  ON news_posts FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auteur ou admin peut supprimer
CREATE POLICY "news_posts_delete"
  ON news_posts FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
