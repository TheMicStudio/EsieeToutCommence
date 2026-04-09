-- Module 08 : disponibilités hebdomadaires des professeurs
-- Remplace l'ancien système de créneaux horaires par une sélection de semaines dans l'année

CREATE TABLE teacher_week_availabilities (
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL, -- toujours un lundi (YYYY-MM-DD)
  PRIMARY KEY (teacher_id, week_start)
);

ALTER TABLE teacher_week_availabilities ENABLE ROW LEVEL SECURITY;

-- Admin : accès complet
CREATE POLICY "admin_full_teacher_weeks" ON teacher_week_availabilities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Professeur / coordinateur : gère ses propres semaines
CREATE POLICY "teacher_own_weeks" ON teacher_week_availabilities
  FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
