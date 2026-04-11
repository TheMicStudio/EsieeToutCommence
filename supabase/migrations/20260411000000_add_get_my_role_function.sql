-- ── Fonction SECURITY DEFINER pour lire son propre rôle ─────────────────────
-- Nécessaire pour les clients mobiles (anon key) qui déclenchent
-- la récursion infinie de la policy "Admin lecture tous les roles" sur user_roles.
-- SECURITY DEFINER = s'exécute avec les droits du owner (postgres), bypass RLS.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Accessible à tous les utilisateurs connectés
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
