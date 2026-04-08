-- ============================================================
-- HUB ÉCOLE — Seed de développement
-- Crée des comptes de test complets avec données liées
-- ============================================================
-- Comptes créés :
--   etudiant@hub-ecole.dev     / Test1234!  (élève, BTS SIO, alternant)
--   prof@hub-ecole.dev         / Test1234!  (professeur, Mathématiques)
--   coordinateur@hub-ecole.dev / Test1234!  (coordinateur pédagogique)
--   staff@hub-ecole.dev        / Test1234!  (personnel administratif)
--   admin@hub-ecole.dev        / Test1234!  (super-administrateur)
--   entreprise@hub-ecole.dev   / Test1234!  (entreprise, Acme Corp)
-- ============================================================

-- ─── Nettoyage (ordre inverse des FK) ───────────────────────
DELETE FROM public.retro_postits;
DELETE FROM public.retro_boards;
DELETE FROM public.soutenance_slots;
DELETE FROM public.group_members;
DELETE FROM public.project_groups;
DELETE FROM public.project_weeks;
DELETE FROM public.attendance_records;
DELETE FROM public.attendance_sessions;
DELETE FROM public.staff_messages;
DELETE FROM public.staff_channels WHERE nom NOT IN ('Conseil de classe', 'Infos Direction');
DELETE FROM public.ticket_messages;
DELETE FROM public.faq_articles;
DELETE FROM public.tickets;
DELETE FROM public.tripartite_messages;
DELETE FROM public.tripartite_chats;
DELETE FROM public.apprenticeship_entries;
DELETE FROM public.event_registrations;
DELETE FROM public.career_events;
DELETE FROM public.job_offers;
DELETE FROM public.grades;
DELETE FROM public.course_materials;
DELETE FROM public.class_messages;
DELETE FROM public.class_channels;
DELETE FROM public.class_members;
DELETE FROM public.teacher_classes;
DELETE FROM public.classes;
DELETE FROM public.student_profiles;
DELETE FROM public.teacher_profiles;
DELETE FROM public.admin_profiles;
DELETE FROM public.company_profiles;
DELETE FROM public.user_roles;
DELETE FROM auth.users WHERE email IN (
  'etudiant@hub-ecole.dev',
  'prof@hub-ecole.dev',
  'coordinateur@hub-ecole.dev',
  'staff@hub-ecole.dev',
  'admin@hub-ecole.dev',
  'entreprise@hub-ecole.dev'
);

-- ─── Comptes Supabase Auth ───────────────────────────────────
-- Bloc DO : search_path et hachage dans le même contexte d'exécution
DO $$
DECLARE
  h text;
BEGIN
  -- pgcrypto est dans le schema extensions sur Supabase Cloud
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  SET LOCAL search_path TO public, extensions;
  h := crypt('Test1234!', gen_salt('bf'));

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, aud, role
  ) VALUES
    ('11111111-1111-1111-1111-111111111111', 'etudiant@hub-ecole.dev',     h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-2222-2222-2222-222222222222', 'prof@hub-ecole.dev',         h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('33333333-3333-3333-3333-333333333333', 'admin@hub-ecole.dev',        h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('55555555-5555-5555-5555-555555555555', 'coordinateur@hub-ecole.dev', h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('66666666-6666-6666-6666-666666666666', 'staff@hub-ecole.dev',        h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('44444444-4444-4444-4444-444444444444', 'entreprise@hub-ecole.dev',   h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"etudiant@hub-ecole.dev","email_verified":true}',     'email', '11111111-1111-1111-1111-111111111111', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"prof@hub-ecole.dev","email_verified":true}',         'email', '22222222-2222-2222-2222-222222222222', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"admin@hub-ecole.dev","email_verified":true}',        'email', '33333333-3333-3333-3333-333333333333', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '{"sub":"55555555-5555-5555-5555-555555555555","email":"coordinateur@hub-ecole.dev","email_verified":true}', 'email', '55555555-5555-5555-5555-555555555555', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '{"sub":"66666666-6666-6666-6666-666666666666","email":"staff@hub-ecole.dev","email_verified":true}',        'email', '66666666-6666-6666-6666-666666666666', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"entreprise@hub-ecole.dev","email_verified":true}',   'email', '44444444-4444-4444-4444-444444444444', NOW(), NOW(), NOW());
END $$;

-- ─── Rôles ──────────────────────────────────────────────────
INSERT INTO public.user_roles (id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'eleve'),
  ('22222222-2222-2222-2222-222222222222', 'professeur'),
  ('55555555-5555-5555-5555-555555555555', 'coordinateur'),
  ('66666666-6666-6666-6666-666666666666', 'staff'),
  ('33333333-3333-3333-3333-333333333333', 'admin'),
  ('44444444-4444-4444-4444-444444444444', 'entreprise');

-- ─── Profils ─────────────────────────────────────────────────
INSERT INTO public.student_profiles (id, nom, prenom, type_parcours) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Martin', 'Lucas', 'alternant');

INSERT INTO public.teacher_profiles (id, nom, prenom, matieres_enseignees) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Bernard', 'Sophie', ARRAY['Mathématiques', 'Algorithmique']),
  ('55555555-5555-5555-5555-555555555555', 'Moreau', 'Julien', ARRAY['Gestion de projet', 'Pédagogie']);

