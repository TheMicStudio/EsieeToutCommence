-- ============================================================
-- HUB ÉCOLE — Seed de développement enrichi
-- Simule un site complet en production avec données réalistes
-- ============================================================
-- Comptes créés :
--   etudiant@hub-ecole.dev      / Test1234!  (élève, BTS SIO SLAM 2, alternant — Lucas Martin)
--   etudiant2@hub-ecole.dev     / Test1234!  (élève, BTS SIO SLAM 2, temps plein — Emma Rousseau)
--   etudiant3@hub-ecole.dev     / Test1234!  (élève, BTS SIO SLAM 2, alternant — Hugo Petit)
--   prof@hub-ecole.dev          / Test1234!  (professeur — Sophie Bernard)
--   prof2@hub-ecole.dev         / Test1234!  (professeur — Antoine Girard)
--   coordinateur@hub-ecole.dev  / Test1234!  (responsable pédagogique — Julien Moreau)
--   staff@hub-ecole.dev         / Test1234!  (secrétariat — Isabelle Laurent)
--   admin@hub-ecole.dev         / Test1234!  (direction — Marie Dupont)
--   entreprise@hub-ecole.dev    / Test1234!  (tuteur pro — Thomas Leroy, Acme Corp)
--   entreprise2@hub-ecole.dev   / Test1234!  (tuteur pro — Caroline Favre, Nextech SAS)
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
DELETE FROM public.staff_channels;
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
DELETE FROM public.news_posts;
DELETE FROM public.student_profiles;
DELETE FROM public.teacher_profiles;
DELETE FROM public.admin_profiles;
DELETE FROM public.company_profiles;
DELETE FROM public.user_roles;
DELETE FROM auth.users WHERE email IN (
  'etudiant@hub-ecole.dev',
  'etudiant2@hub-ecole.dev',
  'etudiant3@hub-ecole.dev',
  'prof@hub-ecole.dev',
  'prof2@hub-ecole.dev',
  'coordinateur@hub-ecole.dev',
  'staff@hub-ecole.dev',
  'admin@hub-ecole.dev',
  'entreprise@hub-ecole.dev',
  'entreprise2@hub-ecole.dev'
);

-- ─── Comptes Supabase Auth ───────────────────────────────────
DO $$
DECLARE
  h text;
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  SET LOCAL search_path TO public, extensions;
  h := crypt('Test1234!', gen_salt('bf'));

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, aud, role
  ) VALUES
    ('11111111-1111-1111-1111-111111111111', 'etudiant@hub-ecole.dev',      h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('77777777-7777-7777-7777-777777777777', 'etudiant2@hub-ecole.dev',     h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('88888888-8888-8888-8888-888888888888', 'etudiant3@hub-ecole.dev',     h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-2222-2222-2222-222222222222', 'prof@hub-ecole.dev',          h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('99999999-9999-9999-9999-999999999999', 'prof2@hub-ecole.dev',         h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('33333333-3333-3333-3333-333333333333', 'admin@hub-ecole.dev',         h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('55555555-5555-5555-5555-555555555555', 'coordinateur@hub-ecole.dev',  h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('66666666-6666-6666-6666-666666666666', 'staff@hub-ecole.dev',         h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('44444444-4444-4444-4444-444444444444', 'entreprise@hub-ecole.dev',    h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'entreprise2@hub-ecole.dev',   h, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"etudiant@hub-ecole.dev","email_verified":true}',      'email', '11111111-1111-1111-1111-111111111111', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '{"sub":"77777777-7777-7777-7777-777777777777","email":"etudiant2@hub-ecole.dev","email_verified":true}',     'email', '77777777-7777-7777-7777-777777777777', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '88888888-8888-8888-8888-888888888888', '{"sub":"88888888-8888-8888-8888-888888888888","email":"etudiant3@hub-ecole.dev","email_verified":true}',     'email', '88888888-8888-8888-8888-888888888888', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"prof@hub-ecole.dev","email_verified":true}',          'email', '22222222-2222-2222-2222-222222222222', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '99999999-9999-9999-9999-999999999999', '{"sub":"99999999-9999-9999-9999-999999999999","email":"prof2@hub-ecole.dev","email_verified":true}',         'email', '99999999-9999-9999-9999-999999999999', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"admin@hub-ecole.dev","email_verified":true}',         'email', '33333333-3333-3333-3333-333333333333', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '{"sub":"55555555-5555-5555-5555-555555555555","email":"coordinateur@hub-ecole.dev","email_verified":true}',  'email', '55555555-5555-5555-5555-555555555555', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '{"sub":"66666666-6666-6666-6666-666666666666","email":"staff@hub-ecole.dev","email_verified":true}',         'email', '66666666-6666-6666-6666-666666666666', NOW(), NOW(), NOW()),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"entreprise@hub-ecole.dev","email_verified":true}',    'email', '44444444-4444-4444-4444-444444444444', NOW(), NOW(), NOW()),
    (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","email":"entreprise2@hub-ecole.dev","email_verified":true}',  'email', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW(), NOW(), NOW());
END $$;

-- ─── Rôles ──────────────────────────────────────────────────
INSERT INTO public.user_roles (id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'eleve'),
  ('77777777-7777-7777-7777-777777777777', 'eleve'),
  ('88888888-8888-8888-8888-888888888888', 'eleve'),
  ('22222222-2222-2222-2222-222222222222', 'professeur'),
  ('99999999-9999-9999-9999-999999999999', 'professeur'),
  ('55555555-5555-5555-5555-555555555555', 'coordinateur'),
  ('66666666-6666-6666-6666-666666666666', 'staff'),
  ('33333333-3333-3333-3333-333333333333', 'admin'),
  ('44444444-4444-4444-4444-444444444444', 'entreprise'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'entreprise');

-- ─── Profils ─────────────────────────────────────────────────
INSERT INTO public.student_profiles (id, nom, prenom, type_parcours) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Martin',   'Lucas', 'alternant'),
  ('77777777-7777-7777-7777-777777777777', 'Rousseau', 'Emma',  'temps_plein'),
  ('88888888-8888-8888-8888-888888888888', 'Petit',    'Hugo',  'alternant');

INSERT INTO public.teacher_profiles (id, nom, prenom, matieres_enseignees) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Bernard', 'Sophie',  ARRAY['Mathématiques', 'Algorithmique']),
  ('99999999-9999-9999-9999-999999999999', 'Girard',  'Antoine', ARRAY['Développement web', 'Bases de données', 'Anglais technique']),
  ('55555555-5555-5555-5555-555555555555', 'Moreau',  'Julien',  ARRAY['Gestion de projet', 'Pédagogie']);

INSERT INTO public.admin_profiles (id, nom, prenom, fonction) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Dupont',  'Marie',    'Directrice des études'),
  ('66666666-6666-6666-6666-666666666666', 'Laurent', 'Isabelle', 'Secrétariat pédagogique');

INSERT INTO public.company_profiles (id, nom, prenom, entreprise, poste) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Leroy', 'Thomas',   'Acme Corp',   'Maître d''apprentissage'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Favre', 'Caroline', 'Nextech SAS', 'Responsable technique');

