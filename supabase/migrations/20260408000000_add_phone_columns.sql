-- Migration : ajout colonnes phone_mobile et phone_fixed sur tous les profils
-- Ref : docs/fix/correction.md — Bug #4

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS phone_mobile TEXT,
  ADD COLUMN IF NOT EXISTS phone_fixed  TEXT;

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS phone_mobile TEXT,
  ADD COLUMN IF NOT EXISTS phone_fixed  TEXT;

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS phone_mobile TEXT,
  ADD COLUMN IF NOT EXISTS phone_fixed  TEXT;

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS phone_mobile TEXT,
  ADD COLUMN IF NOT EXISTS phone_fixed  TEXT;

ALTER TABLE public.parent_profiles
  ADD COLUMN IF NOT EXISTS phone_mobile TEXT,
  ADD COLUMN IF NOT EXISTS phone_fixed  TEXT;
