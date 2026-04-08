-- ── Ajout du rôle parent dans l'ENUM (transaction séparée obligatoire) ─────────
ALTER TYPE public.role_principal ADD VALUE 'parent';