-- ─── Classe ──────────────────────────────────────────────────
INSERT INTO public.classes (id, nom, annee) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BTS SIO SLAM 2', 2026);

INSERT INTO public.class_members (class_id, student_id, is_current) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', true);

INSERT INTO public.teacher_classes (class_id, teacher_id, matiere) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Mathématiques'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Algorithmique'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Développement web'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Bases de données');

-- ─── Canaux de classe ────────────────────────────────────────
INSERT INTO public.class_channels (id, class_id, nom) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Général'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Entraide élèves'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Projets & annonces');

-- ─── Messages de classe ──────────────────────────────────────
INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Bonjour à tous ! Le TP d''algorithmique de lundi est confirmé en salle B204. N''oubliez pas d''apporter votre PC.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Merci professeur ! On aura les consignes avant ?', NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Oui, je les posterai vendredi soir sur la plateforme.', NOW() - INTERVAL '10 days' + INTERVAL '30 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', 'Parfait merci ! Est-ce qu''on peut travailler en binôme ?', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Oui, en binôme ou individuel au choix.', NOW() - INTERVAL '10 days' + INTERVAL '1 hour'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Rappel : le rendu du TP React est pour jeudi 23h59. Format : lien GitHub + démo en ligne si possible.', NOW() - INTERVAL '7 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', 'M. Girard, est-ce qu''on peut utiliser TypeScript ou seulement JavaScript ?', NOW() - INTERVAL '7 days' + INTERVAL '20 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'TypeScript est même recommandé ! Bonus de +1 si le typage est bien fait.', NOW() - INTERVAL '7 days' + INTERVAL '1 hour'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'Réunion parents-professeurs le 20 avril à 18h — amphithéâtre B. La présence est fortement recommandée.', NOW() - INTERVAL '3 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 'Les bulletins du 2e semestre sont disponibles dans votre espace. Vérifiez vos notes avant vendredi.', NOW() - INTERVAL '2 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Quelqu''un a les corrections du DS de maths ?', NOW() - INTERVAL '8 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'J''ai quelques corrections, je les partage sur le drive ce soir !', NOW() - INTERVAL '8 days' + INTERVAL '15 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'Merci Emma ! Tu sais si la moyenne de classe était bonne ?', NOW() - INTERVAL '8 days' + INTERVAL '30 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'Sophie a dit autour de 11,5 je crois. Pas terrible...', NOW() - INTERVAL '8 days' + INTERVAL '45 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'On fait une session de révision samedi ? Bibliothèque à 10h ?', NOW() - INTERVAL '5 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'Je suis partante ! Hugo t''es dispo ?', NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'Samedi j''ai mon entreprise le matin mais je peux venir l''après-midi vers 14h.', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '99999999-9999-9999-9999-999999999999', 'La semaine projet "API REST" commence le 5 mai. Commencez à réfléchir à vos groupes !', NOW() - INTERVAL '4 days'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '22222222-2222-2222-2222-222222222222', 'Pour les soutenances de la semaine projet Application Mobile : planning disponible dans l''espace Projets.', NOW() - INTERVAL '1 day');

-- ─── Matériaux de cours ──────────────────────────────────────
INSERT INTO public.course_materials (id, class_id, teacher_id, titre, type, url, matiere) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
   'Introduction aux algorithmes de tri', 'pdf', 'https://exemple.fr/cours/tri.pdf', 'Algorithmique'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
   'Cours Mathématiques — Probabilités et statistiques', 'lien', 'https://exemple.fr/cours/proba', 'Mathématiques'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
   'TD Algorithmique — Récursivité', 'pdf', 'https://exemple.fr/td/recursivite.pdf', 'Algorithmique'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
   'DS Mathématiques n°2 — Suites et séries', 'pdf', 'https://exemple.fr/ds/maths2.pdf', 'Mathématiques'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
   'Introduction à React & les hooks', 'video', 'https://exemple.fr/cours/react-hooks', 'Développement web'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
   'TP React — Création d''une SPA', 'pdf', 'https://exemple.fr/tp/react-spa.pdf', 'Développement web'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
   'Cours SQL avancé — Jointures et sous-requêtes', 'pdf', 'https://exemple.fr/cours/sql-avance.pdf', 'Bases de données'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
   'TP Bases de données — Modélisation MCD/MLD', 'pdf', 'https://exemple.fr/tp/bdd-mcd.pdf', 'Bases de données'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
   'Ressources Anglais technique — Vocabulaire IT', 'lien', 'https://exemple.fr/anglais/vocab-it', 'Anglais technique');

-- ─── Notes ───────────────────────────────────────────────────
INSERT INTO public.grades (student_id, teacher_id, class_id, matiere, examen, note, coefficient) VALUES
  -- Lucas Martin
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'DS n°1',               14.5, 2),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'Contrôle continu',     12.0, 1),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'DS n°2',               13.5, 2),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'TP noté',              16.0, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'Projet semaine',       18.0, 2),
  ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement web','TP React',            17.0, 3),
  ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bases de données', 'DS SQL',              15.5, 2),
  ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anglais technique','Oral de présentation',14.0, 1),
  -- Emma Rousseau
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'DS n°1',               11.5, 2),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'Contrôle continu',     13.0, 1),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'DS n°2',               10.0, 2),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'TP noté',              14.5, 3),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'Projet semaine',       15.0, 2),
  ('77777777-7777-7777-7777-777777777777', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement web','TP React',            19.0, 3),
  ('77777777-7777-7777-7777-777777777777', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bases de données', 'DS SQL',              16.0, 2),
  -- Hugo Petit
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'DS n°1',               9.5,  2),
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mathématiques',   'Contrôle continu',     11.0, 1),
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'TP noté',              13.0, 3),
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Algorithmique',   'Projet semaine',       14.0, 2),
  ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement web','TP React',            15.0, 3),
  ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bases de données', 'DS SQL',              12.0, 2);