INSERT INTO public.admin_profiles (id, nom, prenom, fonction) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Dupont', 'Marie', 'Super administrateur'),
  ('66666666-6666-6666-6666-666666666666', 'Laurent', 'Isabelle', 'Secrétariat pédagogique');

INSERT INTO public.company_profiles (id, nom, prenom, entreprise, poste) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Leroy', 'Thomas', 'Acme Corp', 'Maître d''apprentissage');

-- ─── Classe ──────────────────────────────────────────────────
INSERT INTO public.classes (id, nom, annee) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BTS SIO SLAM 2', 2026);

INSERT INTO public.class_members (class_id, student_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111');

INSERT INTO public.teacher_classes (class_id, teacher_id, matiere) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Mathématiques'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Algorithmique');

-- ─── Matériaux de cours ──────────────────────────────────────
INSERT INTO public.course_materials (id, class_id, teacher_id, titre, type, url, matiere) VALUES
  (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Introduction aux algorithmes de tri',
    'pdf',
    'https://exemple.fr/cours/tri.pdf',
    'Algorithmique'
  ),
  (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Cours Mathématiques — Probabilités',
    'lien',
    'https://exemple.fr/cours/proba',
    'Mathématiques'
  );

-- ─── Notes ───────────────────────────────────────────────────
INSERT INTO public.grades (student_id, teacher_id, class_id, matiere, examen, note, coefficient) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques', 'DS n°1', 14.5, 2),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques', 'Contrôle', 12.0, 1),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique', 'TP noté', 16.0, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique', 'Projet', 18.0, 2);

-- ─── Canaux de classe (via trigger normalement, mais seed manuel) ─
INSERT INTO public.class_channels (id, class_id, nom) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Général'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Entraide élèves');

-- ─── Messages de classe ──────────────────────────────────────
INSERT INTO public.class_messages (channel_id, author_id, contenu) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Bonjour à tous ! Le TP de lundi est confirmé.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Merci professeur !'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Quelqu''un a les corrections du DS ?');

-- ─── Offres d'emploi ─────────────────────────────────────────
INSERT INTO public.job_offers (id, titre, entreprise, description, type_contrat, localisation, publie_par, actif) VALUES
  (
    gen_random_uuid(),
    'Développeur Full Stack — Alternance',
    'Acme Corp',
    'Rejoignez notre équipe tech pour une alternance de 2 ans en développement web.',
    'alternance',
    'Paris 8e',
    '44444444-4444-4444-4444-444444444444',
    true
  ),
  (
    gen_random_uuid(),
    'Stage DevOps — 6 mois',
    'TechStart',
    'Environnement cloud AWS, CI/CD, Kubernetes.',
    'stage',
    'Lyon',
    '33333333-3333-3333-3333-333333333333',
    true
  );

-- ─── Événements carrière ─────────────────────────────────────
INSERT INTO public.career_events (id, titre, description, lieu, date_debut, date_fin, publie_par) VALUES
  (
    gen_random_uuid(),
    'Forum entreprises 2026',
    'Rencontrez 30 entreprises partenaires en une journée.',
    'Campus ESIEE — Amphi A',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days' + INTERVAL '8 hours',
    '33333333-3333-3333-3333-333333333333'
  );

-- ─── Ticket support ──────────────────────────────────────────
INSERT INTO public.tickets (id, sujet, description, categorie, statut, auteur_id) VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Accès à l''ENT impossible depuis hier',
    'Je n''arrive plus à me connecter à l''ENT depuis hier soir. J''ai essayé sur Firefox et Chrome.',
    'informatique',
    'ouvert',
    '11111111-1111-1111-1111-111111111111'
  );

-- ─── Article FAQ ─────────────────────────────────────────────
INSERT INTO public.faq_articles (question, reponse, categorie, publie, auteur_id) VALUES
  (
    'Comment réinitialiser mon mot de passe ?',
    'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Un email vous sera envoyé avec un lien de réinitialisation valable 1 heure.',
    'informatique',
    true,
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'Comment accéder à mes notes ?',
    'Dans le dashboard, cliquez sur "Pédagogie" puis "Mes notes". Vous y trouverez toutes vos notes par matière avec votre moyenne générale.',
    'pedagogie',
    true,
    '33333333-3333-3333-3333-333333333333'
  );

-- ─── Message canal staff ─────────────────────────────────────
INSERT INTO public.staff_messages (channel_id, author_id, contenu)
SELECT id, '33333333-3333-3333-3333-333333333333', 'Réunion pédagogique vendredi à 14h — salle B204.'
FROM public.staff_channels WHERE nom = 'Conseil de classe' LIMIT 1;

-- ─── Récapitulatif ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED TERMINÉ — Comptes de test :';
  RAISE NOTICE '  etudiant@hub-ecole.dev     / Test1234!  (élève alternant)';
  RAISE NOTICE '  prof@hub-ecole.dev         / Test1234!  (professeur)';
  RAISE NOTICE '  coordinateur@hub-ecole.dev / Test1234!  (coordinateur pédagogique)';
  RAISE NOTICE '  staff@hub-ecole.dev        / Test1234!  (personnel administratif)';
  RAISE NOTICE '  admin@hub-ecole.dev        / Test1234!  (super-administrateur)';
  RAISE NOTICE '  entreprise@hub-ecole.dev   / Test1234!  (entreprise)';
  RAISE NOTICE '========================================';
END $$;
