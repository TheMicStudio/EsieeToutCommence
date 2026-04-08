-- ============================================================
-- HUB ÉCOLE — Migration : ajout email dans les tables profils
-- ============================================================

ALTER TABLE public.student_profiles  ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.teacher_profiles  ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_profiles    ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.company_profiles  ADD COLUMN IF NOT EXISTS email TEXT;