-- ─── Offres d'emploi ─────────────────────────────────────────
INSERT INTO public.job_offers (titre, entreprise, description, type_contrat, localisation, lien_candidature, publie_par, actif) VALUES
  (
    'Développeur Full Stack — Alternance 2 ans',
    'Acme Corp',
    'Rejoignez notre équipe tech dans une startup en pleine croissance. Stack : React, Node.js, PostgreSQL. Vous participerez au développement de notre plateforme SaaS B2B avec 20 000 utilisateurs actifs. Tutorat par un senior dev.',
    'alternance', 'Paris 8e', 'https://exemple.fr/jobs/acme-dev-fullstack',
    '44444444-4444-4444-4444-444444444444', true
  ),
  (
    'Stage DevOps — 6 mois',
    'TechStart',
    'Environnement cloud AWS, CI/CD avec GitHub Actions, orchestration Kubernetes. Vous automatiserez les pipelines de déploiement et monitorerez l''infrastructure. Bonne ambiance garantie, équipe de 8 ingénieurs.',
    'stage', 'Lyon', 'https://exemple.fr/jobs/techstart-devops',
    '33333333-3333-3333-3333-333333333333', true
  ),
  (
    'Développeur mobile Flutter — Alternance',
    'Nextech SAS',
    'Développement d''une application mobile B2C sur iOS et Android avec Flutter/Dart. L''alternant sera intégré à l''équipe produit et participera aux sprints Agile. Rythme : 3j entreprise / 2j école.',
    'alternance', 'Paris 13e', 'https://nextech.fr/jobs/flutter-dev',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true
  ),
  (
    'Stage Développeur Web — 3 à 6 mois',
    'Agence Pixel',
    'Intégration HTML/CSS, développement de sites WordPress et prestashop. Idéal pour découvrir le monde du web en agence. Petite structure, ambiance détendue, mentoring personnalisé.',
    'stage', 'Bordeaux', 'https://exemple.fr/jobs/pixel-web',
    '33333333-3333-3333-3333-333333333333', true
  ),
  (
    'Alternance Administrateur Systèmes & Réseaux',
    'BankPro Finance',
    'Administration de l''infrastructure IT d''une grande banque régionale. Windows Server, Active Directory, VMware, sécurité réseau. Encadrement d''un ingénieur certifié CCNA. Très bon niveau de rémunération.',
    'alternance', 'Strasbourg', 'https://exemple.fr/jobs/bankpro-sysadmin',
    '33333333-3333-3333-3333-333333333333', true
  ),
  (
    'CDI Développeur Backend Python',
    'DataLab Analytics',
    'Poste ouvert aux alternants diplômés. Développement d''APIs Python/FastAPI, traitement de données massives, machine learning. Équipe de 15 data scientists et développeurs. Télétravail partiel (2j/semaine).',
    'cdi', 'Paris 9e', 'https://exemple.fr/jobs/datalab-python',
    '55555555-5555-5555-5555-555555555555', true
  ),
  (
    'Stage Cybersécurité — Pentest & Audit',
    'SecureIT',
    'Tests d''intrusion, audit de sécurité applicative, rédaction de rapports. Vous serez accompagné par des experts OSCP. Stage idéal pour une 1ère expérience en sécurité offensive.',
    'stage', 'Rennes', 'https://exemple.fr/jobs/secureit-pentest',
    '55555555-5555-5555-5555-555555555555', true
  ),
  (
    'Alternance Chef de projet digital',
    'MarketCo',
    'Coordination de projets digitaux, suivi des prestataires, animation de réunions clients. Excellent tremplin pour une carrière en management de projet. Certification Prince2 finançable.',
    'alternance', 'Nantes', 'https://exemple.fr/jobs/marketco-pm',
    '55555555-5555-5555-5555-555555555555', true
  ),
  (
    'CDD Développeur JavaScript — 12 mois',
    'MediaGroup',
    'Maintenance et évolution d''une suite d''outils internes React/TypeScript. Poste accessible dès BTS. Possibilité de CDI à l''issue du contrat selon évaluation.',
    'cdd', 'Toulouse', 'https://exemple.fr/jobs/mediagroup-js',
    '33333333-3333-3333-3333-333333333333', true
  ),
  (
    'Stage Data Analyst — 4 à 6 mois',
    'RetailChain',
    'Analyse des données de vente de 150 magasins, dashboarding Power BI, modélisation prédictive sous Python. Environnement stimulant avec accès à des datasets réels.',
    'stage', 'Paris 17e', 'https://exemple.fr/jobs/retailchain-data',
    '33333333-3333-3333-3333-333333333333', true
  ),
  (
    'Alternance Développeur .NET / C#',
    'Industrie Systèmes',
    'Développement d''applications de supervision industrielle en C#/.NET. Environnement Windows, SQL Server. Possibilité de travailler sur des systèmes embarqués. Profil rigoureux recherché.',
    'alternance', 'Grenoble', NULL,
    '55555555-5555-5555-5555-555555555555', true
  ),
  (
    'Stage UI/UX Designer — 3 mois minimum',
    'Startup Studio',
    'Conception d''interfaces sur Figma, tests utilisateurs, rédaction de specs fonctionnelles. Vous travaillerez directement avec les fondateurs sur 3 produits en cours de lancement.',
    'stage', 'Paris 11e', 'https://exemple.fr/jobs/startup-ux',
    '33333333-3333-3333-3333-333333333333', false
  );

