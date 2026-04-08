-- Migration : ajout des rôles 'coordinateur' et 'staff' à l'enum role_principal
--
-- coordinateur = professeur responsable pédagogique → utilise teacher_profiles
-- staff        = personnel administratif école      → utilise admin_profiles
-- admin        = super administrateur (inchangé)

-- ADD VALUE ne peut pas être exécuté dans une transaction, c'est normal en PostgreSQL
ALTER TYPE role_principal ADD VALUE IF NOT EXISTS 'coordinateur';
ALTER TYPE role_principal ADD VALUE IF NOT EXISTS 'staff';

-- Commentaire de documentation
COMMENT ON TYPE role_principal IS
  'Rôles utilisateurs: eleve | professeur | coordinateur | staff | admin | entreprise | parent
   coordinateur → teacher_profiles (responsable pédagogique)
   staff        → admin_profiles   (personnel administratif, secrétariat, direction)
   admin        → admin_profiles   (super-administrateur)';
