-- ============================================================
-- MODULE 06 — Émargement QR Code
-- ============================================================

-- -----------------------------------------------------------
-- TABLE : attendance_sessions
-- -----------------------------------------------------------
CREATE TABLE public.attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES auth.users(id),
  code_unique  UUID NOT NULL DEFAULT gen_random_uuid(),
  expiration   TIMESTAMPTZ NOT NULL,
  statut       TEXT NOT NULL DEFAULT 'ouvert'
               CHECK (statut IN ('ouvert', 'ferme')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : attendance_records
-- -----------------------------------------------------------
CREATE TABLE public.attendance_records (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES auth.users(id),
  statut_presence    TEXT NOT NULL DEFAULT 'present'
                     CHECK (statut_presence IN ('present', 'en_retard')),
  heure_pointage     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_fingerprint TEXT NOT NULL,
  UNIQUE (session_id, student_id),
  UNIQUE (session_id, device_fingerprint)
);

-- -----------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records  ENABLE ROW LEVEL SECURITY;

-- Sessions : prof voit ses sessions
CREATE POLICY "Prof voit ses sessions" ON public.attendance_sessions
  FOR SELECT USING (auth.uid() = teacher_id);

-- Sessions : admin voit tout
CREATE POLICY "Admin voit toutes les sessions" ON public.attendance_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Sessions : un prof de la classe peut créer
CREATE POLICY "Prof crée une session" ON public.attendance_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM public.teacher_classes
      WHERE teacher_id = auth.uid() AND class_id = attendance_sessions.class_id
    )
  );

-- Sessions : fermeture par le prof propriétaire
CREATE POLICY "Prof ferme sa session" ON public.attendance_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Records : élève voit ses pointages
CREATE POLICY "Eleve voit ses pointages" ON public.attendance_records
  FOR SELECT USING (auth.uid() = student_id);

-- Records : prof voit les pointages de ses sessions
CREATE POLICY "Prof voit pointages de sa session" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
  );

-- Records : admin voit tout
CREATE POLICY "Admin voit tous les pointages" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Records : pointage par l'élève (session ouverte, non expirée, membre de la classe)
CREATE POLICY "Pointage élève" ON public.attendance_records
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND s.statut = 'ouvert'
        AND s.expiration > NOW()
    ) AND
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      JOIN public.class_members cm ON cm.class_id = s.class_id
      WHERE s.id = session_id AND cm.student_id = auth.uid()
    )
  );