-- ─── Événements carrière ─────────────────────────────────────
INSERT INTO public.career_events (id, titre, description, lieu, date_debut, date_fin, publie_par) VALUES
  (
    'cafe0001-cafe-cafe-cafe-cafe00000001',
    'Forum Entreprises 2026',
    'La grande journée de mise en relation entre étudiants et recruteurs. 35 entreprises partenaires présentes, dont des startups et grands groupes. Préparez votre CV, venez en tenue professionnelle. Des entretiens spot seront organisés sur place.',
    'Campus ESIEE — Amphithéâtre A',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days' + INTERVAL '8 hours',
    '55555555-5555-5555-5555-555555555555'
  ),
  (
    'cafe0002-cafe-cafe-cafe-cafe00000002',
    'Atelier CV & LinkedIn',
    'Atelier pratique animé par un coach en insertion professionnelle. Au programme : structurer un CV percutant, optimiser son profil LinkedIn, rédiger un message de contact. Places limitées à 20 personnes.',
    'Salle C105 — Campus',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
    '55555555-5555-5555-5555-555555555555'
  ),
  (
    'cafe0003-cafe-cafe-cafe-cafe00000003',
    'Journée portes ouvertes alternance',
    'Rencontrez les entreprises partenaires de l''école spécialisées dans l''accueil en alternance. Chaque entreprise présente ses postes ouverts pour la rentrée de septembre. Possibilité de déposer votre CV directement.',
    'Hall principal — Campus',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '21 days' + INTERVAL '6 hours',
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'cafe0004-cafe-cafe-cafe-cafe00000004',
    'Webinaire : Métiers de la cybersécurité',
    'Intervenants de SecureIT et BankPro présentent les métiers de la sécurité informatique, les certifications recommandées (CEH, OSCP), et les parcours pour y accéder depuis un BTS SIO.',
    'En ligne — Lien Teams envoyé par mail',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
    '55555555-5555-5555-5555-555555555555'
  ),
  (
    'cafe0005-cafe-cafe-cafe-cafe00000005',
    'Speed recruiting — Stages d''été',
    'Format speed-dating professionnel : 10 minutes par entreprise, 8 entreprises à rencontrer. Idéal pour les étudiants cherchant un stage de fin d''année. Résultats sous 48h.',
    'Salle polyvalente B — Campus',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '4 hours',
    '55555555-5555-5555-5555-555555555555'
  );

-- ─── Inscriptions aux événements ─────────────────────────────
INSERT INTO public.event_registrations (event_id, student_id) VALUES
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '11111111-1111-1111-1111-111111111111'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '77777777-7777-7777-7777-777777777777'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '88888888-8888-8888-8888-888888888888'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '77777777-7777-7777-7777-777777777777'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '88888888-8888-8888-8888-888888888888'),
  ('cafe0003-cafe-cafe-cafe-cafe00000003', '88888888-8888-8888-8888-888888888888');

