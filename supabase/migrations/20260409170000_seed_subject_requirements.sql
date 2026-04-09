-- ============================================================
-- HUB ÉCOLE — Migration 038
-- Données initiales : affectations prof → matière → classe
--
-- Suite au refactoring (subject_requirements = source de vérité),
-- teacher_classes était vide en prod car les anciennes entrées
-- avaient été créées directement (sans subject_requirements).
-- Ce script insère les subject_requirements ; le trigger
-- trg_teacher_classes_on_req_insert peuple teacher_classes
-- automatiquement, redonnant aux profs accès à leurs classes.
--
-- Idempotent : ON CONFLICT DO NOTHING
-- ============================================================

INSERT INTO public.subject_requirements
  (class_id, teacher_id, subject_name, total_hours_required, session_duration_h, session_type)
VALUES
  -- ── BTS SIO SLAM 2 ──────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Algorithmique',            30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Développement web',        50,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Bases de données',         40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0010000-0000-0000-0000-000000000003', 'Droit informatique',       25,   2,   'CLASSIC'),

  -- ── BTS SIO SLAM 1 ──────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Développement web',        50,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Bases de données',         40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000003', 'Économie numérique',       25,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000004', 'Support et mise en service', 35, 3.5, 'CLASSIC'),

  -- ── BTS SIO SISR 1 ──────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            35,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'Réseaux',                  50,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'Cybersécurité',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000004', 'SI et gestion de patrimoine', 35, 2, 'CLASSIC'),

  -- ── BTS SIO SISR 2 ──────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Réseaux',                  45,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Administration systèmes',  50,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Cybersécurité',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000003', 'Droit informatique',       25,   2,   'CLASSIC')

ON CONFLICT (class_id, teacher_id, subject_name) DO NOTHING;

-- Le trigger trg_teacher_classes_on_req_insert s'est déclenché pour chaque ligne
-- → teacher_classes est maintenant peuplé, les profs ont retrouvé leurs accès
