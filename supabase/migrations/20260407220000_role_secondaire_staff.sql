-- Ajoute role_secondaire aux profils professeur et admin
-- (même logique que student_profiles, valeurs dynamiques depuis secondary_roles)

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS role_secondaire TEXT;

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS role_secondaire TEXT;

-- Supprime la contrainte CHECK statique sur student_profiles
-- pour utiliser les valeurs dynamiques de la table secondary_roles
ALTER TABLE public.student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_role_secondaire_check;