-- ─── Chats tripartites ───────────────────────────────────────
INSERT INTO public.tripartite_chats (id, student_id, referent_id, maitre_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
  ('a0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- ─── Messages tripartites ────────────────────────────────────
INSERT INTO public.tripartite_messages (chat_id, author_id, contenu, created_at) VALUES
  -- Chat Lucas (chat0001)
  ('a0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   'Bonjour à tous, je crée ce chat tripartite pour faciliter le suivi de l''alternance de Lucas. N''hésitez pas à partager vos retours ici.', NOW() - INTERVAL '60 days'),
  ('a0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   'Merci Julien. Lucas s''intègre très bien à l''équipe. Il a déjà participé à deux sprints et contribué à la refonte de l''API authentification.', NOW() - INTERVAL '55 days'),
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Merci Thomas ! J''apprends énormément. Les revues de code sont très formatrices.', NOW() - INTERVAL '55 days' + INTERVAL '2 hours'),
  ('a0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   'Excellent. Lucas, n''oublie pas de remplir ton livret pour la période de novembre à janvier avant le 15 février.', NOW() - INTERVAL '40 days'),
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Bien reçu, je m''en occupe cette semaine !', NOW() - INTERVAL '40 days' + INTERVAL '1 hour'),
  ('a0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   'Lucas a travaillé sur un sujet de fond ce mois-ci : migration de la base de données vers PostgreSQL 16. Très bonne implication. Je lui mets une note de 16/20 pour cette période.', NOW() - INTERVAL '20 days'),
  ('a0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   'Parfait Thomas, merci pour ce retour détaillé. Lucas, tu as bien reçu l''évaluation ?', NOW() - INTERVAL '19 days'),
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Oui ! Très content de ce retour positif. Je vais continuer sur cette lancée.', NOW() - INTERVAL '19 days' + INTERVAL '30 minutes'),
  -- Chat Hugo (chat0002)
  ('a0000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555',
   'Bienvenue dans cet espace tripartite Hugo x Nextech SAS. Je serai votre référent pédagogique pour toute la durée de l''alternance.', NOW() - INTERVAL '45 days'),
  ('a0000002-0000-0000-0000-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'Bonjour Julien, bonjour Hugo. Hugo a bien pris ses marques. Il travaille actuellement sur l''interface Flutter de notre nouvelle application.', NOW() - INTERVAL '40 days'),
  ('a0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888',
   'Bonjour ! Oui je suis bien intégré, l''équipe est super. J''ai quelques difficultés avec la gestion des états complexes en Flutter mais je progresse.', NOW() - INTERVAL '40 days' + INTERVAL '3 hours'),
  ('a0000002-0000-0000-0000-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'Pas de souci, nous avons planifié des sessions de pair-programming avec un senior pour ce point précis.', NOW() - INTERVAL '38 days'),
  ('a0000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555',
   'Hugo, pense à déposer ton livret pour la 1ère période avant le 28 du mois. Tu peux le faire directement depuis l''espace Carrière > Livret d''apprentissage.', NOW() - INTERVAL '10 days');

-- ─── Livret d'apprentissage ──────────────────────────────────
INSERT INTO public.apprenticeship_entries (student_id, chat_id, titre, description, fichier_url, statut, note, valide_par, created_at) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000001-0000-0000-0000-000000000001',
    'Période 1 — Septembre à Novembre 2025',
    'Découverte de l''environnement de travail, prise en main du stack technique (React + Node.js), participation aux daily scrums. Contribution à 3 tickets de correction de bugs en production.',
    'https://exemple.fr/livret/lucas-p1.pdf',
    'valide', 15.0, '44444444-4444-4444-4444-444444444444',
    NOW() - INTERVAL '90 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000001-0000-0000-0000-000000000001',
    'Période 2 — Novembre 2025 à Janvier 2026',
    'Refonte de l''API d''authentification (JWT + refresh tokens), implémentation des tests unitaires avec Jest, rédaction de la documentation technique. Participation à la code review d''un pair.',
    'https://exemple.fr/livret/lucas-p2.pdf',
    'valide', 16.0, '44444444-4444-4444-4444-444444444444',
    NOW() - INTERVAL '50 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000001-0000-0000-0000-000000000001',
    'Période 3 — Janvier à Mars 2026',
    'Migration de la base de données de MySQL vers PostgreSQL 16, optimisation des requêtes critiques (-40% de temps de réponse), mise en place de la réplication. Contribution à l''architecture décisionnelle.',
    'https://exemple.fr/livret/lucas-p3.pdf',
    'en_revision', NULL, NULL,
    NOW() - INTERVAL '10 days'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'a0000002-0000-0000-0000-000000000002',
    'Période 1 — Octobre à Décembre 2025',
    'Prise en main de Flutter/Dart, développement des premiers écrans de l''application mobile. Participation aux sprints Agile, rédaction des user stories. Points difficiles : gestion du state avec Riverpod.',
    'https://exemple.fr/livret/hugo-p1.pdf',
    'soumis', NULL, NULL,
    NOW() - INTERVAL '5 days'
  );

-- ─── Tickets support ─────────────────────────────────────────
INSERT INTO public.tickets (id, sujet, description, categorie, statut, auteur_id, created_at) VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Accès à l''ENT impossible depuis hier',
    'Je n''arrive plus à me connecter à l''ENT depuis hier soir. J''ai essayé sur Firefox et Chrome. Le message d''erreur est : "Votre session a expiré". J''ai vidé le cache et les cookies sans succès.',
    'informatique', 'resolu',
    '11111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '15 days'
  ),
  (
    'a1000002-0000-0000-0000-000000000002',
    'Problème d''affichage des notes sur mobile',
    'Sur Safari iOS, la page "Mes notes" ne s''affiche pas correctement. Le tableau est coupé et certaines colonnes ne sont pas visibles. Ça marche bien sur mon PC.',
    'informatique', 'en_cours',
    '77777777-7777-7777-7777-777777777777',
    NOW() - INTERVAL '3 days'
  ),
  (
    'a1000003-0000-0000-0000-000000000003',
    'Demande d''attestation de scolarité',
    'Bonjour, j''ai besoin d''une attestation de scolarité pour mon dossier de demande de logement CAF. Est-ce possible de l''obtenir rapidement ? Merci.',
    'pedagogie', 'ouvert',
    '88888888-8888-8888-8888-888888888888',
    NOW() - INTERVAL '1 day'
  ),
  (
    'a1000004-0000-0000-0000-000000000004',
    'Note du DS d''algorithmique incorrecte',
    'Bonjour, j''ai une note de 13/20 pour le TP noté d''algorithmique mais en calculant mes points j''avais l''impression d''avoir fait un 15 ou 16. Pourrait-on vérifier ?',
    'pedagogie', 'resolu',
    '11111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '30 days'
  );

-- ─── Réponses aux tickets ────────────────────────────────────
INSERT INTO public.ticket_messages (ticket_id, author_id, contenu, created_at) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'J''ai aussi essayé de réinitialiser mon mot de passe, l''email n''arrive pas non plus.', NOW() - INTERVAL '14 days' + INTERVAL '2 hours'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666',
   'Bonjour Lucas, nous avons identifié le problème. Il s''agissait d''une migration de serveur qui a invalidé toutes les sessions actives. Votre compte a été réactivé. Pouvez-vous retenter la connexion ?', NOW() - INTERVAL '13 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'Parfait, ça fonctionne à nouveau ! Merci pour la réponse rapide.', NOW() - INTERVAL '13 days' + INTERVAL '30 minutes'),
  ('a1000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666',
   'Bonjour Emma, merci pour le signalement. Nous avons transmis le problème à l''équipe de développement qui a confirmé un bug de responsive sur Safari. Un correctif est prévu pour la semaine prochaine.', NOW() - INTERVAL '2 days'),
  ('a1000002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777',
   'Merci pour la réponse ! En attendant j''utilise Chrome sur mobile, ça fonctionne bien.', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
  ('a1000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222',
   'Bonjour Lucas, j''ai bien reçu votre message. J''ai vérifié la copie et la note de 13/20 est correcte : les exercices 3 et 4 comportaient des erreurs sur la complexité algorithmique. Je vous ai mis les corrections en commentaire sur la copie.', NOW() - INTERVAL '28 days'),
  ('a1000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'D''accord, je comprends maintenant. Merci pour l''explication Sophie.', NOW() - INTERVAL '27 days');

-- ─── Articles FAQ ────────────────────────────────────────────
INSERT INTO public.faq_articles (question, reponse, categorie, publie, auteur_id) VALUES
  (
    'Comment réinitialiser mon mot de passe ?',
    'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Un email vous sera envoyé avec un lien de réinitialisation valable 1 heure. Si vous ne recevez pas l''email, vérifiez vos spams ou contactez le secrétariat.',
    'informatique', true, '33333333-3333-3333-3333-333333333333'
  ),
  (
    'Comment accéder à mes notes ?',
    'Dans le dashboard, cliquez sur "Pédagogie" puis "Mes notes". Vous y trouverez toutes vos notes par matière, organisées par semestre, avec votre moyenne pondérée par coefficient.',
    'pedagogie', true, '33333333-3333-3333-3333-333333333333'
  ),
  (
    'Comment obtenir une attestation de scolarité ?',
    'Les attestations de scolarité sont générées automatiquement. Rendez-vous dans votre profil > Documents > Attestation de scolarité, puis cliquez sur "Télécharger". Le document est signé électroniquement et valable auprès des organismes officiels.',
    'pedagogie', true, '66666666-6666-6666-6666-666666666666'
  ),
  (
    'Comment signaler un problème technique sur la plateforme ?',
    'Utilisez le module "Support" dans la barre de navigation. Créez un ticket en sélectionnant la catégorie "Informatique" et décrivez le problème avec précision (navigateur utilisé, captures d''écran si possible). L''équipe technique répond sous 48h ouvrées.',
    'informatique', true, '66666666-6666-6666-6666-666666666666'
  ),
  (
    'Où trouver les supports de cours ?',
    'Tous les supports de cours sont disponibles dans la section "Pédagogie > Mes cours". Ils sont organisés par matière et par type (PDF, vidéo, lien). Si un cours est manquant, contactez directement votre professeur via la messagerie de classe.',
    'pedagogie', true, '55555555-5555-5555-5555-555555555555'
  ),
  (
    'Comment fonctionne le système de présence ?',
    'Au début de chaque cours, le professeur génère un QR code ou un code unique. Vous devez vous présenter physiquement en classe pour le scanner via l''application. Un retard de plus de 15 minutes est comptabilisé comme "en retard" dans vos records.',
    'pedagogie', true, '55555555-5555-5555-5555-555555555555'
  ),
  (
    'Comment contacter mon tuteur d''alternance depuis la plateforme ?',
    'Le chat tripartite est accessible depuis "Carrière > Espace tripartite". Il regroupe vous, votre maître d''apprentissage et votre référent pédagogique. Tous les messages sont archivés pour le suivi de votre alternance.',
    'pedagogie', true, '55555555-5555-5555-5555-555555555555'
  ),
  (
    'Les salles informatiques sont-elles accessibles en dehors des cours ?',
    'Les salles B201 et B202 sont accessibles de 8h à 20h les jours ouvrables avec votre badge étudiant. La salle B203 (station graphique) nécessite une réservation auprès du secrétariat. En cas de problème d''accès, contactez l''accueil au 01.XX.XX.XX.XX.',
    'batiment', true, '66666666-6666-6666-6666-666666666666'
  ),
  (
    'Comment déposer mon livret d''apprentissage ?',
    'Accédez à "Carrière > Livret d''apprentissage". Cliquez sur "Nouvelle entrée" et remplissez le formulaire : titre de la période, description des missions, puis téléchargez votre fichier PDF. Votre maître d''apprentissage sera notifié pour validation.',
    'pedagogie', true, '55555555-5555-5555-5555-555555555555'
  ),
  (
    'Comment rejoindre un groupe pour la semaine projet ?',
    'Dans "Projets", cliquez sur la semaine projet en cours. Vous verrez la liste des groupes ouverts. Cliquez sur "Rejoindre" sur un groupe qui a encore de la place. Une fois rejoint, vous recevrez l''accès au repo GitHub partagé de votre groupe.',
    'pedagogie', true, '55555555-5555-5555-5555-555555555555'
  );

-- ─── Canaux staff ─────────────────────────────────────────────
INSERT INTO public.staff_channels (id, nom, description, cree_par) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Conseil de classe',        'Échanges et comptes-rendus du conseil de classe', '33333333-3333-3333-3333-333333333333'),
  ('b0000002-0000-0000-0000-000000000002', 'Infos Direction',          'Annonces officielles de la direction',            '33333333-3333-3333-3333-333333333333'),
  ('b0000003-0000-0000-0000-000000000003', 'Ressources pédagogiques',  'Partage de ressources et bonnes pratiques',       '55555555-5555-5555-5555-555555555555');

-- ─── Messages staff ──────────────────────────────────────────
INSERT INTO public.staff_messages (channel_id, author_id, contenu, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Réunion pédagogique vendredi 10 avril à 14h — salle B204. Ordre du jour : résultats du 2e semestre, préparation des soutenances, point sur les alternances.', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Noté Marie, je serai présente. J''ai les résultats détaillés du DS de maths à partager.', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes'),
  ('b0000001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999',
   'Je confirme ma présence. Petite note : la moyenne de la promo sur le TP React est de 15,8/20, très bon niveau cette année !', NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
  ('b0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   'Super nouvelle Antoine ! Côté alternances : 3 étudiants en contrat, 2 en recherche active. Je ferai un point détaillé vendredi.', NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
  ('b0000001-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666',
   'Pour le CR du conseil de classe du mois dernier, je l''ai partagé sur Google Drive. Le lien vous a été envoyé par mail.', NOW() - INTERVAL '3 days'),
  ('b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Information importante : le calendrier scolaire est modifié pour la semaine du 28 avril. Les cours du lundi sont déplacés au vendredi. Merci de prévenir vos élèves.', NOW() - INTERVAL '4 days'),
  ('b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Les résultats des dossiers d''inscription pour l''année prochaine sont disponibles. 45 candidats pour 24 places en BTS SIO SLAM. Excellent millésime !', NOW() - INTERVAL '2 days'),
  ('b0000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666',
   'Rappel administratif : tous les contrats d''alternance pour la rentrée de septembre doivent être déposés au secrétariat avant le 15 juin. Merci de le signaler aux étudiants concernés.', NOW() - INTERVAL '1 day'),
  ('b0000003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999',
   'Je partage cette ressource sur les architectures micro-services, très utile pour la préparation des soutenances : https://exemple.fr/ressource/microservices-guide', NOW() - INTERVAL '6 days'),
  ('b0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Merci Antoine ! De mon côté, voici un outil de visualisation pour les algorithmes de tri, idéal pour les révisions avec les étudiants : https://exemple.fr/ressource/algo-viz', NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
  ('b0000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555',
   'Pour les profs qui encadrent des semaines projets : j''ai mis à jour le guide d''évaluation sur le drive partagé. Critères revus selon la grille nationale BTS.', NOW() - INTERVAL '2 days');

-- ─── Actualités (news_posts) ──────────────────────────────────
INSERT INTO public.news_posts (title, content, author_id, category, pinned, created_at) VALUES
  (
    'Ouverture de la plateforme Hub École',
    'Bienvenue sur Hub École, votre nouvelle plateforme numérique ! Vous pouvez dès maintenant accéder à vos cours, vos notes, le job board, et communiquer avec votre équipe pédagogique. Un tutoriel de prise en main est disponible dans la section Support > FAQ. N''hésitez pas à ouvrir un ticket si vous rencontrez des difficultés.',
    '33333333-3333-3333-3333-333333333333', 'annonce', true, NOW() - INTERVAL '30 days'
  ),
  (
    'Forum Entreprises 2026 — Inscriptions ouvertes',
    'Le Forum Entreprises aura lieu dans deux semaines sur le campus. 35 entreprises partenaires seront présentes pour vous rencontrer et vous proposer des opportunités de stage et d''alternance. Inscrivez-vous dès maintenant dans la section Carrière > Événements. Places limitées par créneau. Venez avec votre CV à jour et en tenue professionnelle.',
    '55555555-5555-5555-5555-555555555555', 'evenement', true, NOW() - INTERVAL '7 days'
  ),
  (
    'Résultats du 2e semestre — Félicitations à la promotion',
    'Les résultats du deuxième semestre sont désormais consultables dans votre espace Notes. La moyenne générale de la promotion BTS SIO SLAM 2 est de 13,8/20, en hausse de +1,2 points par rapport au semestre précédent. Bravo à tous ! Les étudiants en difficulté sont invités à prendre contact avec leur professeur référent.',
    '33333333-3333-3333-3333-333333333333', 'annonce', false, NOW() - INTERVAL '5 days'
  ),
  (
    'Nouveau partenariat avec Nextech SAS',
    'Nous sommes heureux d''annoncer un partenariat avec Nextech SAS, entreprise spécialisée dans le développement mobile. Deux postes en alternance sont ouverts pour la rentrée de septembre. Retrouvez les offres sur le Job Board. Nextech SAS sera également présente au Forum Entreprises.',
    '55555555-5555-5555-5555-555555555555', 'actu', false, NOW() - INTERVAL '10 days'
  ),
  (
    'Semaine projet "API REST" — Inscriptions groupes',
    'La semaine projet "API REST" débutera le 5 mai. Vous devez constituer vos groupes de 3 à 4 personnes avant le 28 avril dans l''espace Projets. Le sujet complet vous sera remis le premier jour de la semaine. Langages autorisés : Node.js, Python, Java. Évaluation par soutenance le vendredi.',
    '99999999-9999-9999-9999-999999999999', 'annonce', false, NOW() - INTERVAL '4 days'
  ),
  (
    'Maintenance programmée — Samedi 12 avril de 2h à 6h',
    'Une maintenance de la plateforme est programmée ce samedi matin de 2h à 6h. Pendant cette période, l''accès à Hub École sera indisponible. Des mises à jour de sécurité et de performance seront appliquées. Merci de sauvegarder vos travaux en cours avant minuit vendredi.',
    '33333333-3333-3333-3333-333333333333', 'annonce', false, NOW() - INTERVAL '2 days'
  ),
  (
    'Atelier CV & LinkedIn — Jeudi prochain',
    'Ne ratez pas l''atelier CV & LinkedIn animé par un coach professionnel ! Au programme : comment rédiger un CV qui se démarque, optimiser votre profil LinkedIn pour attirer les recruteurs, rédiger des messages de contact efficaces. Inscription obligatoire dans Carrière > Événements. Nombre de places limité à 20.',
    '55555555-5555-5555-5555-555555555555', 'evenement', false, NOW() - INTERVAL '3 days'
  ),
  (
    'Rapport d''activité 2025 — L''école en chiffres',
    'L''école publie son rapport d''activité annuel 2025. Quelques chiffres clés : 92% de réussite au BTS SIO, 87% des alternants ont décroché un CDI à l''issue de leur contrat, 45 entreprises partenaires. Retrouvez le rapport complet sur le site institutionnel de l''école.',
    '33333333-3333-3333-3333-333333333333', 'actu', false, NOW() - INTERVAL '15 days'
  );

-- ─── Semaines projets ─────────────────────────────────────────
INSERT INTO public.project_weeks (id, title, class_id, start_date, end_date, cree_par) VALUES
  (
    'c0000001-0000-0000-0000-000000000001',
    'Semaine projet — Application mobile',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (NOW() - INTERVAL '30 days')::date,
    (NOW() - INTERVAL '26 days')::date,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'c0000002-0000-0000-0000-000000000002',
    'Semaine projet — API REST',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (NOW() + INTERVAL '27 days')::date,
    (NOW() + INTERVAL '31 days')::date,
    '99999999-9999-9999-9999-999999999999'
  );

-- ─── Groupes projets ─────────────────────────────────────────
INSERT INTO public.project_groups (id, week_id, group_name, repo_url, slides_url, capacite_max, note, feedback_prof, note_par) VALUES
  (
    'd0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Groupe Alpha',
    'https://github.com/bts-sio/app-mobile-alpha',
    'https://docs.exemple.fr/soutenance-alpha',
    4, 16.5,
    'Très bonne architecture Flutter, code propre et bien documenté. Gestion des erreurs à améliorer. Présentation convaincante.',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'd0000002-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    'Groupe Beta',
    'https://github.com/bts-sio/app-mobile-beta',
    NULL,
    4, 14.0,
    'Application fonctionnelle, quelques bugs UX. La soutenance manquait de structure mais le projet technique était solide.',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'd0000003-0000-0000-0000-000000000003',
    'c0000002-0000-0000-0000-000000000002',
    'Groupe Delta',
    NULL, NULL, 4, NULL, NULL, NULL
  );

-- ─── Membres des groupes ─────────────────────────────────────
INSERT INTO public.group_members (group_id, student_id) VALUES
  ('d0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('d0000001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777'),
  ('d0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888');

-- ─── Retro boards ────────────────────────────────────────────
INSERT INTO public.retro_boards (id, week_id, is_open) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', false),
  ('e0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', true);

-- ─── Postits rétro (semaine 1 terminée) ──────────────────────
INSERT INTO public.retro_postits (board_id, type, content, is_anonymous, author_id) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'POSITIVE',  'Super ambiance dans l''équipe, très bonne communication tout au long de la semaine.', false, '11111111-1111-1111-1111-111111111111'),
  ('e0000001-0000-0000-0000-000000000001', 'POSITIVE',  'On a réussi à livrer toutes les fonctionnalités prévues, c''est une première pour nous !', false, '77777777-7777-7777-7777-777777777777'),
  ('e0000001-0000-0000-0000-000000000001', 'POSITIVE',  'Le pair-programming le mardi était vraiment productif.', true,  '88888888-8888-8888-8888-888888888888'),
  ('e0000001-0000-0000-0000-000000000001', 'NEGATIVE',  'On a perdu du temps à configurer l''environnement le premier jour. Préparer ça avant.', false, '11111111-1111-1111-1111-111111111111'),
  ('e0000001-0000-0000-0000-000000000001', 'NEGATIVE',  'Le sujet était un peu vague sur les critères d''évaluation de l''UI.', true,  '77777777-7777-7777-7777-777777777777'),
  ('e0000001-0000-0000-0000-000000000001', 'IDEA',      'Idée : faire un Kanban sur GitHub Projects dès le premier jour pour mieux suivre l''avancement.', false, '11111111-1111-1111-1111-111111111111'),
  ('e0000001-0000-0000-0000-000000000001', 'IDEA',      'Prévoir une démo interne le jeudi pour identifier les bugs avant la soutenance.', false, '77777777-7777-7777-7777-777777777777');

-- ─── Créneaux soutenances (semaine 1) ────────────────────────
INSERT INTO public.soutenance_slots (week_id, heure_debut, heure_fin, group_id) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   ((NOW() - INTERVAL '26 days')::date || ' 09:00:00')::timestamptz,
   ((NOW() - INTERVAL '26 days')::date || ' 09:30:00')::timestamptz,
   'd0000001-0000-0000-0000-000000000001'),
  ('c0000001-0000-0000-0000-000000000001',
   ((NOW() - INTERVAL '26 days')::date || ' 09:30:00')::timestamptz,
   ((NOW() - INTERVAL '26 days')::date || ' 10:00:00')::timestamptz,
   'd0000002-0000-0000-0000-000000000002'),
  ('c0000001-0000-0000-0000-000000000001',
   ((NOW() - INTERVAL '26 days')::date || ' 10:00:00')::timestamptz,
   ((NOW() - INTERVAL '26 days')::date || ' 10:30:00')::timestamptz,
   NULL);

-- ─── Sessions de présence ────────────────────────────────────
INSERT INTO public.attendance_sessions (id, class_id, teacher_id, expiration, statut, created_at) VALUES
  (
    'f0000001-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '7 days' + INTERVAL '15 minutes',
    'ferme',
    NOW() - INTERVAL '7 days'
  ),
  (
    'f0000002-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '99999999-9999-9999-9999-999999999999',
    NOW() - INTERVAL '2 days' + INTERVAL '15 minutes',
    'ferme',
    NOW() - INTERVAL '2 days'
  );

-- ─── Enregistrements de présence ─────────────────────────────
INSERT INTO public.attendance_records (session_id, student_id, statut_presence, heure_pointage, device_fingerprint) VALUES
  ('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'present',   NOW() - INTERVAL '7 days' + INTERVAL '2 minutes',  'fp-lucas-phone-abc123'),
  ('f0000001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'present',   NOW() - INTERVAL '7 days' + INTERVAL '3 minutes',  'fp-emma-laptop-def456'),
  ('f0000001-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'en_retard', NOW() - INTERVAL '7 days' + INTERVAL '12 minutes', 'fp-hugo-phone-ghi789'),
  ('f0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'present',   NOW() - INTERVAL '2 days' + INTERVAL '1 minute',   'fp-lucas-phone-abc123'),
  ('f0000002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'present',   NOW() - INTERVAL '2 days' + INTERVAL '4 minutes',  'fp-emma-laptop-def456'),
  ('f0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'present',   NOW() - INTERVAL '2 days' + INTERVAL '7 minutes',  'fp-hugo-phone-ghi789');

-- ─── Récapitulatif ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'SEED ENRICHI TERMINÉ — Comptes de test :';
  RAISE NOTICE '  etudiant@hub-ecole.dev      / Test1234!  (Lucas Martin, élève alternant)';
  RAISE NOTICE '  etudiant2@hub-ecole.dev     / Test1234!  (Emma Rousseau, élève temps plein)';
  RAISE NOTICE '  etudiant3@hub-ecole.dev     / Test1234!  (Hugo Petit, élève alternant)';
  RAISE NOTICE '  prof@hub-ecole.dev          / Test1234!  (Sophie Bernard, Maths + Algo)';
  RAISE NOTICE '  prof2@hub-ecole.dev         / Test1234!  (Antoine Girard, Dev Web + BDD)';
  RAISE NOTICE '  coordinateur@hub-ecole.dev  / Test1234!  (Julien Moreau, resp. péda.)';
  RAISE NOTICE '  staff@hub-ecole.dev         / Test1234!  (Isabelle Laurent, secrétariat)';
  RAISE NOTICE '  admin@hub-ecole.dev         / Test1234!  (Marie Dupont, direction)';
  RAISE NOTICE '  entreprise@hub-ecole.dev    / Test1234!  (Thomas Leroy, Acme Corp)';
  RAISE NOTICE '  entreprise2@hub-ecole.dev   / Test1234!  (Caroline Favre, Nextech SAS)';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Données créées :';
  RAISE NOTICE '  - 1 classe (BTS SIO SLAM 2) avec 3 élèves et 2 professeurs';
  RAISE NOTICE '  - 12 offres emploi (stages, alternances, CDI, CDD)';
  RAISE NOTICE '  - 5 événements carrière (3 à venir, 2 passés)';
  RAISE NOTICE '  - 2 chats tripartites avec messages (Lucas, Hugo)';
  RAISE NOTICE '  - 4 entrées livret apprentissage';
  RAISE NOTICE '  - 9 supports de cours (PDF, vidéo, liens)';
  RAISE NOTICE '  - 21 notes réparties sur 3 étudiants';
  RAISE NOTICE '  - 19 messages de classe sur 3 canaux';
  RAISE NOTICE '  - 8 actualités dont 2 épinglées';
  RAISE NOTICE '  - 4 tickets support avec réponses';
  RAISE NOTICE '  - 10 articles FAQ';
  RAISE NOTICE '  - 3 canaux staff avec 11 messages';
  RAISE NOTICE '  - 2 semaines projet (1 terminée, 1 à venir)';
  RAISE NOTICE '  - 3 groupes projets avec notes et feedback';
  RAISE NOTICE '  - 7 postits rétro';
  RAISE NOTICE '  - 3 créneaux soutenances';
  RAISE NOTICE '  - 2 sessions de présence avec 6 enregistrements';
  RAISE NOTICE '==========================================================';
END $$;
