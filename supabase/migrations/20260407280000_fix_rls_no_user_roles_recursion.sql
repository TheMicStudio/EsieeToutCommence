-- ── Correction : suppression des subqueries user_roles dans les policies ─────
-- Les policies qui font EXISTS(SELECT FROM user_roles) déclenchent la policy
-- récursive "Admin lecture tous les roles". On remplace par des policies simples
-- et on délègue les vérifications de rôle au client admin (côté applicatif).

-- ── news_posts ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "news_posts_insert" ON news_posts;
DROP POLICY IF EXISTS "news_posts_update" ON news_posts;
DROP POLICY IF EXISTS "news_posts_delete" ON news_posts;

-- INSERT : tout utilisateur connecté (vérification du rôle dans le server action)
CREATE POLICY "news_posts_insert"
  ON news_posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- UPDATE : auteur uniquement (l'admin utilise le client admin qui bypass RLS)
CREATE POLICY "news_posts_update"
  ON news_posts FOR UPDATE
  USING (author_id = auth.uid());

-- DELETE : auteur uniquement (idem)
CREATE POLICY "news_posts_delete"
  ON news_posts FOR DELETE
  USING (author_id = auth.uid());

-- ── parent_profiles ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pp_admin_read" ON public.parent_profiles;
-- La policy "pp_own" suffit ; les lectures admin passent par le client admin

-- ── parent_student_links ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "psl_select" ON public.parent_student_links;

-- SELECT : le parent voit ses propres liens (profs/admins passent par client admin)
CREATE POLICY "psl_select"
  ON public.parent_student_links FOR SELECT
  USING (parent_id = auth.uid());

-- ── parent_messages ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pm_insert" ON public.parent_messages;

-- INSERT : tout utilisateur connecté peut envoyer (vérification link_id côté app)
CREATE POLICY "pm_insert"
  ON public.parent_messages FOR INSERT
  WITH CHECK (author_id = auth.uid());
