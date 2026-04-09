-- ============================================================
-- HUB ÉCOLE — Seed Production-Scale
-- Simule une école de taille réelle : 4 classes × 20 élèves
-- ============================================================
-- 94 comptes (créés via scripts/seed-users.mjs)
-- Mot de passe unique : Test1234!
-- ============================================================

-- ─── Nettoyage (ordre inverse des FK) ───────────────────────
DELETE FROM public.doc_share_links;
DELETE FROM public.doc_permissions;
DELETE FROM public.doc_files;
DELETE FROM public.doc_folders;
DELETE FROM public.scheduled_sessions;
DELETE FROM public.planning_runs;
DELETE FROM public.subject_requirements;
DELETE FROM public.teacher_availabilities;
DELETE FROM public.teacher_week_availabilities;
DELETE FROM public.school_calendar;
DELETE FROM public.school_closures;
DELETE FROM public.rooms;
DELETE FROM public.retro_postits;
DELETE FROM public.retro_boards;
DELETE FROM public.soutenance_slots;
DELETE FROM public.group_members;
DELETE FROM public.group_messages;
DELETE FROM public.group_whiteboard;
DELETE FROM public.week_course_materials;
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
DELETE FROM public.apprenticeship_entries;
DELETE FROM public.tripartite_chats;
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

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2 : Rôles, Profils, Classes
-- ═══════════════════════════════════════════════════════════════

-- ─── Rôles ──────────────────────────────────────────────────
INSERT INTO public.user_roles (id, role) VALUES
  -- Admin / Staff / Coordinateur
  ('33333333-3333-3333-3333-333333333333', 'admin'),
  ('55555555-5555-5555-5555-555555555555', 'coordinateur'),
  ('66666666-6666-6666-6666-666666666666', 'staff'),
  -- Professeurs
  ('22222222-2222-2222-2222-222222222222', 'professeur'),
  ('99999999-9999-9999-9999-999999999999', 'professeur'),
  ('f0010000-0000-0000-0000-000000000001', 'professeur'),
  ('f0010000-0000-0000-0000-000000000002', 'professeur'),
  ('f0010000-0000-0000-0000-000000000003', 'professeur'),
  ('f0010000-0000-0000-0000-000000000004', 'professeur'),
  -- Entreprises
  ('44444444-4444-4444-4444-444444444444', 'entreprise'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'entreprise'),
  ('2e010000-0000-0000-0000-000000000001', 'entreprise'),
  ('2e010000-0000-0000-0000-000000000002', 'entreprise'),
  ('2e010000-0000-0000-0000-000000000003', 'entreprise'),
  -- SLAM2 (20)
  ('11111111-1111-1111-1111-111111111111', 'eleve'),
  ('77777777-7777-7777-7777-777777777777', 'eleve'),
  ('88888888-8888-8888-8888-888888888888', 'eleve'),
  ('1a020000-0000-0000-0000-000000000001', 'eleve'),
  ('1a020000-0000-0000-0000-000000000002', 'eleve'),
  ('1a020000-0000-0000-0000-000000000003', 'eleve'),
  ('1a020000-0000-0000-0000-000000000004', 'eleve'),
  ('1a020000-0000-0000-0000-000000000005', 'eleve'),
  ('1a020000-0000-0000-0000-000000000006', 'eleve'),
  ('1a020000-0000-0000-0000-000000000007', 'eleve'),
  ('1a020000-0000-0000-0000-000000000008', 'eleve'),
  ('1a020000-0000-0000-0000-000000000009', 'eleve'),
  ('1a020000-0000-0000-0000-000000000010', 'eleve'),
  ('1a020000-0000-0000-0000-000000000011', 'eleve'),
  ('1a020000-0000-0000-0000-000000000012', 'eleve'),
  ('1a020000-0000-0000-0000-000000000013', 'eleve'),
  ('1a020000-0000-0000-0000-000000000014', 'eleve'),
  ('1a020000-0000-0000-0000-000000000015', 'eleve'),
  ('1a020000-0000-0000-0000-000000000016', 'eleve'),
  ('1a020000-0000-0000-0000-000000000017', 'eleve'),
  -- SLAM1 (20)
  ('1a010000-0000-0000-0000-000000000001', 'eleve'),
  ('1a010000-0000-0000-0000-000000000002', 'eleve'),
  ('1a010000-0000-0000-0000-000000000003', 'eleve'),
  ('1a010000-0000-0000-0000-000000000004', 'eleve'),
  ('1a010000-0000-0000-0000-000000000005', 'eleve'),
  ('1a010000-0000-0000-0000-000000000006', 'eleve'),
  ('1a010000-0000-0000-0000-000000000007', 'eleve'),
  ('1a010000-0000-0000-0000-000000000008', 'eleve'),
  ('1a010000-0000-0000-0000-000000000009', 'eleve'),
  ('1a010000-0000-0000-0000-000000000010', 'eleve'),
  ('1a010000-0000-0000-0000-000000000011', 'eleve'),
  ('1a010000-0000-0000-0000-000000000012', 'eleve'),
  ('1a010000-0000-0000-0000-000000000013', 'eleve'),
  ('1a010000-0000-0000-0000-000000000014', 'eleve'),
  ('1a010000-0000-0000-0000-000000000015', 'eleve'),
  ('1a010000-0000-0000-0000-000000000016', 'eleve'),
  ('1a010000-0000-0000-0000-000000000017', 'eleve'),
  ('1a010000-0000-0000-0000-000000000018', 'eleve'),
  ('1a010000-0000-0000-0000-000000000019', 'eleve'),
  ('1a010000-0000-0000-0000-000000000020', 'eleve'),
  -- SISR1 (20)
  ('1b010000-0000-0000-0000-000000000001', 'eleve'),
  ('1b010000-0000-0000-0000-000000000002', 'eleve'),
  ('1b010000-0000-0000-0000-000000000003', 'eleve'),
  ('1b010000-0000-0000-0000-000000000004', 'eleve'),
  ('1b010000-0000-0000-0000-000000000005', 'eleve'),
  ('1b010000-0000-0000-0000-000000000006', 'eleve'),
  ('1b010000-0000-0000-0000-000000000007', 'eleve'),
  ('1b010000-0000-0000-0000-000000000008', 'eleve'),
  ('1b010000-0000-0000-0000-000000000009', 'eleve'),
  ('1b010000-0000-0000-0000-000000000010', 'eleve'),
  ('1b010000-0000-0000-0000-000000000011', 'eleve'),
  ('1b010000-0000-0000-0000-000000000012', 'eleve'),
  ('1b010000-0000-0000-0000-000000000013', 'eleve'),
  ('1b010000-0000-0000-0000-000000000014', 'eleve'),
  ('1b010000-0000-0000-0000-000000000015', 'eleve'),
  ('1b010000-0000-0000-0000-000000000016', 'eleve'),
  ('1b010000-0000-0000-0000-000000000017', 'eleve'),
  ('1b010000-0000-0000-0000-000000000018', 'eleve'),
  ('1b010000-0000-0000-0000-000000000019', 'eleve'),
  ('1b010000-0000-0000-0000-000000000020', 'eleve'),
  -- SISR2 (20)
  ('1b020000-0000-0000-0000-000000000001', 'eleve'),
  ('1b020000-0000-0000-0000-000000000002', 'eleve'),
  ('1b020000-0000-0000-0000-000000000003', 'eleve'),
  ('1b020000-0000-0000-0000-000000000004', 'eleve'),
  ('1b020000-0000-0000-0000-000000000005', 'eleve'),
  ('1b020000-0000-0000-0000-000000000006', 'eleve'),
  ('1b020000-0000-0000-0000-000000000007', 'eleve'),
  ('1b020000-0000-0000-0000-000000000008', 'eleve'),
  ('1b020000-0000-0000-0000-000000000009', 'eleve'),
  ('1b020000-0000-0000-0000-000000000010', 'eleve'),
  ('1b020000-0000-0000-0000-000000000011', 'eleve'),
  ('1b020000-0000-0000-0000-000000000012', 'eleve'),
  ('1b020000-0000-0000-0000-000000000013', 'eleve'),
  ('1b020000-0000-0000-0000-000000000014', 'eleve'),
  ('1b020000-0000-0000-0000-000000000015', 'eleve'),
  ('1b020000-0000-0000-0000-000000000016', 'eleve'),
  ('1b020000-0000-0000-0000-000000000017', 'eleve'),
  ('1b020000-0000-0000-0000-000000000018', 'eleve'),
  ('1b020000-0000-0000-0000-000000000019', 'eleve'),
  ('1b020000-0000-0000-0000-000000000020', 'eleve');

-- ─── Profils étudiants ──────────────────────────────────────
-- ~30% alternants (6 par classe), reste temps plein
INSERT INTO public.student_profiles (id, nom, prenom, email, type_parcours, phone_mobile) VALUES
  -- SLAM2 (6 alternants, 14 temps plein)
  ('11111111-1111-1111-1111-111111111111', 'Martin',     'Lucas',     'etudiant@hub-ecole.dev',          'alternant',   '06 12 34 56 78'),
  ('77777777-7777-7777-7777-777777777777', 'Rousseau',   'Emma',      'etudiant2@hub-ecole.dev',         'temps_plein', '06 23 45 67 89'),
  ('88888888-8888-8888-8888-888888888888', 'Petit',      'Hugo',      'etudiant3@hub-ecole.dev',         'alternant',   '07 34 56 78 90'),
  ('1a020000-0000-0000-0000-000000000001', 'Bonnet',     'Chloé',     'chloe.bonnet@hub-ecole.dev',      'temps_plein', '06 11 22 33 01'),
  ('1a020000-0000-0000-0000-000000000002', 'Benali',     'Rayan',     'rayan.benali@hub-ecole.dev',      'alternant',   '06 11 22 33 02'),
  ('1a020000-0000-0000-0000-000000000003', 'Dubois',     'Manon',     'manon.dubois@hub-ecole.dev',      'temps_plein', '06 11 22 33 03'),
  ('1a020000-0000-0000-0000-000000000004', 'Lambert',    'Théo',      'theo.lambert@hub-ecole.dev',      'temps_plein', '06 11 22 33 04'),
  ('1a020000-0000-0000-0000-000000000005', 'Marchand',   'Zoé',       'zoe.marchand@hub-ecole.dev',      'alternant',   '06 11 22 33 05'),
  ('1a020000-0000-0000-0000-000000000006', 'Moreau',     'Alexandre', 'alex.moreau@hub-ecole.dev',       'temps_plein', '06 11 22 33 06'),
  ('1a020000-0000-0000-0000-000000000007', 'Simon',      'Clara',     'clara.simon@hub-ecole.dev',       'temps_plein', '06 11 22 33 07'),
  ('1a020000-0000-0000-0000-000000000008', 'Bouzidi',    'Nassim',    'nassim.bouzidi@hub-ecole.dev',    'alternant',   '06 11 22 33 08'),
  ('1a020000-0000-0000-0000-000000000009', 'Garcia',     'Léa',       'lea.garcia@hub-ecole.dev',        'temps_plein', '06 11 22 33 09'),
  ('1a020000-0000-0000-0000-000000000010', 'Pham',       'Kevin',     'kevin.pham@hub-ecole.dev',        'temps_plein', '06 11 22 33 10'),
  ('1a020000-0000-0000-0000-000000000011', 'Leroy',      'Océane',    'oceane.leroy@hub-ecole.dev',      'temps_plein', '06 11 22 33 11'),
  ('1a020000-0000-0000-0000-000000000012', 'Kaddour',    'Mehdi',     'mehdi.kaddour@hub-ecole.dev',     'alternant',   '06 11 22 33 12'),
  ('1a020000-0000-0000-0000-000000000013', 'Fabre',      'Juliette',  'juliette.fabre@hub-ecole.dev',    'temps_plein', '06 11 22 33 13'),
  ('1a020000-0000-0000-0000-000000000014', 'Bertrand',   'Louis',     'louis.bertrand@hub-ecole.dev',    'temps_plein', '06 11 22 33 14'),
  ('1a020000-0000-0000-0000-000000000015', 'El Idrissi', 'Aya',       'aya.el-idrissi@hub-ecole.dev',    'temps_plein', '06 11 22 33 15'),
  ('1a020000-0000-0000-0000-000000000016', 'Roger',      'Maxence',   'maxence.roger@hub-ecole.dev',     'temps_plein', '06 11 22 33 16'),
  ('1a020000-0000-0000-0000-000000000017', 'Chevalier',  'Laura',     'laura.chevalier@hub-ecole.dev',   'temps_plein', '06 11 22 33 17'),
  -- SLAM1 (6 alternants, 14 temps plein)
  ('1a010000-0000-0000-0000-000000000001', 'Renard',     'Camille',   'camille.renard@hub-ecole.dev',    'temps_plein', '06 22 33 44 01'),
  ('1a010000-0000-0000-0000-000000000002', 'Lefèvre',    'Tom',       'tom.lefevre@hub-ecole.dev',       'alternant',   '06 22 33 44 02'),
  ('1a010000-0000-0000-0000-000000000003', 'Moretti',    'Inès',      'ines.moretti@hub-ecole.dev',      'temps_plein', '06 22 33 44 03'),
  ('1a010000-0000-0000-0000-000000000004', 'Lemaire',    'Baptiste',  'baptiste.lemaire@hub-ecole.dev',  'alternant',   '06 22 33 44 04'),
  ('1a010000-0000-0000-0000-000000000005', 'Martin',     'Lucie',     'lucie.martin@hub-ecole.dev',      'temps_plein', '06 22 33 44 05'),
  ('1a010000-0000-0000-0000-000000000006', 'Gauthier',   'Alexis',    'alexis.gauthier@hub-ecole.dev',   'temps_plein', '06 22 33 44 06'),
  ('1a010000-0000-0000-0000-000000000007', 'Perrin',     'Jade',      'jade.perrin@hub-ecole.dev',       'alternant',   '06 22 33 44 07'),
  ('1a010000-0000-0000-0000-000000000008', 'Simon',      'Mathieu',   'mathieu.simon@hub-ecole.dev',     'temps_plein', '06 22 33 44 08'),
  ('1a010000-0000-0000-0000-000000000009', 'Nguyen',     'Elisa',     'elisa.nguyen@hub-ecole.dev',      'temps_plein', '06 22 33 44 09'),
  ('1a010000-0000-0000-0000-000000000010', 'Beaumont',   'Dylan',     'dylan.beaumont@hub-ecole.dev',    'temps_plein', '06 22 33 44 10'),
  ('1a010000-0000-0000-0000-000000000011', 'Delattre',   'Sarah',     'sarah.delattre@hub-ecole.dev',    'alternant',   '06 22 33 44 11'),
  ('1a010000-0000-0000-0000-000000000012', 'Henry',      'Nolan',     'nolan.henry@hub-ecole.dev',       'temps_plein', '06 22 33 44 12'),
  ('1a010000-0000-0000-0000-000000000013', 'Diallo',     'Amina',     'amina.diallo@hub-ecole.dev',      'temps_plein', '06 22 33 44 13'),
  ('1a010000-0000-0000-0000-000000000014', 'Roux',       'Gabriel',   'gabriel.roux@hub-ecole.dev',      'temps_plein', '06 22 33 44 14'),
  ('1a010000-0000-0000-0000-000000000015', 'Baron',      'Margaux',   'margaux.baron@hub-ecole.dev',     'alternant',   '06 22 33 44 15'),
  ('1a010000-0000-0000-0000-000000000016', 'Le Corre',   'Adam',      'adam.lecorre@hub-ecole.dev',      'temps_plein', '06 22 33 44 16'),
  ('1a010000-0000-0000-0000-000000000017', 'Touré',      'Lina',      'lina.toure@hub-ecole.dev',        'temps_plein', '06 22 33 44 17'),
  ('1a010000-0000-0000-0000-000000000018', 'Picard',     'Robin',     'robin.picard@hub-ecole.dev',      'alternant',   '06 22 33 44 18'),
  ('1a010000-0000-0000-0000-000000000019', 'Müller',     'Célia',     'celia.muller@hub-ecole.dev',      'temps_plein', '06 22 33 44 19'),
  ('1a010000-0000-0000-0000-000000000020', 'Chaker',     'Yassine',   'yassine.chaker@hub-ecole.dev',    'temps_plein', '06 22 33 44 20'),
  -- SISR1 (6 alternants, 14 temps plein)
  ('1b010000-0000-0000-0000-000000000001', 'Canet',       'Julien',    'julien.canet@hub-ecole.dev',      'temps_plein', '06 33 44 55 01'),
  ('1b010000-0000-0000-0000-000000000002', 'Vidal',       'Laura',     'laura.vidal@hub-ecole.dev',       'alternant',   '06 33 44 55 02'),
  ('1b010000-0000-0000-0000-000000000003', 'Tissier',     'Kevin',     'kevin.tissier@hub-ecole.dev',     'temps_plein', '06 33 44 55 03'),
  ('1b010000-0000-0000-0000-000000000004', 'Leclerc',     'Ambre',     'ambre.leclerc@hub-ecole.dev',     'temps_plein', '06 33 44 55 04'),
  ('1b010000-0000-0000-0000-000000000005', 'Morel',       'Quentin',   'quentin.morel@hub-ecole.dev',     'alternant',   '06 33 44 55 05'),
  ('1b010000-0000-0000-0000-000000000006', 'Gros',        'Pauline',   'pauline.gros@hub-ecole.dev',      'temps_plein', '06 33 44 55 06'),
  ('1b010000-0000-0000-0000-000000000007', 'Meyer',       'Dylan',     'dylan.meyer@hub-ecole.dev',       'temps_plein', '06 33 44 55 07'),
  ('1b010000-0000-0000-0000-000000000008', 'Roy',         'Anaïs',     'anais.roy@hub-ecole.dev',         'alternant',   '06 33 44 55 08'),
  ('1b010000-0000-0000-0000-000000000009', 'Pires',       'Samuel',    'samuel.pires@hub-ecole.dev',      'temps_plein', '06 33 44 55 09'),
  ('1b010000-0000-0000-0000-000000000010', 'Morin',       'Eva',       'eva.morin@hub-ecole.dev',         'temps_plein', '06 33 44 55 10'),
  ('1b010000-0000-0000-0000-000000000011', 'Carpentier',  'Rémi',      'remi.carpentier@hub-ecole.dev',   'alternant',   '06 33 44 55 11'),
  ('1b010000-0000-0000-0000-000000000012', 'Bensaïd',     'Leïla',     'leila.bensaid@hub-ecole.dev',     'temps_plein', '06 33 44 55 12'),
  ('1b010000-0000-0000-0000-000000000013', 'Ferreira',    'Hugo',      'hugo.ferreira@hub-ecole.dev',     'temps_plein', '06 33 44 55 13'),
  ('1b010000-0000-0000-0000-000000000014', 'Lambert',     'Nina',      'nina.lambert@hub-ecole.dev',      'alternant',   '06 33 44 55 14'),
  ('1b010000-0000-0000-0000-000000000015', 'Prévost',     'Antonin',   'antonin.prevost@hub-ecole.dev',   'temps_plein', '06 33 44 55 15'),
  ('1b010000-0000-0000-0000-000000000016', 'Durand',      'Maéva',     'maeva.durand@hub-ecole.dev',      'temps_plein', '06 33 44 55 16'),
  ('1b010000-0000-0000-0000-000000000017', 'Becker',      'Florian',   'florian.becker@hub-ecole.dev',    'alternant',   '06 33 44 55 17'),
  ('1b010000-0000-0000-0000-000000000018', 'Aït Ahmed',   'Yasmine',   'yasmine.ait@hub-ecole.dev',       'temps_plein', '06 33 44 55 18'),
  ('1b010000-0000-0000-0000-000000000019', 'Girault',     'Ethan',     'ethan.girault@hub-ecole.dev',     'temps_plein', '06 33 44 55 19'),
  ('1b010000-0000-0000-0000-000000000020', 'Vernet',      'Salomé',    'salome.vernet@hub-ecole.dev',     'temps_plein', '06 33 44 55 20'),
  -- SISR2 (6 alternants, 14 temps plein)
  ('1b020000-0000-0000-0000-000000000001', 'Faure',       'Nicolas',   'nicolas.faure@hub-ecole.dev',     'alternant',   '06 44 55 66 01'),
  ('1b020000-0000-0000-0000-000000000002', 'Bourgeois',   'Margot',    'margot.bourgeois@hub-ecole.dev',  'temps_plein', '06 44 55 66 02'),
  ('1b020000-0000-0000-0000-000000000003', 'Chevallier',  'Antoine',   'antoine.chevallier@hub-ecole.dev','alternant',   '06 44 55 66 03'),
  ('1b020000-0000-0000-0000-000000000004', 'Giraud',      'Sarah',     'sarah.giraud@hub-ecole.dev',      'temps_plein', '06 44 55 66 04'),
  ('1b020000-0000-0000-0000-000000000005', 'Rolland',     'Maxime',    'maxime.rolland@hub-ecole.dev',    'temps_plein', '06 44 55 66 05'),
  ('1b020000-0000-0000-0000-000000000006', 'Blanc',       'Émilie',    'emilie.blanc@hub-ecole.dev',      'alternant',   '06 44 55 66 06'),
  ('1b020000-0000-0000-0000-000000000007', 'Colin',       'Pierre',    'pierre.colin@hub-ecole.dev',      'temps_plein', '06 44 55 66 07'),
  ('1b020000-0000-0000-0000-000000000008', 'Fontaine',    'Léa',       'lea.fontaine@hub-ecole.dev',      'temps_plein', '06 44 55 66 08'),
  ('1b020000-0000-0000-0000-000000000009', 'Delorme',     'Thomas',    'thomas.delorme@hub-ecole.dev',    'alternant',   '06 44 55 66 09'),
  ('1b020000-0000-0000-0000-000000000010', 'Morel',       'Charlotte', 'charlotte.morel@hub-ecole.dev',   'temps_plein', '06 44 55 66 10'),
  ('1b020000-0000-0000-0000-000000000011', 'Barbier',     'Axel',      'axel.barbier@hub-ecole.dev',      'temps_plein', '06 44 55 66 11'),
  ('1b020000-0000-0000-0000-000000000012', 'Caron',       'Marie',     'marie.caron@hub-ecole.dev',       'alternant',   '06 44 55 66 12'),
  ('1b020000-0000-0000-0000-000000000013', 'Legrand',     'Dorian',    'dorian.legrand@hub-ecole.dev',    'temps_plein', '06 44 55 66 13'),
  ('1b020000-0000-0000-0000-000000000014', 'Roussel',     'Justine',   'justine.roussel@hub-ecole.dev',   'temps_plein', '06 44 55 66 14'),
  ('1b020000-0000-0000-0000-000000000015', 'Maillard',    'Vincent',   'vincent.maillard@hub-ecole.dev',  'alternant',   '06 44 55 66 15'),
  ('1b020000-0000-0000-0000-000000000016', 'Tanguy',      'Élise',     'elise.tanguy@hub-ecole.dev',      'temps_plein', '06 44 55 66 16'),
  ('1b020000-0000-0000-0000-000000000017', 'Ribeiro',     'Mathis',    'mat.ribeiro@hub-ecole.dev',       'temps_plein', '06 44 55 66 17'),
  ('1b020000-0000-0000-0000-000000000018', 'Vasseur',     'Chloé',     'chloe.vasseur@hub-ecole.dev',     'temps_plein', '06 44 55 66 18'),
  ('1b020000-0000-0000-0000-000000000019', 'Lopes',       'Benjamin',  'benjamin.lopes@hub-ecole.dev',    'temps_plein', '06 44 55 66 19'),
  ('1b020000-0000-0000-0000-000000000020', 'David',       'Pauline',   'pauline.david@hub-ecole.dev',     'temps_plein', '06 44 55 66 20');

-- ─── Profils enseignants ────────────────────────────────────
INSERT INTO public.teacher_profiles (id, nom, prenom, email, matieres_enseignees, phone_mobile, phone_fixed) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Bernard',  'Sophie',  'prof@hub-ecole.dev',          ARRAY['Mathématiques','Algorithmique'],                              '06 45 67 89 01', '01 23 45 67 89'),
  ('99999999-9999-9999-9999-999999999999', 'Girard',   'Antoine', 'prof2@hub-ecole.dev',         ARRAY['Développement web','Bases de données','Anglais technique'],   '06 56 78 90 12', '01 34 56 78 90'),
  ('55555555-5555-5555-5555-555555555555', 'Moreau',   'Julien',  'coordinateur@hub-ecole.dev',  ARRAY['Gestion de projet','Pédagogie'],                              '06 67 89 01 23', '01 45 67 89 01'),
  ('f0010000-0000-0000-0000-000000000001', 'Fontaine', 'Cyril',   'fontaine@hub-ecole.dev',      ARRAY['Réseaux','Cybersécurité','Administration systèmes'],          '06 78 90 12 34', '01 56 78 90 12'),
  ('f0010000-0000-0000-0000-000000000002', 'Dumas',    'Amélie',  'dumas@hub-ecole.dev',         ARRAY['Anglais','Communication professionnelle'],                    '06 89 01 23 45', '01 67 89 01 23'),
  ('f0010000-0000-0000-0000-000000000003', 'Martinez', 'Carlos',  'martinez@hub-ecole.dev',      ARRAY['Droit informatique','Économie numérique'],                    '06 90 12 34 56', '01 78 90 12 34'),
  ('f0010000-0000-0000-0000-000000000004', 'Noël',     'Hélène',  'noel@hub-ecole.dev',          ARRAY['Support et mise en service','SI et gestion de patrimoine'],   '06 01 23 45 67', '01 89 01 23 45');

-- ─── Profils admin ──────────────────────────────────────────
INSERT INTO public.admin_profiles (id, nom, prenom, email, fonction, phone_mobile, phone_fixed) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Dupont',  'Marie',    'admin@hub-ecole.dev', 'Directrice des études',   '06 78 90 12 34', '01 56 78 90 12'),
  ('66666666-6666-6666-6666-666666666666', 'Laurent', 'Isabelle', 'staff@hub-ecole.dev', 'Secrétariat pédagogique', '06 89 01 23 45', '01 67 89 01 23');

-- ─── Profils entreprise ─────────────────────────────────────
INSERT INTO public.company_profiles (id, nom, prenom, email, entreprise, poste, phone_mobile, phone_fixed) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Leroy',   'Thomas',   'entreprise@hub-ecole.dev',  'Acme Corp',        'Maître d''apprentissage',  '06 90 12 34 56', '01 78 90 12 34'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Favre',   'Caroline', 'entreprise2@hub-ecole.dev', 'Nextech SAS',      'Responsable technique',    '07 01 23 45 67', '01 89 01 23 45'),
  ('2e010000-0000-0000-0000-000000000001', 'Morin',   'Bertrand', 'neosystems@hub-ecole.dev',  'NeoSystems',       'Directeur technique',      '06 11 22 33 44', '01 90 12 34 56'),
  ('2e010000-0000-0000-0000-000000000002', 'Hamid',   'Nadia',    'innovlab@hub-ecole.dev',    'InnovLab Paris',   'CTO',                      '06 22 33 44 55', '01 01 23 45 67'),
  ('2e010000-0000-0000-0000-000000000003', 'Vasseur', 'Éric',     'cloudnine@hub-ecole.dev',   'Cloud Nine',       'Lead DevOps',              '06 33 44 55 66', '01 12 34 56 78');

-- ─── Classes ────────────────────────────────────────────────
INSERT INTO public.classes (id, nom, annee, calendar_mode) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BTS SIO SLAM 2', 2026, 'MANUAL'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'BTS SIO SLAM 1', 2026, 'FULL_TIME'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'BTS SIO SISR 1', 2026, 'FULL_TIME'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'BTS SIO SISR 2', 2026, 'MANUAL');

-- ─── Membres de classe ──────────────────────────────────────
INSERT INTO public.class_members (class_id, student_id, is_current) VALUES
  -- SLAM2
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000001', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000002', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000003', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000004', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000005', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000006', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000007', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000008', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000009', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000010', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000011', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000012', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000013', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000014', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000015', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000016', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a020000-0000-0000-0000-000000000017', true),
  -- SLAM1
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000001', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000002', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000003', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000004', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000005', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000006', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000007', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000008', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000009', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000010', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000011', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000012', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000013', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000014', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000015', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000016', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000017', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000018', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000019', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '1a010000-0000-0000-0000-000000000020', true),
  -- SISR1
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000001', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000002', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000003', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000004', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000005', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000006', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000007', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000008', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000009', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000010', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000011', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000012', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000013', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000014', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000015', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000016', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000017', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000018', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000019', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '1b010000-0000-0000-0000-000000000020', true),
  -- SISR2
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000001', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000002', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000003', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000004', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000005', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000006', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000007', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000008', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000009', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000010', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000011', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000012', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000013', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000014', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000015', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000016', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000017', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000018', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000019', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '1b020000-0000-0000-0000-000000000020', true);

-- ─── Profs → Matières (source de vérité — teacher_classes auto-peuplé par trigger) ───
INSERT INTO public.subject_requirements (class_id, teacher_id, subject_name, total_hours_required, session_duration_h, session_type) VALUES
  -- SLAM2 ─────────────────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Algorithmique',            30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Développement web',        50,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Bases de données',         40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0010000-0000-0000-0000-000000000003', 'Droit informatique',       25,   2,   'CLASSIC'),
  -- SLAM1 ─────────────────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Développement web',        50,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Bases de données',         40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000003', 'Économie numérique',       25,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'f0010000-0000-0000-0000-000000000004', 'Support et mise en service', 35, 3.5, 'CLASSIC'),
  -- SISR1 ─────────────────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            35,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'Réseaux',                  50,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'Cybersécurité',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000004', 'SI et gestion de patrimoine', 35, 2, 'CLASSIC'),
  -- SISR2 ─────────────────────────────────────────────────────
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Réseaux',                  45,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Administration systèmes',  50,   3,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'Cybersécurité',            40,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Mathématiques',            30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000002', 'Anglais',                  30,   2,   'CLASSIC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000003', 'Droit informatique',       25,   2,   'CLASSIC');
-- NB : le trigger trg_teacher_classes_on_req_insert peuple teacher_classes automatiquement

-- Canaux additionnels (le trigger crée Général + Entraide pour chaque classe)
INSERT INTO public.class_channels (id, class_id, nom) VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Projets & annonces'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1', 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'Questions cours'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d2', 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'Labo réseau'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d3', 'aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'Certifications');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 3 : Pédagogie — Cours, Notes, Messages
-- ═══════════════════════════════════════════════════════════════


-- ─── Notes — Génération programmatique ──────────────────────
-- Génère ~480 notes : chaque élève reçoit des notes dans chaque matière de sa classe
DO $$
DECLARE
  v_classes UUID[] := ARRAY[
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd'::uuid
  ];
  v_class UUID;
  v_student UUID;
  v_teacher UUID;
  v_matiere TEXT;
  v_examens TEXT[];
  v_examen TEXT;
  v_note NUMERIC;
  v_coeff NUMERIC;
  v_base NUMERIC;
BEGIN
  FOR i IN 1..array_length(v_classes, 1) LOOP
    v_class := v_classes[i];
    -- Pour chaque matière enseignée dans cette classe
    FOR v_teacher, v_matiere IN
      SELECT teacher_id, matiere FROM public.teacher_classes WHERE class_id = v_class
    LOOP
      -- Définir les examens selon la matière
      v_examens := ARRAY['DS n°1', 'DS n°2', 'TP noté', 'Contrôle continu', 'Projet', 'Oral'];
      -- Pour chaque élève de la classe
      FOR v_student IN
        SELECT student_id FROM public.class_members WHERE class_id = v_class
      LOOP
        -- Base aléatoire pour cet élève dans cette matière (simule un "niveau")
        v_base := 8 + random() * 9; -- entre 8 et 17
        FOREACH v_examen SLICE 0 IN ARRAY v_examens LOOP
          -- Note = base ± variation, bornée [1, 20]
          v_note := LEAST(20, GREATEST(1, ROUND((v_base + (random() - 0.5) * 6)::numeric, 1)));
          v_coeff := CASE
            WHEN v_examen IN ('Projet', 'TP noté') THEN 3
            WHEN v_examen LIKE 'DS%' THEN 2
            ELSE 1
          END;
          INSERT INTO public.grades (student_id, teacher_id, class_id, matiere, examen, note, coefficient)
          VALUES (v_student, v_teacher, v_class, v_matiere, v_examen, v_note, v_coeff);
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Notes générées pour 80 élèves × 6 examens par matière';
END $$;

-- ─── Messages de classe ─────────────────────────────────────
-- On utilise les canaux créés par trigger (Général = 1er, Entraide = 2ème par classe)
-- + nos canaux custom ajoutés ci-dessus
DO $$
DECLARE
  v_slam2_general UUID;
  v_slam2_entraide UUID;
  v_slam1_general UUID;
  v_slam1_entraide UUID;
  v_sisr1_general UUID;
  v_sisr2_general UUID;
BEGIN
  -- Récupérer les canaux auto-créés par trigger
  SELECT id INTO v_slam2_general FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND nom = 'Général';
  SELECT id INTO v_slam2_entraide FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND nom = 'Entraide élèves';
  SELECT id INTO v_slam1_general FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb' AND nom = 'Général';
  SELECT id INTO v_slam1_entraide FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb' AND nom = 'Entraide élèves';
  SELECT id INTO v_sisr1_general FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc' AND nom = 'Général';
  SELECT id INTO v_sisr2_general FROM public.class_channels WHERE class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd' AND nom = 'Général';

  -- SLAM2 Général
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_slam2_general, '22222222-2222-2222-2222-222222222222', 'Bonjour à tous ! Le TP d''algorithmique de lundi est confirmé en salle B204. N''oubliez pas d''apporter votre PC.', NOW() - INTERVAL '10 days'),
    (v_slam2_general, '11111111-1111-1111-1111-111111111111', 'Merci professeur ! On aura les consignes avant ?', NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),
    (v_slam2_general, '22222222-2222-2222-2222-222222222222', 'Oui, je les posterai vendredi soir sur la plateforme.', NOW() - INTERVAL '10 days' + INTERVAL '30 minutes'),
    (v_slam2_general, '77777777-7777-7777-7777-777777777777', 'Parfait merci ! Est-ce qu''on peut travailler en binôme ?', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes'),
    (v_slam2_general, '22222222-2222-2222-2222-222222222222', 'Oui, en binôme ou individuel au choix.', NOW() - INTERVAL '10 days' + INTERVAL '1 hour'),
    (v_slam2_general, '99999999-9999-9999-9999-999999999999', 'Rappel : rendu TP React pour jeudi 23h59. Format : lien GitHub + démo en ligne.', NOW() - INTERVAL '7 days'),
    (v_slam2_general, '88888888-8888-8888-8888-888888888888', 'M. Girard, on peut utiliser TypeScript ou seulement JavaScript ?', NOW() - INTERVAL '7 days' + INTERVAL '20 minutes'),
    (v_slam2_general, '99999999-9999-9999-9999-999999999999', 'TypeScript est même recommandé ! Bonus de +1 si le typage est bien fait.', NOW() - INTERVAL '7 days' + INTERVAL '1 hour'),
    (v_slam2_general, '55555555-5555-5555-5555-555555555555', 'Réunion parents-professeurs le 20 avril à 18h. Présence fortement recommandée.', NOW() - INTERVAL '3 days'),
    (v_slam2_general, '1a020000-0000-0000-0000-000000000001', 'Bonjour, est-ce que le DS de maths est bien vendredi prochain ?', NOW() - INTERVAL '2 days'),
    (v_slam2_general, '22222222-2222-2222-2222-222222222222', 'Oui Chloé, vendredi 9h-11h en salle B201. Chapitres 4 à 6.', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
    (v_slam2_general, '1a020000-0000-0000-0000-000000000002', 'Il y aura des exercices de probabilités ?', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
    (v_slam2_general, '22222222-2222-2222-2222-222222222222', 'Oui, environ la moitié du DS portera sur les probabilités.', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),
    (v_slam2_general, 'f0010000-0000-0000-0000-000000000002', 'English oral presentations next week! Prepare a 5-min talk about your internship/project.', NOW() - INTERVAL '1 day');

  -- SLAM2 Entraide
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_slam2_entraide, '11111111-1111-1111-1111-111111111111', 'Quelqu''un a les corrections du DS de maths ?', NOW() - INTERVAL '8 days'),
    (v_slam2_entraide, '77777777-7777-7777-7777-777777777777', 'J''ai quelques corrections, je les partage ce soir !', NOW() - INTERVAL '8 days' + INTERVAL '15 minutes'),
    (v_slam2_entraide, '1a020000-0000-0000-0000-000000000003', 'Merci Emma ! La moyenne de classe était bonne ?', NOW() - INTERVAL '8 days' + INTERVAL '30 minutes'),
    (v_slam2_entraide, '77777777-7777-7777-7777-777777777777', 'Autour de 11,5 je crois. Pas terrible...', NOW() - INTERVAL '8 days' + INTERVAL '45 minutes'),
    (v_slam2_entraide, '1a020000-0000-0000-0000-000000000004', 'On fait une session de révision samedi ? Bibliothèque à 10h ?', NOW() - INTERVAL '5 days'),
    (v_slam2_entraide, '1a020000-0000-0000-0000-000000000005', 'Je suis partante !', NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    (v_slam2_entraide, '1a020000-0000-0000-0000-000000000006', 'Qui peut m''expliquer le pattern Observer en JS ? Je bloque sur le TP.', NOW() - INTERVAL '4 days'),
    (v_slam2_entraide, '1a020000-0000-0000-0000-000000000010', 'Je peux t''aider Alex, envoie-moi ton code par DM', NOW() - INTERVAL '4 days' + INTERVAL '20 minutes');

  -- SLAM1 Général
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_slam1_general, '99999999-9999-9999-9999-999999999999', 'Bienvenue en BTS SIO SLAM 1ère année ! Premier cours de dev web lundi 8h.', NOW() - INTERVAL '14 days'),
    (v_slam1_general, '1a010000-0000-0000-0000-000000000001', 'Merci M. Girard ! On aura besoin de VS Code installé ?', NOW() - INTERVAL '14 days' + INTERVAL '1 hour'),
    (v_slam1_general, '99999999-9999-9999-9999-999999999999', 'Oui, VS Code + extensions Live Server et Prettier. Tout est dans le PDF posté dans Cours.', NOW() - INTERVAL '14 days' + INTERVAL '2 hours'),
    (v_slam1_general, '1a010000-0000-0000-0000-000000000005', 'Est-ce qu''on commence directement par HTML ou par la théorie ?', NOW() - INTERVAL '13 days'),
    (v_slam1_general, '99999999-9999-9999-9999-999999999999', 'Directement par la pratique ! Théorie en fil rouge.', NOW() - INTERVAL '13 days' + INTERVAL '30 minutes'),
    (v_slam1_general, '22222222-2222-2222-2222-222222222222', 'Rappel maths : contrôle sur les ensembles et la logique le 15 avril.', NOW() - INTERVAL '5 days'),
    (v_slam1_general, '1a010000-0000-0000-0000-000000000003', 'C''est noté ! Coefficient ?', NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    (v_slam1_general, '22222222-2222-2222-2222-222222222222', 'Coefficient 2, durée 1h30.', NOW() - INTERVAL '5 days' + INTERVAL '20 minutes');

  -- SLAM1 Entraide
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_slam1_entraide, '1a010000-0000-0000-0000-000000000002', 'Quelqu''un comprend la différence entre display:flex et display:grid ?', NOW() - INTERVAL '7 days'),
    (v_slam1_entraide, '1a010000-0000-0000-0000-000000000009', 'Flex = 1 dimension, Grid = 2 dimensions. Je te passe un super tuto YouTube', NOW() - INTERVAL '7 days' + INTERVAL '15 minutes'),
    (v_slam1_entraide, '1a010000-0000-0000-0000-000000000007', 'Merci Elisa ! Ce tuto est top, j''ai enfin compris grid-template-areas', NOW() - INTERVAL '6 days');

  -- SISR1 Général
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_sisr1_general, 'f0010000-0000-0000-0000-000000000001', 'Bonjour à tous ! TP réseaux demain en salle Labo Réseau. Venez avec votre câble ethernet.', NOW() - INTERVAL '6 days'),
    (v_sisr1_general, '1b010000-0000-0000-0000-000000000001', 'On travaille avec Packet Tracer ou en conditions réelles ?', NOW() - INTERVAL '6 days' + INTERVAL '30 minutes'),
    (v_sisr1_general, 'f0010000-0000-0000-0000-000000000001', 'Les deux ! Packet Tracer pour la conception, puis câblage réel pour la mise en service.', NOW() - INTERVAL '6 days' + INTERVAL '1 hour'),
    (v_sisr1_general, '1b010000-0000-0000-0000-000000000005', 'Est-ce qu''on aura le sujet de TP en avance ?', NOW() - INTERVAL '5 days'),
    (v_sisr1_general, 'f0010000-0000-0000-0000-000000000001', 'Il est en ligne dans la section Cours. Lisez-le avant de venir, on gagnera du temps.', NOW() - INTERVAL '5 days' + INTERVAL '15 minutes');

  -- SISR2 Général
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    (v_sisr2_general, 'f0010000-0000-0000-0000-000000000001', 'Cette semaine : mise en place d''un serveur web sécurisé (Apache + SSL + fail2ban). Sujet en ligne.', NOW() - INTERVAL '4 days'),
    (v_sisr2_general, '1b020000-0000-0000-0000-000000000001', 'Est-ce qu''on utilise les VM Proxmox du labo ?', NOW() - INTERVAL '4 days' + INTERVAL '20 minutes'),
    (v_sisr2_general, 'f0010000-0000-0000-0000-000000000001', 'Oui, chacun a sa VM Debian 12 pré-configurée. Login : root / esiee2026', NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),
    (v_sisr2_general, '1b020000-0000-0000-0000-000000000003', 'Question : on doit aussi configurer un reverse proxy Nginx ou c''est pour le prochain TP ?', NOW() - INTERVAL '3 days'),
    (v_sisr2_general, 'f0010000-0000-0000-0000-000000000001', 'Prochain TP Antoine. Pour l''instant concentrez-vous sur Apache + Let''s Encrypt.', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes');

  -- Canal custom Projets SLAM2
  INSERT INTO public.class_messages (channel_id, author_id, contenu, created_at) VALUES
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '99999999-9999-9999-9999-999999999999', 'La semaine projet "API REST" commence le 5 mai. Réfléchissez à vos groupes !', NOW() - INTERVAL '4 days'),
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '22222222-2222-2222-2222-222222222222', 'Planning soutenances semaine projet App Mobile disponible dans Projets.', NOW() - INTERVAL '1 day');
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 4 : Carrière & Alternance
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.job_offers (titre, entreprise, description, type_contrat, localisation, lien_candidature, publie_par, actif) VALUES
  ('Développeur Full Stack — Alternance 2 ans', 'Acme Corp', 'Rejoignez notre équipe tech. Stack : React, Node.js, PostgreSQL. Plateforme SaaS B2B, 20k users. Tutorat par un senior dev.', 'alternance', 'Paris 8e', 'https://exemple.fr/jobs/acme-dev', '44444444-4444-4444-4444-444444444444', true),
  ('Stage DevOps — 6 mois', 'TechStart', 'AWS, CI/CD GitHub Actions, Kubernetes. Automatisation des pipelines. Équipe de 8 ingénieurs.', 'stage', 'Lyon', 'https://exemple.fr/jobs/techstart-devops', '33333333-3333-3333-3333-333333333333', true),
  ('Développeur mobile Flutter — Alternance', 'Nextech SAS', 'App mobile B2C iOS/Android Flutter/Dart. Sprints Agile. Rythme 3j/2j.', 'alternance', 'Paris 13e', 'https://nextech.fr/jobs/flutter', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true),
  ('Stage Développeur Web — 3 à 6 mois', 'Agence Pixel', 'HTML/CSS, WordPress, Prestashop. Petite structure, mentoring personnalisé.', 'stage', 'Bordeaux', 'https://exemple.fr/jobs/pixel-web', '33333333-3333-3333-3333-333333333333', true),
  ('Alternance Admin Systèmes & Réseaux', 'BankPro Finance', 'Windows Server, AD, VMware, sécurité réseau. Encadrement ingénieur CCNA.', 'alternance', 'Strasbourg', 'https://exemple.fr/jobs/bankpro', '33333333-3333-3333-3333-333333333333', true),
  ('CDI Développeur Backend Python', 'DataLab Analytics', 'Python/FastAPI, data massives, ML. Télétravail partiel 2j/semaine.', 'cdi', 'Paris 9e', 'https://exemple.fr/jobs/datalab', '55555555-5555-5555-5555-555555555555', true),
  ('Stage Cybersécurité — Pentest & Audit', 'SecureIT', 'Tests d''intrusion, audit sécu applicative. Experts OSCP.', 'stage', 'Rennes', 'https://exemple.fr/jobs/secureit', '55555555-5555-5555-5555-555555555555', true),
  ('Alternance Chef de projet digital', 'MarketCo', 'Coordination projets digitaux, suivi prestataires, réunions clients.', 'alternance', 'Nantes', 'https://exemple.fr/jobs/marketco', '55555555-5555-5555-5555-555555555555', true),
  ('CDD Développeur JavaScript — 12 mois', 'MediaGroup', 'React/TypeScript, outils internes. Possibilité CDI.', 'cdd', 'Toulouse', 'https://exemple.fr/jobs/mediagroup', '33333333-3333-3333-3333-333333333333', true),
  ('Stage Data Analyst — 4 à 6 mois', 'RetailChain', 'Power BI, Python, datasets réels 150 magasins.', 'stage', 'Paris 17e', 'https://exemple.fr/jobs/retailchain', '33333333-3333-3333-3333-333333333333', true),
  ('Alternance Développeur .NET / C#', 'Industrie Systèmes', 'Applications supervision industrielle C#/.NET, SQL Server.', 'alternance', 'Grenoble', NULL, '55555555-5555-5555-5555-555555555555', true),
  ('Alternance Développeur React Native', 'InnovLab Paris', 'App mobile cross-platform React Native. Startup IA santé, 12 personnes.', 'alternance', 'Paris 3e', 'https://innovlab.fr/jobs/rn', '2e010000-0000-0000-0000-000000000002', true),
  ('Stage Infra Cloud — AWS/Azure', 'Cloud Nine', 'Terraform, Ansible, monitoring Datadog. Équipe SRE, on-call rotation.', 'stage', 'Paris La Défense', 'https://cloudnine.fr/jobs/cloud', '2e010000-0000-0000-0000-000000000003', true),
  ('Alternance Admin Réseaux Datacenter', 'NeoSystems', 'Gestion datacenter, BGP, load balancing, virtualisation. Formation certifiante incluse.', 'alternance', 'Massy', 'https://neosystems.fr/jobs/admin', '2e010000-0000-0000-0000-000000000001', true),
  ('Stage UI/UX Designer — 3 mois', 'Startup Studio', 'Figma, tests utilisateurs, specs fonctionnelles. 3 produits en lancement.', 'stage', 'Paris 11e', 'https://exemple.fr/jobs/startup-ux', '33333333-3333-3333-3333-333333333333', false),
  ('Alternance Support IT N2/N3', 'BankPro Finance', 'Support utilisateur avancé, ITIL, ticketing ServiceNow, scripting PowerShell.', 'alternance', 'Strasbourg', 'https://exemple.fr/jobs/bankpro-support', '33333333-3333-3333-3333-333333333333', true),
  ('Stage Développeur Java/Spring Boot', 'FinTech Solutions', 'API bancaires, microservices Spring Boot, tests JUnit. Environnement sécurisé.', 'stage', 'Paris 2e', 'https://exemple.fr/jobs/fintech-java', '55555555-5555-5555-5555-555555555555', true),
  ('CDI Ingénieur Systèmes Linux', 'HostingPro', 'Administration serveurs Linux, automatisation Ansible, monitoring Prometheus/Grafana.', 'cdi', 'Lille', 'https://exemple.fr/jobs/hosting-linux', '55555555-5555-5555-5555-555555555555', true),
  ('Alternance Développeur PHP/Symfony', 'WebAgency Plus', 'Projets clients variés, Symfony 7, Docker, CI/CD GitLab. Accompagnement tech lead.', 'alternance', 'Montpellier', 'https://exemple.fr/jobs/webagency-php', '33333333-3333-3333-3333-333333333333', true),
  ('Stage QA / Testeur logiciel', 'QualSoft', 'Tests manuels et automatisés (Selenium, Cypress), rédaction plans de test, CI.', 'stage', 'Lyon', 'https://exemple.fr/jobs/qualsoft-qa', '55555555-5555-5555-5555-555555555555', true);

-- ─── Événements carrière ─────────────────────────────────────
INSERT INTO public.career_events (id, titre, description, lieu, date_debut, date_fin, publie_par) VALUES
  ('cafe0001-cafe-cafe-cafe-cafe00000001', 'Forum Entreprises 2026', '35 entreprises partenaires. Préparez CV, tenue professionnelle. Entretiens spot sur place.', 'Campus ESIEE — Amphithéâtre A', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '8 hours', '55555555-5555-5555-5555-555555555555'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', 'Atelier CV & LinkedIn', 'Coach insertion professionnelle. CV percutant, profil LinkedIn, messages de contact. 20 places.', 'Salle C105 — Campus', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', '55555555-5555-5555-5555-555555555555'),
  ('cafe0003-cafe-cafe-cafe-cafe00000003', 'Journée portes ouvertes alternance', 'Entreprises partenaires, postes ouverts rentrée septembre. Dépôt CV direct.', 'Hall principal — Campus', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '6 hours', '33333333-3333-3333-3333-333333333333'),
  ('cafe0004-cafe-cafe-cafe-cafe00000004', 'Webinaire : Métiers de la cybersécurité', 'SecureIT et BankPro : métiers sécu, certifications CEH/OSCP, parcours depuis BTS SIO.', 'En ligne — Lien Teams', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours', '55555555-5555-5555-5555-555555555555'),
  ('cafe0005-cafe-cafe-cafe-cafe00000005', 'Speed recruiting — Stages d''été', '10 min/entreprise, 8 entreprises. Résultats sous 48h.', 'Salle polyvalente B — Campus', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '4 hours', '55555555-5555-5555-5555-555555555555'),
  ('cafe0006-cafe-cafe-cafe-cafe00000006', 'Conférence : IA et droit du numérique', 'Me Martinez et un expert IA discutent des enjeux juridiques de l''IA générative.', 'Amphithéâtre B — Campus', NOW() + INTERVAL '28 days', NOW() + INTERVAL '28 days' + INTERVAL '2 hours', 'f0010000-0000-0000-0000-000000000003'),
  ('cafe0007-cafe-cafe-cafe-cafe00000007', 'Hackathon DevOps 24h', 'En équipe de 4, déployez une app complète avec CI/CD en 24h. Prix pour les 3 premières équipes.', 'Salles B201-B205 — Campus', NOW() + INTERVAL '35 days', NOW() + INTERVAL '36 days', '99999999-9999-9999-9999-999999999999'),
  ('cafe0008-cafe-cafe-cafe-cafe00000008', 'Table ronde : Femmes dans la tech', 'Témoignages de 5 professionnelles du numérique. Échanges et networking.', 'Amphithéâtre A — Campus', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '3 hours', '33333333-3333-3333-3333-333333333333');

-- ─── Inscriptions événements ─────────────────────────────────
INSERT INTO public.event_registrations (event_id, student_id) VALUES
  -- Forum (quasi toute la promo SLAM2 + quelques SISR2)
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '11111111-1111-1111-1111-111111111111'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '77777777-7777-7777-7777-777777777777'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '88888888-8888-8888-8888-888888888888'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1a020000-0000-0000-0000-000000000001'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1a020000-0000-0000-0000-000000000002'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1a020000-0000-0000-0000-000000000005'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1a020000-0000-0000-0000-000000000008'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1a020000-0000-0000-0000-000000000012'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1b020000-0000-0000-0000-000000000001'),
  ('cafe0001-cafe-cafe-cafe-cafe00000001', '1b020000-0000-0000-0000-000000000003'),
  -- Atelier CV
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '77777777-7777-7777-7777-777777777777'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '88888888-8888-8888-8888-888888888888'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '1a020000-0000-0000-0000-000000000003'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '1a010000-0000-0000-0000-000000000002'),
  ('cafe0002-cafe-cafe-cafe-cafe00000002', '1a010000-0000-0000-0000-000000000004'),
  -- JPO Alternance
  ('cafe0003-cafe-cafe-cafe-cafe00000003', '1a020000-0000-0000-0000-000000000001'),
  ('cafe0003-cafe-cafe-cafe-cafe00000003', '1a010000-0000-0000-0000-000000000007'),
  ('cafe0003-cafe-cafe-cafe-cafe00000003', '1b010000-0000-0000-0000-000000000002'),
  ('cafe0003-cafe-cafe-cafe-cafe00000003', '1b010000-0000-0000-0000-000000000005'),
  -- Hackathon
  ('cafe0007-cafe-cafe-cafe-cafe00000007', '11111111-1111-1111-1111-111111111111'),
  ('cafe0007-cafe-cafe-cafe-cafe00000007', '77777777-7777-7777-7777-777777777777'),
  ('cafe0007-cafe-cafe-cafe-cafe00000007', '1a020000-0000-0000-0000-000000000010'),
  ('cafe0007-cafe-cafe-cafe-cafe00000007', '1a020000-0000-0000-0000-000000000006');

-- ─── Chats tripartites (1 par alternant lié à une entreprise connue) ──
INSERT INTO public.tripartite_chats (id, student_id, referent_id, maitre_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
  ('a0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('a0000003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', '2e010000-0000-0000-0000-000000000001'),
  ('a0000004-0000-0000-0000-000000000004', '1a020000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', '2e010000-0000-0000-0000-000000000002'),
  ('a0000005-0000-0000-0000-000000000005', '1a020000-0000-0000-0000-000000000008', '55555555-5555-5555-5555-555555555555', '2e010000-0000-0000-0000-000000000003'),
  ('a0000006-0000-0000-0000-000000000006', '1a020000-0000-0000-0000-000000000012', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
  ('a0000007-0000-0000-0000-000000000007', '1b020000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', '2e010000-0000-0000-0000-000000000001'),
  ('a0000008-0000-0000-0000-000000000008', '1b020000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- ─── Messages tripartites ────────────────────────────────────
INSERT INTO public.tripartite_messages (chat_id, author_id, contenu, created_at) VALUES
  -- Chat Lucas × Acme
  ('a0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Bonjour à tous, je crée ce chat tripartite pour le suivi de l''alternance de Lucas.', NOW() - INTERVAL '60 days'),
  ('a0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Merci Julien. Lucas s''intègre très bien. Il a participé à deux sprints et contribué à la refonte de l''API.', NOW() - INTERVAL '55 days'),
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Merci Thomas ! J''apprends énormément. Les revues de code sont très formatrices.', NOW() - INTERVAL '55 days' + INTERVAL '2 hours'),
  ('a0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Lucas, n''oublie pas de remplir ton livret pour la période nov-jan avant le 15 février.', NOW() - INTERVAL '40 days'),
  ('a0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Migration PostgreSQL 16 ce mois-ci. Très bonne implication. Note : 16/20.', NOW() - INTERVAL '20 days'),
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Très content de ce retour positif. Je continue sur cette lancée.', NOW() - INTERVAL '19 days'),
  -- Chat Hugo × Nextech
  ('a0000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Bienvenue Hugo × Nextech SAS. Je suis votre référent pédagogique.', NOW() - INTERVAL '45 days'),
  ('a0000002-0000-0000-0000-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Hugo a pris ses marques. Il travaille sur l''interface Flutter de notre app.', NOW() - INTERVAL '40 days'),
  ('a0000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'Bien intégré ! Quelques difficultés avec les états complexes Flutter mais je progresse.', NOW() - INTERVAL '40 days' + INTERVAL '3 hours'),
  ('a0000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Hugo, dépose ton livret pour la 1ère période avant le 28 du mois.', NOW() - INTERVAL '10 days'),
  -- Chat Rayan × NeoSystems
  ('a0000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'Ouverture du suivi tripartite Rayan × NeoSystems. Bienvenue !', NOW() - INTERVAL '50 days'),
  ('a0000003-0000-0000-0000-000000000003', '2e010000-0000-0000-0000-000000000001', 'Rayan travaille sur la migration de notre infra vers Kubernetes. Très motivé.', NOW() - INTERVAL '35 days'),
  ('a0000003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000002', 'C''est passionnant ! J''ai déjà déployé 3 services en prod.', NOW() - INTERVAL '35 days' + INTERVAL '1 hour'),
  -- Chat Nicolas × NeoSystems (SISR2)
  ('a0000007-0000-0000-0000-000000000007', '55555555-5555-5555-5555-555555555555', 'Suivi tripartite Nicolas Faure × NeoSystems. Bonne alternance à tous !', NOW() - INTERVAL '55 days'),
  ('a0000007-0000-0000-0000-000000000007', '2e010000-0000-0000-0000-000000000001', 'Nicolas gère très bien l''administration de notre parc serveurs. 50 VMs sous sa responsabilité.', NOW() - INTERVAL '30 days'),
  ('a0000007-0000-0000-0000-000000000007', '1b020000-0000-0000-0000-000000000001', 'Merci Bertrand ! La formation Proxmox que j''ai suivie m''aide beaucoup.', NOW() - INTERVAL '30 days' + INTERVAL '2 hours');

-- ─── Livret d'apprentissage ──────────────────────────────────
INSERT INTO public.apprenticeship_entries (student_id, chat_id, titre, description, fichier_url, statut, note, valide_par, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'Période 1 — Sept à Nov 2025', 'Découverte stack React + Node.js, participation daily scrums, 3 tickets de correction.', 'https://exemple.fr/livret/lucas-p1.pdf', 'valide', 15.0, '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '90 days'),
  ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'Période 2 — Nov 2025 à Jan 2026', 'Refonte API auth JWT, tests Jest, documentation technique.', 'https://exemple.fr/livret/lucas-p2.pdf', 'valide', 16.0, '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '50 days'),
  ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'Période 3 — Jan à Mars 2026', 'Migration MySQL → PostgreSQL 16, optimisation requêtes -40%.', 'https://exemple.fr/livret/lucas-p3.pdf', 'en_revision', NULL, NULL, NOW() - INTERVAL '10 days'),
  ('88888888-8888-8888-8888-888888888888', 'a0000002-0000-0000-0000-000000000002', 'Période 1 — Oct à Déc 2025', 'Prise en main Flutter/Dart, premiers écrans app mobile, user stories.', 'https://exemple.fr/livret/hugo-p1.pdf', 'soumis', NULL, NULL, NOW() - INTERVAL '5 days'),
  ('1a020000-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000003', 'Période 1 — Oct à Déc 2025', 'Migration infra Kubernetes, déploiement 3 services, monitoring Prometheus.', 'https://exemple.fr/livret/rayan-p1.pdf', 'valide', 17.0, '2e010000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),
  ('1b020000-0000-0000-0000-000000000001', 'a0000007-0000-0000-0000-000000000007', 'Période 1 — Sept à Nov 2025', 'Administration parc serveurs, gestion 50 VMs Proxmox, scripting Bash.', 'https://exemple.fr/livret/nicolas-p1.pdf', 'valide', 14.0, '2e010000-0000-0000-0000-000000000001', NOW() - INTERVAL '80 days'),
  ('1b020000-0000-0000-0000-000000000001', 'a0000007-0000-0000-0000-000000000007', 'Période 2 — Nov 2025 à Jan 2026', 'Mise en place supervision Nagios, automatisation Ansible, documentation infra.', 'https://exemple.fr/livret/nicolas-p2.pdf', 'en_revision', NULL, NULL, NOW() - INTERVAL '15 days');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 5 : Support & FAQ + Communication interne
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.tickets (id, sujet, description, categorie, statut, auteur_id, created_at) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Accès ENT impossible depuis hier', 'Je n''arrive plus à me connecter depuis hier soir. Message : "Session expirée". Cache vidé sans succès.', 'informatique', 'resolu', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days'),
  ('a1000002-0000-0000-0000-000000000002', 'Affichage notes sur mobile', 'Safari iOS : page "Mes notes" coupée, colonnes invisibles. OK sur PC.', 'informatique', 'en_cours', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '3 days'),
  ('a1000003-0000-0000-0000-000000000003', 'Demande attestation de scolarité', 'Besoin attestation pour dossier CAF. Urgent.', 'pedagogie', 'ouvert', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '1 day'),
  ('a1000004-0000-0000-0000-000000000004', 'Note algo incorrecte', 'J''ai 13/20 au TP noté mais je calcule plutôt 15 ou 16. Vérification possible ?', 'pedagogie', 'resolu', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a1000005-0000-0000-0000-000000000005', 'Wifi campus ne fonctionne pas en B203', 'Depuis ce matin, impossible de se connecter au wifi dans la salle B203. Les autres salles fonctionnent.', 'informatique', 'resolu', '1a020000-0000-0000-0000-000000000004', NOW() - INTERVAL '12 days'),
  ('a1000006-0000-0000-0000-000000000006', 'Demande de changement de groupe projet', 'Suite à un désaccord dans mon groupe, j''aimerais changer pour la semaine projet API REST.', 'pedagogie', 'en_cours', '1a020000-0000-0000-0000-000000000006', NOW() - INTERVAL '2 days'),
  ('a1000007-0000-0000-0000-000000000007', 'Imprimante en panne salle B201', 'L''imprimante laser de la salle B201 affiche "bourrage papier" mais il n''y a pas de papier coincé.', 'batiment', 'ouvert', '1a010000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day'),
  ('a1000008-0000-0000-0000-000000000008', 'Problème d''accès VPN depuis maison', 'Le VPN de l''école ne se connecte plus depuis ma mise à jour Windows 11.', 'informatique', 'en_cours', '1b010000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),
  ('a1000009-0000-0000-0000-000000000009', 'Demande de relevé de notes complet', 'J''ai besoin de mon relevé de notes officiel pour un dossier de candidature.', 'pedagogie', 'resolu', '1b020000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 days'),
  ('a1000010-0000-0000-0000-000000000010', 'Chauffage en panne amphi A', 'Il fait 14°C dans l''amphi A. Le chauffage semble coupé depuis lundi.', 'batiment', 'resolu', '1a020000-0000-0000-0000-000000000009', NOW() - INTERVAL '25 days'),
  ('a1000011-0000-0000-0000-000000000011', 'Accès au labo réseau le week-end', 'Est-il possible d''accéder au labo réseau le samedi pour préparer la certification ?', 'batiment', 'ouvert', '1b010000-0000-0000-0000-000000000005', NOW() - INTERVAL '6 hours'),
  ('a1000012-0000-0000-0000-000000000012', 'Bug upload livret apprentissage', 'Le fichier PDF de mon livret (8 Mo) refuse de s''uploader. Erreur 413.', 'informatique', 'en_cours', '1a020000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days'),
  ('a1000013-0000-0000-0000-000000000013', 'Erreur 404 sur page FAQ', 'La page FAQ renvoie une erreur 404 quand on clique sur certains articles.', 'informatique', 'resolu', '1a010000-0000-0000-0000-000000000008', NOW() - INTERVAL '18 days'),
  ('a1000014-0000-0000-0000-000000000014', 'Demande de justificatif d''absence', 'J''étais malade du 1er au 3 avril. J''ai le certificat médical. Procédure ?', 'pedagogie', 'resolu', '1b020000-0000-0000-0000-000000000006', NOW() - INTERVAL '8 days'),
  ('a1000015-0000-0000-0000-000000000015', 'Proposition amélioration : mode sombre', 'Ce serait bien d''avoir un mode sombre sur la plateforme, surtout pour les cours du soir.', 'informatique', 'ouvert', '1a020000-0000-0000-0000-000000000010', NOW() - INTERVAL '1 day');

INSERT INTO public.ticket_messages (ticket_id, author_id, contenu, created_at) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'J''ai aussi essayé de réinitialiser mon mot de passe, l''email n''arrive pas.', NOW() - INTERVAL '14 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 'Migration serveur a invalidé les sessions. Votre compte est réactivé.', NOW() - INTERVAL '13 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Parfait, ça fonctionne ! Merci.', NOW() - INTERVAL '13 days' + INTERVAL '30 minutes'),
  ('a1000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'Bug responsive Safari confirmé. Correctif prévu semaine prochaine.', NOW() - INTERVAL '2 days'),
  ('a1000002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'Merci ! J''utilise Chrome en attendant.', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
  ('a1000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Vérifié : 13/20 correcte. Erreurs exercices 3 et 4 sur la complexité.', NOW() - INTERVAL '28 days'),
  ('a1000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'D''accord, merci Sophie.', NOW() - INTERVAL '27 days'),
  ('a1000005-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666', 'Borne wifi B203 redémarrée. Problème résolu.', NOW() - INTERVAL '11 days'),
  ('a1000008-0000-0000-0000-000000000008', '66666666-6666-6666-6666-666666666666', 'Nouveau certificat VPN à télécharger. Tutoriel envoyé par mail.', NOW() - INTERVAL '3 days'),
  ('a1000009-0000-0000-0000-000000000009', '66666666-6666-6666-6666-666666666666', 'Relevé disponible au secrétariat. Passez le chercher avec carte étudiant.', NOW() - INTERVAL '18 days'),
  ('a1000010-0000-0000-0000-000000000010', '66666666-6666-6666-6666-666666666666', 'Technicien intervenu, chaudière relancée. Température normale sous 2h.', NOW() - INTERVAL '24 days'),
  ('a1000012-0000-0000-0000-000000000012', '66666666-6666-6666-6666-666666666666', 'Limite upload augmentée à 20 Mo. Retentez l''upload.', NOW() - INTERVAL '1 day'),
  ('a1000013-0000-0000-0000-000000000013', '66666666-6666-6666-6666-666666666666', 'Bug corrigé, les liens FAQ fonctionnent à nouveau.', NOW() - INTERVAL '16 days'),
  ('a1000014-0000-0000-0000-000000000014', '66666666-6666-6666-6666-666666666666', 'Déposez le certificat au secrétariat ou envoyez-le par mail à secretariat@esiee.fr.', NOW() - INTERVAL '7 days'),
  ('a1000014-0000-0000-0000-000000000014', '1b020000-0000-0000-0000-000000000006', 'Envoyé par mail ce matin. Merci !', NOW() - INTERVAL '7 days' + INTERVAL '2 hours');

-- ─── FAQ ─────────────────────────────────────────────────────
INSERT INTO public.faq_articles (question, reponse, categorie, publie, auteur_id) VALUES
  ('Comment réinitialiser mon mot de passe ?', 'Page connexion > "Mot de passe oublié". Lien valable 1h. Vérifiez vos spams.', 'informatique', true, '33333333-3333-3333-3333-333333333333'),
  ('Comment accéder à mes notes ?', 'Dashboard > Pédagogie > Mes notes. Notes par matière avec moyenne pondérée.', 'pedagogie', true, '33333333-3333-3333-3333-333333333333'),
  ('Comment obtenir une attestation de scolarité ?', 'Profil > Documents > Attestation de scolarité > Télécharger. Document signé électroniquement.', 'pedagogie', true, '66666666-6666-6666-6666-666666666666'),
  ('Comment signaler un problème technique ?', 'Module Support > Nouveau ticket > Catégorie "Informatique". Réponse sous 48h ouvrées.', 'informatique', true, '66666666-6666-6666-6666-666666666666'),
  ('Où trouver les supports de cours ?', 'Pédagogie > Mes cours. Organisés par matière et type (PDF, vidéo, lien).', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Comment fonctionne le système de présence ?', 'Le prof génère un QR code en début de cours. Scannez-le. Retard > 15min = "en retard".', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Comment contacter mon tuteur d''alternance ?', 'Carrière > Espace tripartite. Chat archivé entre vous, votre MA et votre référent.', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Les salles info sont-elles accessibles hors cours ?', 'B201 et B202 : 8h-20h avec badge. B203 (graphique) : réservation secrétariat.', 'batiment', true, '66666666-6666-6666-6666-666666666666'),
  ('Comment déposer mon livret d''apprentissage ?', 'Carrière > Livret > Nouvelle entrée. Remplir formulaire + upload PDF. MA notifié.', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Comment rejoindre un groupe projet ?', 'Projets > Semaine en cours > Groupes ouverts > Rejoindre. Accès GitHub partagé automatique.', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Quel est le rythme d''alternance ?', 'SLAM : 3 jours entreprise / 2 jours école. SISR : identique. Calendrier disponible dans Planning.', 'pedagogie', true, '55555555-5555-5555-5555-555555555555'),
  ('Comment se connecter au VPN de l''école ?', 'Téléchargez le client OpenVPN. Certificat et config dans Profil > Connexion VPN. Tutoriel PDF en FAQ.', 'informatique', true, '66666666-6666-6666-6666-666666666666'),
  ('Comment réserver une salle pour un TP libre ?', 'Envoyez un mail à secretariat@esiee.fr avec date, horaire et nombre de personnes. Réponse sous 24h.', 'batiment', true, '66666666-6666-6666-6666-666666666666'),
  ('Quels logiciels sont disponibles au labo ?', 'Packet Tracer, Wireshark, VMware, Visual Studio, VS Code, Office 365, Adobe CC (B203 uniquement).', 'informatique', true, '66666666-6666-6666-6666-666666666666'),
  ('Comment contester une note ?', 'Ouvrez un ticket catégorie "Pédagogie" en précisant matière, examen et justification. Le professeur répond sous 5 jours.', 'pedagogie', true, '55555555-5555-5555-5555-555555555555');

-- ─── Canaux staff ────────────────────────────────────────────
INSERT INTO public.staff_channels (id, nom, description, cree_par) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Conseil de classe', 'Échanges et CR du conseil de classe', '33333333-3333-3333-3333-333333333333'),
  ('b0000002-0000-0000-0000-000000000002', 'Infos Direction', 'Annonces officielles de la direction', '33333333-3333-3333-3333-333333333333'),
  ('b0000003-0000-0000-0000-000000000003', 'Ressources pédagogiques', 'Partage de ressources et bonnes pratiques', '55555555-5555-5555-5555-555555555555'),
  ('b0000004-0000-0000-0000-000000000004', 'Vie scolaire', 'Absences, retards, comportement, suivi élèves', '66666666-6666-6666-6666-666666666666'),
  ('b0000005-0000-0000-0000-000000000005', 'Rentrée 2027', 'Préparation de la prochaine rentrée scolaire', '33333333-3333-3333-3333-333333333333'),
  ('b0000006-0000-0000-0000-000000000006', 'Événements & sorties', 'Organisation d''événements et sorties pédagogiques', '55555555-5555-5555-5555-555555555555');

INSERT INTO public.staff_messages (channel_id, author_id, contenu, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Réunion pédagogique vendredi 10 avril à 14h — salle B204. Ordre du jour : résultats 2e semestre, soutenances, alternances.', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Noté Marie, je serai présente. J''ai les résultats détaillés du DS de maths.', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes'),
  ('b0000001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Confirmé. Moyenne promo TP React : 15,8/20, très bon niveau !', NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
  ('b0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Côté alternances : 12 étudiants en contrat sur les 2 promos, 5 en recherche active.', NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
  ('b0000001-0000-0000-0000-000000000001', 'f0010000-0000-0000-0000-000000000001', 'SISR : les résultats du TP réseaux sont excellents cette année. Moyenne 14,2/20.', NOW() - INTERVAL '5 days' + INTERVAL '3 hours'),
  ('b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Calendrier modifié semaine du 28 avril. Cours lundi → vendredi. Prévenez vos élèves.', NOW() - INTERVAL '4 days'),
  ('b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Inscriptions rentrée : 45 candidats pour 24 places en SLAM, 38 pour 20 en SISR. Excellent !', NOW() - INTERVAL '2 days'),
  ('b0000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'Rappel : contrats alternance sept
  
  . à déposer avant le 15 juin.', NOW() - INTERVAL '1 day'),
  ('b0000003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'Ressource micro-services, utile pour les soutenances : https://exemple.fr/ressource/microservices', NOW() - INTERVAL '6 days'),
  ('b0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Outil de visualisation algorithmes de tri : https://exemple.fr/ressource/algo-viz', NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
  ('b0000003-0000-0000-0000-000000000003', 'f0010000-0000-0000-0000-000000000001', 'Pour les SISR : labo virtuel GNS3 en ligne, accès gratuit pour les BTS : https://exemple.fr/gns3-edu', NOW() - INTERVAL '4 days'),
  ('b0000003-0000-0000-0000-000000000003', 'f0010000-0000-0000-0000-000000000004', 'Guide d''évaluation semaines projets mis à jour selon grille nationale BTS.', NOW() - INTERVAL '2 days'),
  ('b0000004-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'Canal centralisé absences/comportement. Envoyez vos listes d''absents en fin de journée.', NOW() - INTERVAL '9 days'),
  ('b0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Hugo Petit absent lundi matin en algo. Pas de justificatif.', NOW() - INTERVAL '8 days'),
  ('b0000004-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'Noté Sophie, je contacte sa famille. Il est en alternance, je vérifie côté entreprise.', NOW() - INTERVAL '8 days' + INTERVAL '1 hour'),
  ('b0000004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', '3 absences en SISR1 cette semaine : Quentin Morel (lundi), Eva Morin (mardi), Samuel Pires (jeudi). Tous justifiés sauf Quentin.', NOW() - INTERVAL '6 days'),
  ('b0000004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 'Réunion parents-profs le 20 avril. Isabelle, convocations envoyées ?', NOW() - INTERVAL '4 days'),
  ('b0000004-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'Convocations envoyées par mail. Relance SMS prévu jeudi.', NOW() - INTERVAL '3 days'),
  ('b0000005-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Début préparation rentrée 2027. Objectif : finaliser les maquettes pédagogiques avant fin mai.', NOW() - INTERVAL '2 days'),
  ('b0000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'Je propose d''ajouter un module "DevSecOps" en SISR2 l''an prochain. Cyril, ton avis ?', NOW() - INTERVAL '1 day'),
  ('b0000005-0000-0000-0000-000000000005', 'f0010000-0000-0000-0000-000000000001', 'Excellente idée Julien. Je peux préparer le programme. 40h sur le semestre ?', NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
  ('b0000006-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555', 'Hackathon DevOps prévu le 14 mai. Qui peut être jury/encadrant ?', NOW() - INTERVAL '3 days'),
  ('b0000006-0000-0000-0000-000000000006', '99999999-9999-9999-9999-999999999999', 'Je suis dispo pour le jury. Je peux aussi préparer un sujet autour des API REST.', NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
  ('b0000006-0000-0000-0000-000000000006', 'f0010000-0000-0000-0000-000000000001', 'Présent aussi. Je m''occupe de l''infra : 4 serveurs de test mis à dispo pour les équipes.', NOW() - INTERVAL '2 days');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 6 : Projets & Rétro
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.project_weeks (id, class_id, title, start_date, end_date, cree_par) VALUES
  ('c0010001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'App Mobile Flutter', (NOW() - INTERVAL '42 days')::date, (NOW() - INTERVAL '38 days')::date, '99999999-9999-9999-9999-999999999999'),
  ('c0010002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'API REST Node.js', (NOW() + INTERVAL '25 days')::date, (NOW() + INTERVAL '29 days')::date, '99999999-9999-9999-9999-999999999999'),
  ('c0010003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'Site Vitrine WordPress', (NOW() - INTERVAL '28 days')::date, (NOW() - INTERVAL '24 days')::date, '99999999-9999-9999-9999-999999999999'),
  ('c0010004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'Infrastructure réseau PME', (NOW() - INTERVAL '2 days')::date, (NOW() + INTERVAL '2 days')::date, 'f0010000-0000-0000-0000-000000000001');

-- ─── Supports de cours (week_course_materials) ──────────────
-- Les supports sont liés aux semaines projets ; la page "Cours" les répertorie
INSERT INTO public.week_course_materials (week_id, uploaded_by, titre, type, url) VALUES
  -- Semaine "App Mobile Flutter" (SLAM2, terminée)
  ('c0010001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Introduction à Flutter & Dart', 'pdf', 'https://exemple.fr/cours/flutter-intro.pdf'),
  ('c0010001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Architecture MVVM avec Flutter', 'pdf', 'https://exemple.fr/cours/flutter-mvvm.pdf'),
  ('c0010001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Firebase Auth & Firestore — Guide', 'lien', 'https://firebase.google.com/docs/flutter/setup'),
  ('c0010001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Tuto vidéo : premier projet Flutter', 'video', 'https://exemple.fr/videos/flutter-starter.mp4'),
  ('c0010001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Algorithmes de tri pour optimisation mobile', 'pdf', 'https://exemple.fr/cours/algo-tri-mobile.pdf'),
  ('c0010001-0000-0000-0000-000000000001', 'f0010000-0000-0000-0000-000000000002', 'Vocabulaire mobile development (EN)', 'pdf', 'https://exemple.fr/anglais/mobile-dev-vocab.pdf'),
  -- Semaine "API REST Node.js" (SLAM2, à venir)
  ('c0010002-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'Cahier des charges — API REST', 'pdf', 'https://exemple.fr/cours/cdc-api-rest.pdf'),
  ('c0010002-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'Node.js & Express — Setup et routing', 'pdf', 'https://exemple.fr/cours/express-setup.pdf'),
  ('c0010002-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'JWT & Authentification API', 'video', 'https://exemple.fr/videos/jwt-auth.mp4'),
  ('c0010002-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'PostgreSQL — Modélisation relationnelle', 'pdf', 'https://exemple.fr/cours/pg-modelisation.pdf'),
  ('c0010002-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'Tests unitaires avec Jest', 'lien', 'https://jestjs.io/docs/getting-started'),
  ('c0010002-0000-0000-0000-000000000002', 'f0010000-0000-0000-0000-000000000003', 'RGPD et API — Obligations légales', 'pdf', 'https://exemple.fr/cours/rgpd-api.pdf'),
  -- Semaine "Site Vitrine WordPress" (SLAM1, terminée)
  ('c0010003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'HTML/CSS — Les fondamentaux', 'video', 'https://exemple.fr/videos/html-css-bases.mp4'),
  ('c0010003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'WordPress — Installation et configuration', 'pdf', 'https://exemple.fr/cours/wordpress-install.pdf'),
  ('c0010003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'Responsive Design — Media Queries', 'pdf', 'https://exemple.fr/cours/responsive-design.pdf'),
  ('c0010003-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'Guide Figma — Maquettage web', 'lien', 'https://www.figma.com/resources/learn-design'),
  ('c0010003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Mathématiques appliquées au design', 'pdf', 'https://exemple.fr/cours/maths-design.pdf'),
  ('c0010003-0000-0000-0000-000000000003', 'f0010000-0000-0000-0000-000000000004', 'Gestion de projet web — Méthodologie agile', 'pdf', 'https://exemple.fr/cours/agile-web.pdf'),
  -- Semaine "Infrastructure réseau PME" (SISR1, en cours)
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', 'Modèle OSI et TCP/IP — Rappels', 'pdf', 'https://exemple.fr/cours/osi-rappels.pdf'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', 'Architecture réseau PME — Bonnes pratiques', 'pdf', 'https://exemple.fr/cours/archi-pme.pdf'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', 'TP Cisco Packet Tracer — VLAN & routage', 'lien', 'https://exemple.fr/tp/packet-tracer-vlan'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', 'Active Directory — Installation pas à pas', 'video', 'https://exemple.fr/videos/ad-install.mp4'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000001', 'DHCP, DNS — Configuration serveur', 'pdf', 'https://exemple.fr/cours/dhcp-dns.pdf'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000004', 'Gestion de parc informatique — GLPI', 'pdf', 'https://exemple.fr/cours/glpi-parc.pdf'),
  ('c0010004-0000-0000-0000-000000000004', 'f0010000-0000-0000-0000-000000000003', 'Droit du numérique — Responsabilité SI', 'pdf', 'https://exemple.fr/cours/droit-si.pdf');

INSERT INTO public.project_groups (id, week_id, group_name, repo_url, created_by) VALUES
  -- App Mobile Flutter (SLAM2 terminé)
  ('d0010001-0000-0000-0000-000000000001', 'c0010001-0000-0000-0000-000000000001', 'FlutterForce', 'https://github.com/hub-ecole/flutterforce', '11111111-1111-1111-1111-111111111111'),
  ('d0010002-0000-0000-0000-000000000002', 'c0010001-0000-0000-0000-000000000001', 'MobileSquad', 'https://github.com/hub-ecole/mobilesquad', '77777777-7777-7777-7777-777777777777'),
  ('d0010003-0000-0000-0000-000000000003', 'c0010001-0000-0000-0000-000000000001', 'AppDev Elite', 'https://github.com/hub-ecole/appdev-elite', '1a020000-0000-0000-0000-000000000001'),
  ('d0010004-0000-0000-0000-000000000004', 'c0010001-0000-0000-0000-000000000001', 'CodeCrafters', 'https://github.com/hub-ecole/codecrafters', '1a020000-0000-0000-0000-000000000006'),
  ('d0010005-0000-0000-0000-000000000005', 'c0010001-0000-0000-0000-000000000001', 'ByteBuilders', 'https://github.com/hub-ecole/bytebuilders', '1a020000-0000-0000-0000-000000000010'),
  -- Site Vitrine (SLAM1 terminé)
  ('d0010006-0000-0000-0000-000000000006', 'c0010003-0000-0000-0000-000000000003', 'WebDesigners', 'https://github.com/hub-ecole/webdesigners', '1a010000-0000-0000-0000-000000000001'),
  ('d0010007-0000-0000-0000-000000000007', 'c0010003-0000-0000-0000-000000000003', 'PixelPerfect', 'https://github.com/hub-ecole/pixelperfect', '1a010000-0000-0000-0000-000000000005'),
  ('d0010008-0000-0000-0000-000000000008', 'c0010003-0000-0000-0000-000000000003', 'HTMLHeroes', 'https://github.com/hub-ecole/htmlheroes', '1a010000-0000-0000-0000-000000000009'),
  ('d0010009-0000-0000-0000-000000000009', 'c0010003-0000-0000-0000-000000000003', 'CSSCreators', 'https://github.com/hub-ecole/csscreators', '1a010000-0000-0000-0000-000000000013'),
  ('d0010010-0000-0000-0000-000000000010', 'c0010003-0000-0000-0000-000000000003', 'FrontEndForce', 'https://github.com/hub-ecole/frontendforce', '1a010000-0000-0000-0000-000000000017'),
  -- Infra réseau (SISR1 en cours)
  ('d0010011-0000-0000-0000-000000000011', 'c0010004-0000-0000-0000-000000000004', 'NetArchitects', NULL, '1b010000-0000-0000-0000-000000000001'),
  ('d0010012-0000-0000-0000-000000000012', 'c0010004-0000-0000-0000-000000000004', 'CableWizards', NULL, '1b010000-0000-0000-0000-000000000005'),
  ('d0010013-0000-0000-0000-000000000013', 'c0010004-0000-0000-0000-000000000004', 'PacketMasters', NULL, '1b010000-0000-0000-0000-000000000009'),
  ('d0010014-0000-0000-0000-000000000014', 'c0010004-0000-0000-0000-000000000004', 'FirewallTeam', NULL, '1b010000-0000-0000-0000-000000000013'),
  ('d0010015-0000-0000-0000-000000000015', 'c0010004-0000-0000-0000-000000000004', 'SysAdmins', NULL, '1b010000-0000-0000-0000-000000000017');

-- ─── Membres des groupes ─────────────────────────────────────
INSERT INTO public.group_members (group_id, student_id) VALUES
  -- FlutterForce
  ('d0010001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('d0010001-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888'),
  ('d0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000004'),
  ('d0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000005'),
  -- MobileSquad
  ('d0010002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777'),
  ('d0010002-0000-0000-0000-000000000002', '1a020000-0000-0000-0000-000000000002'),
  ('d0010002-0000-0000-0000-000000000002', '1a020000-0000-0000-0000-000000000003'),
  ('d0010002-0000-0000-0000-000000000002', '1a020000-0000-0000-0000-000000000009'),
  -- AppDev Elite
  ('d0010003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000001'),
  ('d0010003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000007'),
  ('d0010003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000008'),
  ('d0010003-0000-0000-0000-000000000003', '1a020000-0000-0000-0000-000000000013'),
  -- CodeCrafters
  ('d0010004-0000-0000-0000-000000000004', '1a020000-0000-0000-0000-000000000006'),
  ('d0010004-0000-0000-0000-000000000004', '1a020000-0000-0000-0000-000000000011'),
  ('d0010004-0000-0000-0000-000000000004', '1a020000-0000-0000-0000-000000000012'),
  ('d0010004-0000-0000-0000-000000000004', '1a020000-0000-0000-0000-000000000015'),
  -- ByteBuilders
  ('d0010005-0000-0000-0000-000000000005', '1a020000-0000-0000-0000-000000000010'),
  ('d0010005-0000-0000-0000-000000000005', '1a020000-0000-0000-0000-000000000014'),
  ('d0010005-0000-0000-0000-000000000005', '1a020000-0000-0000-0000-000000000016'),
  ('d0010005-0000-0000-0000-000000000005', '1a020000-0000-0000-0000-000000000017'),
  -- WebDesigners (SLAM1)
  ('d0010006-0000-0000-0000-000000000006', '1a010000-0000-0000-0000-000000000001'),
  ('d0010006-0000-0000-0000-000000000006', '1a010000-0000-0000-0000-000000000002'),
  ('d0010006-0000-0000-0000-000000000006', '1a010000-0000-0000-0000-000000000003'),
  ('d0010006-0000-0000-0000-000000000006', '1a010000-0000-0000-0000-000000000004'),
  -- PixelPerfect
  ('d0010007-0000-0000-0000-000000000007', '1a010000-0000-0000-0000-000000000005'),
  ('d0010007-0000-0000-0000-000000000007', '1a010000-0000-0000-0000-000000000006'),
  ('d0010007-0000-0000-0000-000000000007', '1a010000-0000-0000-0000-000000000007'),
  ('d0010007-0000-0000-0000-000000000007', '1a010000-0000-0000-0000-000000000008'),
  -- HTMLHeroes
  ('d0010008-0000-0000-0000-000000000008', '1a010000-0000-0000-0000-000000000009'),
  ('d0010008-0000-0000-0000-000000000008', '1a010000-0000-0000-0000-000000000010'),
  ('d0010008-0000-0000-0000-000000000008', '1a010000-0000-0000-0000-000000000011'),
  ('d0010008-0000-0000-0000-000000000008', '1a010000-0000-0000-0000-000000000012'),
  -- CSSCreators
  ('d0010009-0000-0000-0000-000000000009', '1a010000-0000-0000-0000-000000000013'),
  ('d0010009-0000-0000-0000-000000000009', '1a010000-0000-0000-0000-000000000014'),
  ('d0010009-0000-0000-0000-000000000009', '1a010000-0000-0000-0000-000000000015'),
  ('d0010009-0000-0000-0000-000000000009', '1a010000-0000-0000-0000-000000000016'),
  -- FrontEndForce
  ('d0010010-0000-0000-0000-000000000010', '1a010000-0000-0000-0000-000000000017'),
  ('d0010010-0000-0000-0000-000000000010', '1a010000-0000-0000-0000-000000000018'),
  ('d0010010-0000-0000-0000-000000000010', '1a010000-0000-0000-0000-000000000019'),
  ('d0010010-0000-0000-0000-000000000010', '1a010000-0000-0000-0000-000000000020'),
  -- NetArchitects (SISR1)
  ('d0010011-0000-0000-0000-000000000011', '1b010000-0000-0000-0000-000000000001'),
  ('d0010011-0000-0000-0000-000000000011', '1b010000-0000-0000-0000-000000000002'),
  ('d0010011-0000-0000-0000-000000000011', '1b010000-0000-0000-0000-000000000003'),
  ('d0010011-0000-0000-0000-000000000011', '1b010000-0000-0000-0000-000000000004'),
  -- CableWizards
  ('d0010012-0000-0000-0000-000000000012', '1b010000-0000-0000-0000-000000000005'),
  ('d0010012-0000-0000-0000-000000000012', '1b010000-0000-0000-0000-000000000006'),
  ('d0010012-0000-0000-0000-000000000012', '1b010000-0000-0000-0000-000000000007'),
  ('d0010012-0000-0000-0000-000000000012', '1b010000-0000-0000-0000-000000000008'),
  -- PacketMasters
  ('d0010013-0000-0000-0000-000000000013', '1b010000-0000-0000-0000-000000000009'),
  ('d0010013-0000-0000-0000-000000000013', '1b010000-0000-0000-0000-000000000010'),
  ('d0010013-0000-0000-0000-000000000013', '1b010000-0000-0000-0000-000000000011'),
  ('d0010013-0000-0000-0000-000000000013', '1b010000-0000-0000-0000-000000000012'),
  -- FirewallTeam
  ('d0010014-0000-0000-0000-000000000014', '1b010000-0000-0000-0000-000000000013'),
  ('d0010014-0000-0000-0000-000000000014', '1b010000-0000-0000-0000-000000000014'),
  ('d0010014-0000-0000-0000-000000000014', '1b010000-0000-0000-0000-000000000015'),
  ('d0010014-0000-0000-0000-000000000014', '1b010000-0000-0000-0000-000000000016'),
  -- SysAdmins
  ('d0010015-0000-0000-0000-000000000015', '1b010000-0000-0000-0000-000000000017'),
  ('d0010015-0000-0000-0000-000000000015', '1b010000-0000-0000-0000-000000000018'),
  ('d0010015-0000-0000-0000-000000000015', '1b010000-0000-0000-0000-000000000019'),
  ('d0010015-0000-0000-0000-000000000015', '1b010000-0000-0000-0000-000000000020');

-- ─── Rétro boards (semaines terminées) ──────────────────────
INSERT INTO public.retro_boards (id, week_id) VALUES
  ('e0010001-0000-0000-0000-000000000001', 'c0010001-0000-0000-0000-000000000001'),
  ('e0010002-0000-0000-0000-000000000002', 'c0010003-0000-0000-0000-000000000003');

INSERT INTO public.retro_postits (board_id, author_id, content, type) VALUES
  -- Rétro App Mobile (SLAM2)
  ('e0010001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Bonne cohésion d''équipe, pair programming très efficace', 'POSITIVE'),
  ('e0010001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'Flutter est vraiment puissant pour le cross-platform, j''ai adoré', 'POSITIVE'),
  ('e0010001-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'On a manqué de temps pour les tests unitaires', 'NEGATIVE'),
  ('e0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000001', 'Le sujet était trop vaste, difficile de prioriser les features', 'NEGATIVE'),
  ('e0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000006', 'Bonne répartition des tâches grâce au kanban GitHub Projects', 'POSITIVE'),
  ('e0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000010', 'Commencer les tests plus tôt la prochaine fois', 'IDEA'),
  ('e0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000004', 'Firebase Auth = galère de config initiale mais après c''est magique', 'POSITIVE'),
  ('e0010001-0000-0000-0000-000000000001', '1a020000-0000-0000-0000-000000000007', 'Le git flow n''était pas clair au début, on a eu des conflits', 'NEGATIVE'),
  -- Rétro Site Vitrine (SLAM1)
  ('e0010002-0000-0000-0000-000000000002', '1a010000-0000-0000-0000-000000000001', 'Premier vrai projet en équipe, très formateur', 'POSITIVE'),
  ('e0010002-0000-0000-0000-000000000002', '1a010000-0000-0000-0000-000000000005', 'Le responsive est plus difficile qu''on ne pensait', 'NEGATIVE'),
  ('e0010002-0000-0000-0000-000000000002', '1a010000-0000-0000-0000-000000000009', 'WordPress c''est bien mais on a du mal avec les thèmes custom', 'NEGATIVE'),
  ('e0010002-0000-0000-0000-000000000002', '1a010000-0000-0000-0000-000000000013', 'La maquette Figma nous a fait gagner beaucoup de temps', 'POSITIVE'),
  ('e0010002-0000-0000-0000-000000000002', '1a010000-0000-0000-0000-000000000017', 'Définir le design system AVANT de coder', 'IDEA');

-- ─── Soutenances ─────────────────────────────────────────────
INSERT INTO public.soutenance_slots (id, week_id, group_id, heure_debut, heure_fin) VALUES
  (gen_random_uuid(), 'c0010001-0000-0000-0000-000000000001', 'd0010001-0000-0000-0000-000000000001', NOW() - INTERVAL '37 days' + INTERVAL '9 hours', NOW() - INTERVAL '37 days' + INTERVAL '9 hours 20 minutes'),
  (gen_random_uuid(), 'c0010001-0000-0000-0000-000000000001', 'd0010002-0000-0000-0000-000000000002', NOW() - INTERVAL '37 days' + INTERVAL '9 hours 30 minutes', NOW() - INTERVAL '37 days' + INTERVAL '9 hours 50 minutes'),
  (gen_random_uuid(), 'c0010001-0000-0000-0000-000000000001', 'd0010003-0000-0000-0000-000000000003', NOW() - INTERVAL '37 days' + INTERVAL '10 hours', NOW() - INTERVAL '37 days' + INTERVAL '10 hours 20 minutes'),
  (gen_random_uuid(), 'c0010001-0000-0000-0000-000000000001', 'd0010004-0000-0000-0000-000000000004', NOW() - INTERVAL '37 days' + INTERVAL '10 hours 30 minutes', NOW() - INTERVAL '37 days' + INTERVAL '10 hours 50 minutes'),
  (gen_random_uuid(), 'c0010001-0000-0000-0000-000000000001', 'd0010005-0000-0000-0000-000000000005', NOW() - INTERVAL '37 days' + INTERVAL '11 hours', NOW() - INTERVAL '37 days' + INTERVAL '11 hours 20 minutes'),
  (gen_random_uuid(), 'c0010003-0000-0000-0000-000000000003', 'd0010006-0000-0000-0000-000000000006', NOW() - INTERVAL '23 days' + INTERVAL '14 hours', NOW() - INTERVAL '23 days' + INTERVAL '14 hours 20 minutes'),
  (gen_random_uuid(), 'c0010003-0000-0000-0000-000000000003', 'd0010007-0000-0000-0000-000000000007', NOW() - INTERVAL '23 days' + INTERVAL '14 hours 30 minutes', NOW() - INTERVAL '23 days' + INTERVAL '14 hours 50 minutes'),
  (gen_random_uuid(), 'c0010003-0000-0000-0000-000000000003', 'd0010008-0000-0000-0000-000000000008', NOW() - INTERVAL '23 days' + INTERVAL '15 hours', NOW() - INTERVAL '23 days' + INTERVAL '15 hours 20 minutes');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 7 : Émargement & Présence
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.attendance_sessions (id, class_id, teacher_id, code_unique, expiration, statut, created_at) VALUES
  ('e1010001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'e1010001-0000-0000-0000-aaaaaaaaaaaa', NOW() - INTERVAL '7 days' + INTERVAL '10 hours', 'ferme', NOW() - INTERVAL '7 days' + INTERVAL '8 hours'),
  ('e1010002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'e1010002-0000-0000-0000-aaaaaaaaaaaa', NOW() - INTERVAL '7 days' + INTERVAL '12 hours 15 minutes', 'ferme', NOW() - INTERVAL '7 days' + INTERVAL '10 hours 15 minutes'),
  ('e1010003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'e1010003-0000-0000-0000-aaaaaaaaaaaa', NOW() - INTERVAL '6 days' + INTERVAL '10 hours', 'ferme', NOW() - INTERVAL '6 days' + INTERVAL '8 hours'),
  ('e1010004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0010000-0000-0000-0000-000000000002', 'e1010004-0000-0000-0000-aaaaaaaaaaaa', NOW() - INTERVAL '5 days' + INTERVAL '16 hours', 'ferme', NOW() - INTERVAL '5 days' + INTERVAL '14 hours'),
  ('e1010005-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'e1010005-0000-0000-0000-bbbbbbbbbbbb', NOW() - INTERVAL '7 days' + INTERVAL '16 hours', 'ferme', NOW() - INTERVAL '7 days' + INTERVAL '14 hours'),
  ('e1010006-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'e1010006-0000-0000-0000-bbbbbbbbbbbb', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 15 minutes', 'ferme', NOW() - INTERVAL '6 days' + INTERVAL '10 hours 15 minutes'),
  ('e1010007-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'e1010007-0000-0000-0000-cccccccccccc', NOW() - INTERVAL '7 days' + INTERVAL '10 hours', 'ferme', NOW() - INTERVAL '7 days' + INTERVAL '8 hours'),
  ('e1010008-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000001', 'e1010008-0000-0000-0000-cccccccccccc', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 15 minutes', 'ferme', NOW() - INTERVAL '5 days' + INTERVAL '10 hours 15 minutes'),
  ('e1010009-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'e1010009-0000-0000-0000-dddddddddddd', NOW() - INTERVAL '7 days' + INTERVAL '16 hours', 'ferme', NOW() - INTERVAL '7 days' + INTERVAL '14 hours'),
  ('e1010010-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-dddddddddddd', 'f0010000-0000-0000-0000-000000000001', 'e1010010-0000-0000-0000-dddddddddddd', NOW() - INTERVAL '6 days' + INTERVAL '10 hours', 'ferme', NOW() - INTERVAL '6 days' + INTERVAL '8 hours'),
  ('e1010011-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'e1010011-0000-0000-0000-aaaaaaaaaaaa', NOW() - INTERVAL '4 days' + INTERVAL '10 hours', 'ferme', NOW() - INTERVAL '4 days' + INTERVAL '8 hours'),
  ('e1010012-0000-0000-0000-000000000012', 'aaaaaaaa-aaaa-aaaa-aaaa-cccccccccccc', 'f0010000-0000-0000-0000-000000000004', 'e1010012-0000-0000-0000-cccccccccccc', NOW() - INTERVAL '4 days' + INTERVAL '16 hours', 'ferme', NOW() - INTERVAL '4 days' + INTERVAL '14 hours');

-- Génération programmatique des pointages (seuls present et en_retard sont autorisés par la contrainte CHECK)
DO $$
DECLARE
  v_session RECORD;
  v_student UUID;
  v_rand DOUBLE PRECISION;
  v_statut TEXT;
  v_counter INT := 0;
BEGIN
  FOR v_session IN SELECT id, class_id, created_at FROM public.attendance_sessions LOOP
    FOR v_student IN SELECT student_id FROM public.class_members WHERE class_id = v_session.class_id LOOP
      v_rand := random();
      -- ~85% present, ~15% en_retard (la contrainte n'autorise pas 'absent')
      v_statut := CASE WHEN v_rand < 0.85 THEN 'present' ELSE 'en_retard' END;
      v_counter := v_counter + 1;
      INSERT INTO public.attendance_records (session_id, student_id, statut_presence, heure_pointage, device_fingerprint)
      VALUES (v_session.id, v_student, v_statut, v_session.created_at + INTERVAL '5 minutes' * v_rand, 'seed-device-' || v_counter);
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Pointages générés : % enregistrements', v_counter;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 8 : Planning & News
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.rooms (id, nom, capacite) VALUES
  ('f1010001-0000-0000-0000-000000000001', 'B201 — Salle dev', 30),
  ('f1010002-0000-0000-0000-000000000002', 'B202 — Salle dev', 30),
  ('f1010003-0000-0000-0000-000000000003', 'B203 — Salle graphique', 20),
  ('f1010004-0000-0000-0000-000000000004', 'B204 — Salle polyvalente', 35),
  ('f1010005-0000-0000-0000-000000000005', 'B205 — Salle TP', 25),
  ('f1010006-0000-0000-0000-000000000006', 'Amphithéâtre A', 120),
  ('f1010007-0000-0000-0000-000000000007', 'Labo Réseau', 20),
  ('f1010008-0000-0000-0000-000000000008', 'Amphithéâtre B', 80);

INSERT INTO public.school_closures (id, label, date_start, date_end) VALUES
  (gen_random_uuid(), 'Vacances de la Toussaint', '2025-10-18', '2025-11-03'),
  (gen_random_uuid(), 'Vacances de Noël', '2025-12-20', '2026-01-05'),
  (gen_random_uuid(), 'Vacances d''hiver', '2026-02-14', '2026-03-02'),
  (gen_random_uuid(), 'Vacances de printemps', '2026-04-11', '2026-04-27'),
  (gen_random_uuid(), 'Jours fériés mai', '2026-05-01', '2026-05-01');

-- ─── Disponibilités des profs (semaines dans l'année) ────────
-- Semaines école 2025-2026 hors vacances (Toussaint, Noël, Hiver, Printemps)
-- Chaque prof a quelques indisponibilités personnelles (formation, conférence…)

-- Sophie Bernard (Maths/Algo) — disponible toutes les semaines école
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('22222222-2222-2222-2222-222222222222', '2025-09-01'),
  ('22222222-2222-2222-2222-222222222222', '2025-09-08'),
  ('22222222-2222-2222-2222-222222222222', '2025-09-15'),
  ('22222222-2222-2222-2222-222222222222', '2025-09-22'),
  ('22222222-2222-2222-2222-222222222222', '2025-09-29'),
  ('22222222-2222-2222-2222-222222222222', '2025-10-06'),
  ('22222222-2222-2222-2222-222222222222', '2025-10-13'),
  ('22222222-2222-2222-2222-222222222222', '2025-11-10'),
  ('22222222-2222-2222-2222-222222222222', '2025-11-17'),
  ('22222222-2222-2222-2222-222222222222', '2025-11-24'),
  ('22222222-2222-2222-2222-222222222222', '2025-12-01'),
  ('22222222-2222-2222-2222-222222222222', '2025-12-08'),
  ('22222222-2222-2222-2222-222222222222', '2025-12-15'),
  ('22222222-2222-2222-2222-222222222222', '2026-01-12'),
  ('22222222-2222-2222-2222-222222222222', '2026-01-19'),
  ('22222222-2222-2222-2222-222222222222', '2026-01-26'),
  ('22222222-2222-2222-2222-222222222222', '2026-02-02'),
  ('22222222-2222-2222-2222-222222222222', '2026-02-09'),
  ('22222222-2222-2222-2222-222222222222', '2026-03-09'),
  ('22222222-2222-2222-2222-222222222222', '2026-03-16'),
  ('22222222-2222-2222-2222-222222222222', '2026-03-23'),
  ('22222222-2222-2222-2222-222222222222', '2026-03-30'),
  ('22222222-2222-2222-2222-222222222222', '2026-04-06'),
  ('22222222-2222-2222-2222-222222222222', '2026-05-04'),
  ('22222222-2222-2222-2222-222222222222', '2026-05-11'),
  ('22222222-2222-2222-2222-222222222222', '2026-05-18'),
  ('22222222-2222-2222-2222-222222222222', '2026-05-25'),
  ('22222222-2222-2222-2222-222222222222', '2026-06-01'),
  ('22222222-2222-2222-2222-222222222222', '2026-06-08'),
  ('22222222-2222-2222-2222-222222222222', '2026-06-15'),
  ('22222222-2222-2222-2222-222222222222', '2026-06-22');

-- Antoine Girard (Dev web/BDD) — indisponible sem. 13/10, 19/01, 18/05 (autre campus)
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('99999999-9999-9999-9999-999999999999', '2025-09-01'),
  ('99999999-9999-9999-9999-999999999999', '2025-09-08'),
  ('99999999-9999-9999-9999-999999999999', '2025-09-15'),
  ('99999999-9999-9999-9999-999999999999', '2025-09-22'),
  ('99999999-9999-9999-9999-999999999999', '2025-09-29'),
  ('99999999-9999-9999-9999-999999999999', '2025-10-06'),
  -- 2025-10-13 : absent (enseignement campus partenaire)
  ('99999999-9999-9999-9999-999999999999', '2025-11-10'),
  ('99999999-9999-9999-9999-999999999999', '2025-11-17'),
  ('99999999-9999-9999-9999-999999999999', '2025-11-24'),
  ('99999999-9999-9999-9999-999999999999', '2025-12-01'),
  ('99999999-9999-9999-9999-999999999999', '2025-12-08'),
  ('99999999-9999-9999-9999-999999999999', '2025-12-15'),
  ('99999999-9999-9999-9999-999999999999', '2026-01-12'),
  -- 2026-01-19 : absent (jury certification OPQUAST)
  ('99999999-9999-9999-9999-999999999999', '2026-01-26'),
  ('99999999-9999-9999-9999-999999999999', '2026-02-02'),
  ('99999999-9999-9999-9999-999999999999', '2026-02-09'),
  ('99999999-9999-9999-9999-999999999999', '2026-03-09'),
  ('99999999-9999-9999-9999-999999999999', '2026-03-16'),
  ('99999999-9999-9999-9999-999999999999', '2026-03-23'),
  ('99999999-9999-9999-9999-999999999999', '2026-03-30'),
  ('99999999-9999-9999-9999-999999999999', '2026-04-06'),
  ('99999999-9999-9999-9999-999999999999', '2026-05-04'),
  ('99999999-9999-9999-9999-999999999999', '2026-05-11'),
  -- 2026-05-18 : absent (hackathon national comme encadrant)
  ('99999999-9999-9999-9999-999999999999', '2026-05-25'),
  ('99999999-9999-9999-9999-999999999999', '2026-06-01'),
  ('99999999-9999-9999-9999-999999999999', '2026-06-08'),
  ('99999999-9999-9999-9999-999999999999', '2026-06-15'),
  ('99999999-9999-9999-9999-999999999999', '2026-06-22');

-- Cyril Fontaine (Réseaux/Sécu) — indisponible sem. 08/12, 09/03 (formation ANSSI)
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('f0010000-0000-0000-0000-000000000001', '2025-09-01'),
  ('f0010000-0000-0000-0000-000000000001', '2025-09-08'),
  ('f0010000-0000-0000-0000-000000000001', '2025-09-15'),
  ('f0010000-0000-0000-0000-000000000001', '2025-09-22'),
  ('f0010000-0000-0000-0000-000000000001', '2025-09-29'),
  ('f0010000-0000-0000-0000-000000000001', '2025-10-06'),
  ('f0010000-0000-0000-0000-000000000001', '2025-10-13'),
  ('f0010000-0000-0000-0000-000000000001', '2025-11-10'),
  ('f0010000-0000-0000-0000-000000000001', '2025-11-17'),
  ('f0010000-0000-0000-0000-000000000001', '2025-11-24'),
  ('f0010000-0000-0000-0000-000000000001', '2025-12-01'),
  -- 2025-12-08 : absent (formation ANSSI — certification SecNumCloud)
  ('f0010000-0000-0000-0000-000000000001', '2025-12-15'),
  ('f0010000-0000-0000-0000-000000000001', '2026-01-12'),
  ('f0010000-0000-0000-0000-000000000001', '2026-01-19'),
  ('f0010000-0000-0000-0000-000000000001', '2026-01-26'),
  ('f0010000-0000-0000-0000-000000000001', '2026-02-02'),
  ('f0010000-0000-0000-0000-000000000001', '2026-02-09'),
  -- 2026-03-09 : absent (formation ANSSI suite)
  ('f0010000-0000-0000-0000-000000000001', '2026-03-16'),
  ('f0010000-0000-0000-0000-000000000001', '2026-03-23'),
  ('f0010000-0000-0000-0000-000000000001', '2026-03-30'),
  ('f0010000-0000-0000-0000-000000000001', '2026-04-06'),
  ('f0010000-0000-0000-0000-000000000001', '2026-05-04'),
  ('f0010000-0000-0000-0000-000000000001', '2026-05-11'),
  ('f0010000-0000-0000-0000-000000000001', '2026-05-18'),
  ('f0010000-0000-0000-0000-000000000001', '2026-05-25'),
  ('f0010000-0000-0000-0000-000000000001', '2026-06-01'),
  ('f0010000-0000-0000-0000-000000000001', '2026-06-08'),
  ('f0010000-0000-0000-0000-000000000001', '2026-06-15'),
  ('f0010000-0000-0000-0000-000000000001', '2026-06-22');

-- Amélie Dumas (Anglais/Com) — indisponible sem. 17/11 (conférence TESOL international)
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('f0010000-0000-0000-0000-000000000002', '2025-09-01'),
  ('f0010000-0000-0000-0000-000000000002', '2025-09-08'),
  ('f0010000-0000-0000-0000-000000000002', '2025-09-15'),
  ('f0010000-0000-0000-0000-000000000002', '2025-09-22'),
  ('f0010000-0000-0000-0000-000000000002', '2025-09-29'),
  ('f0010000-0000-0000-0000-000000000002', '2025-10-06'),
  ('f0010000-0000-0000-0000-000000000002', '2025-10-13'),
  ('f0010000-0000-0000-0000-000000000002', '2025-11-10'),
  -- 2025-11-17 : absente (conférence TESOL — langue anglaise en filières tech)
  ('f0010000-0000-0000-0000-000000000002', '2025-11-24'),
  ('f0010000-0000-0000-0000-000000000002', '2025-12-01'),
  ('f0010000-0000-0000-0000-000000000002', '2025-12-08'),
  ('f0010000-0000-0000-0000-000000000002', '2025-12-15'),
  ('f0010000-0000-0000-0000-000000000002', '2026-01-12'),
  ('f0010000-0000-0000-0000-000000000002', '2026-01-19'),
  ('f0010000-0000-0000-0000-000000000002', '2026-01-26'),
  ('f0010000-0000-0000-0000-000000000002', '2026-02-02'),
  ('f0010000-0000-0000-0000-000000000002', '2026-02-09'),
  ('f0010000-0000-0000-0000-000000000002', '2026-03-09'),
  ('f0010000-0000-0000-0000-000000000002', '2026-03-16'),
  ('f0010000-0000-0000-0000-000000000002', '2026-03-23'),
  ('f0010000-0000-0000-0000-000000000002', '2026-03-30'),
  ('f0010000-0000-0000-0000-000000000002', '2026-04-06'),
  ('f0010000-0000-0000-0000-000000000002', '2026-05-04'),
  ('f0010000-0000-0000-0000-000000000002', '2026-05-11'),
  ('f0010000-0000-0000-0000-000000000002', '2026-05-18'),
  ('f0010000-0000-0000-0000-000000000002', '2026-05-25'),
  ('f0010000-0000-0000-0000-000000000002', '2026-06-01'),
  ('f0010000-0000-0000-0000-000000000002', '2026-06-08'),
  ('f0010000-0000-0000-0000-000000000002', '2026-06-15'),
  ('f0010000-0000-0000-0000-000000000002', '2026-06-22');

-- Carlos Martinez (Droit/Éco) — indisponible sem. 29/09, 25/05 (obligations au tribunal)
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('f0010000-0000-0000-0000-000000000003', '2025-09-01'),
  ('f0010000-0000-0000-0000-000000000003', '2025-09-08'),
  ('f0010000-0000-0000-0000-000000000003', '2025-09-15'),
  ('f0010000-0000-0000-0000-000000000003', '2025-09-22'),
  -- 2025-09-29 : absent (audience tribunal commerce)
  ('f0010000-0000-0000-0000-000000000003', '2025-10-06'),
  ('f0010000-0000-0000-0000-000000000003', '2025-10-13'),
  ('f0010000-0000-0000-0000-000000000003', '2025-11-10'),
  ('f0010000-0000-0000-0000-000000000003', '2025-11-17'),
  ('f0010000-0000-0000-0000-000000000003', '2025-11-24'),
  ('f0010000-0000-0000-0000-000000000003', '2025-12-01'),
  ('f0010000-0000-0000-0000-000000000003', '2025-12-08'),
  ('f0010000-0000-0000-0000-000000000003', '2025-12-15'),
  ('f0010000-0000-0000-0000-000000000003', '2026-01-12'),
  ('f0010000-0000-0000-0000-000000000003', '2026-01-19'),
  ('f0010000-0000-0000-0000-000000000003', '2026-01-26'),
  ('f0010000-0000-0000-0000-000000000003', '2026-02-02'),
  ('f0010000-0000-0000-0000-000000000003', '2026-02-09'),
  ('f0010000-0000-0000-0000-000000000003', '2026-03-09'),
  ('f0010000-0000-0000-0000-000000000003', '2026-03-16'),
  ('f0010000-0000-0000-0000-000000000003', '2026-03-23'),
  ('f0010000-0000-0000-0000-000000000003', '2026-03-30'),
  ('f0010000-0000-0000-0000-000000000003', '2026-04-06'),
  ('f0010000-0000-0000-0000-000000000003', '2026-05-04'),
  ('f0010000-0000-0000-0000-000000000003', '2026-05-11'),
  ('f0010000-0000-0000-0000-000000000003', '2026-05-18'),
  -- 2026-05-25 : absent (expertise judiciaire — droit du numérique)
  ('f0010000-0000-0000-0000-000000000003', '2026-06-01'),
  ('f0010000-0000-0000-0000-000000000003', '2026-06-08'),
  ('f0010000-0000-0000-0000-000000000003', '2026-06-15'),
  ('f0010000-0000-0000-0000-000000000003', '2026-06-22');

-- Hélène Noël (Gestion projet/SI) — indisponible sem. 06/10, 09/02, 15/06 (consulting externe)
INSERT INTO public.teacher_week_availabilities (teacher_id, week_start) VALUES
  ('f0010000-0000-0000-0000-000000000004', '2025-09-01'),
  ('f0010000-0000-0000-0000-000000000004', '2025-09-08'),
  ('f0010000-0000-0000-0000-000000000004', '2025-09-15'),
  ('f0010000-0000-0000-0000-000000000004', '2025-09-22'),
  ('f0010000-0000-0000-0000-000000000004', '2025-09-29'),
  -- 2025-10-06 : absente (mission consulting SI — client grand compte)
  ('f0010000-0000-0000-0000-000000000004', '2025-10-13'),
  ('f0010000-0000-0000-0000-000000000004', '2025-11-10'),
  ('f0010000-0000-0000-0000-000000000004', '2025-11-17'),
  ('f0010000-0000-0000-0000-000000000004', '2025-11-24'),
  ('f0010000-0000-0000-0000-000000000004', '2025-12-01'),
  ('f0010000-0000-0000-0000-000000000004', '2025-12-08'),
  ('f0010000-0000-0000-0000-000000000004', '2025-12-15'),
  ('f0010000-0000-0000-0000-000000000004', '2026-01-12'),
  ('f0010000-0000-0000-0000-000000000004', '2026-01-19'),
  ('f0010000-0000-0000-0000-000000000004', '2026-01-26'),
  ('f0010000-0000-0000-0000-000000000004', '2026-02-02'),
  -- 2026-02-09 : absente (audit PME — mission SI)
  ('f0010000-0000-0000-0000-000000000004', '2026-03-09'),
  ('f0010000-0000-0000-0000-000000000004', '2026-03-16'),
  ('f0010000-0000-0000-0000-000000000004', '2026-03-23'),
  ('f0010000-0000-0000-0000-000000000004', '2026-03-30'),
  ('f0010000-0000-0000-0000-000000000004', '2026-04-06'),
  ('f0010000-0000-0000-0000-000000000004', '2026-05-04'),
  ('f0010000-0000-0000-0000-000000000004', '2026-05-11'),
  ('f0010000-0000-0000-0000-000000000004', '2026-05-18'),
  ('f0010000-0000-0000-0000-000000000004', '2026-05-25'),
  ('f0010000-0000-0000-0000-000000000004', '2026-06-01'),
  ('f0010000-0000-0000-0000-000000000004', '2026-06-08'),
  -- 2026-06-15 : absente (bilan mission consulting — restitution client)
  ('f0010000-0000-0000-0000-000000000004', '2026-06-22');

-- ─── News ────────────────────────────────────────────────────
INSERT INTO public.news_posts (id, title, content, author_id, category, created_at) VALUES
  (gen_random_uuid(), 'Bienvenue sur le Hub École !', 'La plateforme est désormais en ligne. Vous trouverez ici toutes les informations sur votre scolarité, vos cours, vos notes et bien plus. Bonne navigation !', '33333333-3333-3333-3333-333333333333', 'annonce', NOW() - INTERVAL '90 days'),
  (gen_random_uuid(), 'Résultats du concours code 2025', 'Félicitations à Lucas Martin (SLAM2) qui remporte le 1er prix du concours de programmation inter-campus ! Son algorithme de tri adaptatif a impressionné le jury.', '55555555-5555-5555-5555-555555555555', 'actu', NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), 'Partenariat signé avec NeoSystems', 'Nous avons signé une convention de partenariat avec NeoSystems pour l''accueil d''alternants SISR. 5 postes ouverts pour la rentrée prochaine.', '33333333-3333-3333-3333-333333333333', 'annonce', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'Maintenance plateforme — 15 mars', 'La plateforme sera indisponible le 15 mars de 22h à 6h pour une mise à jour majeure. Sauvegardez vos travaux en cours.', '66666666-6666-6666-6666-666666666666', 'annonce', NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'Semaine projet SLAM2 : App Mobile — Bilan', 'La semaine projet "App Mobile Flutter" s''est très bien passée. 5 groupes, 5 applications fonctionnelles. Bravo à tous !', '99999999-9999-9999-9999-999999999999', 'actu', NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'Journée portes ouvertes — Samedi 22 mars', 'Venez découvrir nos formations BTS SIO SLAM et SISR. Démonstrations, rencontres avec les profs et les élèves, visite du campus.', '33333333-3333-3333-3333-333333333333', 'evenement', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), 'Forum entreprises le 23 avril', '35 entreprises partenaires seront présentes. Préparez vos CV ! Inscriptions ouvertes dans l''espace Carrière.', '55555555-5555-5555-5555-555555555555', 'evenement', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'Atelier cybersécurité — Capture The Flag', 'M. Fontaine organise un CTF le vendredi 18 avril à 14h. Tous niveaux bienvenus.', 'f0010000-0000-0000-0000-000000000001', 'evenement', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'Mise à jour FAQ et Support', 'La FAQ a été enrichie de 5 nouvelles questions. Le système de tickets est amélioré avec pièces jointes.', '66666666-6666-6666-6666-666666666666', 'annonce', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'Hackathon DevOps — Inscriptions ouvertes', 'Le 14 mai, 24h de code en équipe de 4. Déployez une app complète avec CI/CD. Prix pour les 3 premières équipes !', '99999999-9999-9999-9999-999999999999', 'evenement', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'Conférence IA & Droit du numérique', 'Me Martinez et un expert IA vous attendent le 7 mai en Amphi B. Quels enjeux juridiques pour l''IA générative ?', 'f0010000-0000-0000-0000-000000000003', 'evenement', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'Résultats semestre 2 — Conseil de classe', 'Les conseils de classe du 2ème semestre auront lieu les 25, 26 et 27 avril.', '33333333-3333-3333-3333-333333333333', 'annonce', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'Projet SISR1 en cours : Infrastructure PME', 'Les SISR1 travaillent cette semaine sur un projet d''infrastructure réseau pour PME. 5 groupes, 5 approches différentes.', 'f0010000-0000-0000-0000-000000000001', 'actu', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'Rappel : dépôt livrets apprentissage', 'Alternants : déposez vos livrets de la période 3 avant le 30 avril.', '55555555-5555-5555-5555-555555555555', 'annonce', NOW() - INTERVAL '12 hours'),
  (gen_random_uuid(), 'Planning examens — Session mai 2026', 'Le planning des examens de mai est en cours de finalisation. Consultez régulièrement votre espace Planning.', '33333333-3333-3333-3333-333333333333', 'annonce', NOW() - INTERVAL '4 hours');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 9 : Espace Documentaire
-- ═══════════════════════════════════════════════════════════════

-- ─── Dossiers racines ────────────────────────────────────────
INSERT INTO public.doc_folders (id, name, description, parent_id, created_by) VALUES
  -- Niveau 0 : dossiers racines
  ('f2010001-0000-0000-0000-000000000001', 'Administration', 'Documents administratifs et réglementaires', NULL, '33333333-3333-3333-3333-333333333333'),
  ('f2010002-0000-0000-0000-000000000002', 'Pédagogie', 'Ressources et programmes pédagogiques', NULL, '55555555-5555-5555-5555-555555555555'),
  ('f2010003-0000-0000-0000-000000000003', 'Vie scolaire', 'Règlement, charte, procédures', NULL, '66666666-6666-6666-6666-666666666666'),
  ('f2010004-0000-0000-0000-000000000004', 'Examens & Évaluations', 'Sujets, corrigés, PV de jury', NULL, '55555555-5555-5555-5555-555555555555'),
  ('f2010005-0000-0000-0000-000000000005', 'Alternance & Stages', 'Conventions, livrets, fiches entreprises', NULL, '55555555-5555-5555-5555-555555555555'),
  ('f2010006-0000-0000-0000-000000000006', 'Communication', 'Templates, logos, supports de communication', NULL, '33333333-3333-3333-3333-333333333333'),
  -- Niveau 1 : sous-dossiers Administration
  ('f2020001-0000-0000-0000-000000000001', 'Inscriptions', 'Dossiers et formulaires d''inscription', 'f2010001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('f2020002-0000-0000-0000-000000000002', 'Comptabilité', 'Facturation, budgets, subventions', 'f2010001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('f2020003-0000-0000-0000-000000000003', 'Contrats & RH', 'Contrats enseignants, conventions', 'f2010001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  -- Niveau 1 : sous-dossiers Pédagogie
  ('f2020004-0000-0000-0000-000000000004', 'BTS SIO SLAM', 'Programmes et ressources option SLAM', 'f2010002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555'),
  ('f2020005-0000-0000-0000-000000000005', 'BTS SIO SISR', 'Programmes et ressources option SISR', 'f2010002-0000-0000-0000-000000000002', 'f0010000-0000-0000-0000-000000000001'),
  ('f2020006-0000-0000-0000-000000000006', 'Tronc commun', 'Matières communes SLAM/SISR', 'f2010002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('f2020007-0000-0000-0000-000000000007', 'Référentiels BTS', 'Référentiels nationaux et grilles', 'f2010002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555'),
  -- Niveau 1 : sous-dossiers Vie scolaire
  ('f2020008-0000-0000-0000-000000000008', 'Règlement intérieur', 'Versions du règlement et annexes', 'f2010003-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666'),
  ('f2020009-0000-0000-0000-000000000009', 'Conseils de classe', 'PV et comptes-rendus', 'f2010003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  -- Niveau 1 : sous-dossiers Examens
  ('f2020010-0000-0000-0000-000000000010', 'Session 2026', 'Examens session mai/juin 2026', 'f2010004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555'),
  ('f2020011-0000-0000-0000-000000000011', 'Session 2025', 'Archives examens 2025', 'f2010004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555'),
  -- Niveau 1 : sous-dossiers Alternance
  ('f2020012-0000-0000-0000-000000000012', 'Conventions type', 'Modèles de conventions tripartites', 'f2010005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555'),
  ('f2020013-0000-0000-0000-000000000013', 'Fiches entreprises', 'Fiches descriptives entreprises partenaires', 'f2010005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555'),
  -- Niveau 1 : sous-dossiers Communication
  ('f2020014-0000-0000-0000-000000000014', 'Identité visuelle', 'Logos, charte graphique, polices', 'f2010006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333'),
  ('f2020015-0000-0000-0000-000000000015', 'Supports événements', 'Affiches, flyers, présentations', 'f2010006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333'),
  -- Niveau 2 : sous-sous-dossiers SLAM
  ('f2030001-0000-0000-0000-000000000001', 'Développement Web', 'Cours et TP développement web', 'f2020004-0000-0000-0000-000000000004', '99999999-9999-9999-9999-999999999999'),
  ('f2030002-0000-0000-0000-000000000002', 'Bases de données', 'Cours SQL, modélisation, TP', 'f2020004-0000-0000-0000-000000000004', '99999999-9999-9999-9999-999999999999'),
  ('f2030003-0000-0000-0000-000000000003', 'Cybersécurité SLAM', 'OWASP, sécurité applicative', 'f2020004-0000-0000-0000-000000000004', '99999999-9999-9999-9999-999999999999'),
  -- Niveau 2 : sous-sous-dossiers SISR
  ('f2030004-0000-0000-0000-000000000004', 'Réseaux', 'Cours et TP réseaux', 'f2020005-0000-0000-0000-000000000005', 'f0010000-0000-0000-0000-000000000001'),
  ('f2030005-0000-0000-0000-000000000005', 'Systèmes', 'Administration Windows/Linux', 'f2020005-0000-0000-0000-000000000005', 'f0010000-0000-0000-0000-000000000001'),
  ('f2030006-0000-0000-0000-000000000006', 'Cybersécurité SISR', 'Audit, pentest, sécurité réseau', 'f2020005-0000-0000-0000-000000000005', 'f0010000-0000-0000-0000-000000000001');

-- ─── Fichiers ────────────────────────────────────────────────
INSERT INTO public.doc_files (id, folder_id, name, description, tags, mime_type, size_bytes, storage_path, uploaded_by) VALUES
  -- Administration > Inscriptions
  ('fa010001-0000-0000-0000-000000000001', 'f2020001-0000-0000-0000-000000000001', 'Formulaire_inscription_2026.pdf', 'Dossier d''inscription vierge rentrée 2026', ARRAY['inscription','formulaire','2026'], 'application/pdf', 245760, 'documents/admin/inscriptions/formulaire_2026.pdf', '33333333-3333-3333-3333-333333333333'),
  ('fa010002-0000-0000-0000-000000000002', 'f2020001-0000-0000-0000-000000000001', 'Liste_pieces_justificatives.pdf', 'Pièces à fournir pour le dossier d''inscription', ARRAY['inscription','pièces'], 'application/pdf', 98304, 'documents/admin/inscriptions/pieces_justificatives.pdf', '33333333-3333-3333-3333-333333333333'),
  ('fa010003-0000-0000-0000-000000000003', 'f2020001-0000-0000-0000-000000000001', 'Calendrier_admissions_2026.xlsx', 'Planning des phases d''admission', ARRAY['inscription','calendrier','2026'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 35840, 'documents/admin/inscriptions/calendrier_admissions.xlsx', '66666666-6666-6666-6666-666666666666'),
  -- Administration > Comptabilité
  ('fa010004-0000-0000-0000-000000000004', 'f2020002-0000-0000-0000-000000000002', 'Budget_previsionnel_2026.xlsx', 'Budget prévisionnel année scolaire 2025-2026', ARRAY['budget','comptabilité','2026'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 156672, 'documents/admin/compta/budget_2026.xlsx', '33333333-3333-3333-3333-333333333333'),
  ('fa010005-0000-0000-0000-000000000005', 'f2020002-0000-0000-0000-000000000002', 'Factures_Q1_2026.pdf', 'Récapitulatif facturation 1er trimestre', ARRAY['factures','comptabilité','Q1'], 'application/pdf', 524288, 'documents/admin/compta/factures_q1.pdf', '33333333-3333-3333-3333-333333333333'),
  -- Administration > Contrats
  ('fa010006-0000-0000-0000-000000000006', 'f2020003-0000-0000-0000-000000000003', 'Modele_contrat_vacataire.docx', 'Template contrat enseignant vacataire', ARRAY['contrat','RH','modèle'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 45056, 'documents/admin/rh/contrat_vacataire.docx', '33333333-3333-3333-3333-333333333333'),
  -- Pédagogie > SLAM > Dev Web
  ('fa020001-0000-0000-0000-000000000001', 'f2030001-0000-0000-0000-000000000001', 'Cours_React_Hooks_Complet.pdf', 'Cours complet sur les Hooks React (useState, useEffect, useContext, custom hooks)', ARRAY['react','hooks','frontend','cours'], 'application/pdf', 2097152, 'documents/pedagogy/slam/devweb/react_hooks.pdf', '99999999-9999-9999-9999-999999999999'),
  ('fa020002-0000-0000-0000-000000000002', 'f2030001-0000-0000-0000-000000000001', 'TP_API_REST_Express.pdf', 'TP noté : créer une API REST avec Express et JWT', ARRAY['api','express','tp','nodejs'], 'application/pdf', 1048576, 'documents/pedagogy/slam/devweb/tp_api_rest.pdf', '99999999-9999-9999-9999-999999999999'),
  ('fa020003-0000-0000-0000-000000000003', 'f2030001-0000-0000-0000-000000000001', 'Cheatsheet_TypeScript.pdf', 'Aide-mémoire TypeScript : types, interfaces, generics', ARRAY['typescript','cheatsheet','référence'], 'application/pdf', 524288, 'documents/pedagogy/slam/devweb/cheatsheet_ts.pdf', '99999999-9999-9999-9999-999999999999'),
  ('fa020004-0000-0000-0000-000000000004', 'f2030001-0000-0000-0000-000000000001', 'Projet_Next.js_Consignes.pdf', 'Consignes du projet Next.js : app full-stack avec Supabase', ARRAY['nextjs','projet','supabase','consignes'], 'application/pdf', 786432, 'documents/pedagogy/slam/devweb/projet_nextjs.pdf', '99999999-9999-9999-9999-999999999999'),
  -- Pédagogie > SLAM > BDD
  ('fa020005-0000-0000-0000-000000000005', 'f2030002-0000-0000-0000-000000000002', 'Cours_SQL_Avance.pdf', 'Jointures, sous-requêtes, vues, triggers, procédures stockées', ARRAY['sql','bdd','cours','avancé'], 'application/pdf', 1572864, 'documents/pedagogy/slam/bdd/sql_avance.pdf', '99999999-9999-9999-9999-999999999999'),
  ('fa020006-0000-0000-0000-000000000006', 'f2030002-0000-0000-0000-000000000002', 'TP_Modelisation_MCD_MLD.pdf', 'TP : modéliser une base de données e-commerce', ARRAY['mcd','mld','modélisation','tp'], 'application/pdf', 655360, 'documents/pedagogy/slam/bdd/tp_modelisation.pdf', '99999999-9999-9999-9999-999999999999'),
  ('fa020007-0000-0000-0000-000000000007', 'f2030002-0000-0000-0000-000000000002', 'Exercices_PostgreSQL.sql', 'Fichier SQL avec 30 exercices progressifs PostgreSQL', ARRAY['postgresql','exercices','sql'], 'application/sql', 32768, 'documents/pedagogy/slam/bdd/exercices_pg.sql', '99999999-9999-9999-9999-999999999999'),
  -- Pédagogie > SISR > Réseaux
  ('fa020008-0000-0000-0000-000000000008', 'f2030004-0000-0000-0000-000000000004', 'Cours_VLAN_Routage.pdf', 'VLANs, routage inter-VLAN, protocoles de routage', ARRAY['vlan','routage','cisco','cours'], 'application/pdf', 3145728, 'documents/pedagogy/sisr/reseaux/vlan_routage.pdf', 'f0010000-0000-0000-0000-000000000001'),
  ('fa020009-0000-0000-0000-000000000009', 'f2030004-0000-0000-0000-000000000004', 'TP_Packet_Tracer_OSPF.pka', 'TP Packet Tracer : configuration OSPF multi-zones', ARRAY['ospf','packet-tracer','tp','routage'], 'application/octet-stream', 4194304, 'documents/pedagogy/sisr/reseaux/tp_ospf.pka', 'f0010000-0000-0000-0000-000000000001'),
  ('fa020010-0000-0000-0000-000000000010', 'f2030004-0000-0000-0000-000000000004', 'Schema_Architecture_Reseau.png', 'Schéma type architecture réseau PME (30 postes)', ARRAY['schéma','architecture','réseau'], 'image/png', 1048576, 'documents/pedagogy/sisr/reseaux/archi_reseau.png', 'f0010000-0000-0000-0000-000000000001'),
  -- Pédagogie > SISR > Systèmes
  ('fa020011-0000-0000-0000-000000000011', 'f2030005-0000-0000-0000-000000000005', 'Guide_AD_Windows_Server.pdf', 'Installation et configuration Active Directory pas à pas', ARRAY['active-directory','windows','guide'], 'application/pdf', 2621440, 'documents/pedagogy/sisr/systemes/guide_ad.pdf', 'f0010000-0000-0000-0000-000000000001'),
  ('fa020012-0000-0000-0000-000000000012', 'f2030005-0000-0000-0000-000000000005', 'TP_Linux_Administration.pdf', 'TP : gestion utilisateurs, permissions, cron, logs sous Debian', ARRAY['linux','debian','administration','tp'], 'application/pdf', 1310720, 'documents/pedagogy/sisr/systemes/tp_linux.pdf', 'f0010000-0000-0000-0000-000000000001'),
  -- Pédagogie > SISR > Cybersécurité
  ('fa020013-0000-0000-0000-000000000013', 'f2030006-0000-0000-0000-000000000006', 'Cours_Firewall_IDS_IPS.pdf', 'Firewalls, systèmes de détection et prévention d''intrusion', ARRAY['firewall','ids','ips','sécurité'], 'application/pdf', 1835008, 'documents/pedagogy/sisr/cybersec/firewall_ids.pdf', 'f0010000-0000-0000-0000-000000000001'),
  ('fa020014-0000-0000-0000-000000000014', 'f2030006-0000-0000-0000-000000000006', 'Lab_CTF_Debutant.pdf', 'Guide du lab Capture The Flag pour débutants', ARRAY['ctf','lab','sécurité','débutant'], 'application/pdf', 917504, 'documents/pedagogy/sisr/cybersec/ctf_debutant.pdf', 'f0010000-0000-0000-0000-000000000001'),
  -- Pédagogie > Tronc commun
  ('fa020015-0000-0000-0000-000000000015', 'f2020006-0000-0000-0000-000000000006', 'Cours_Algo_Structures_Donnees.pdf', 'Algorithmes de tri, recherche, structures de données (listes, arbres, graphes)', ARRAY['algorithme','structures','cours'], 'application/pdf', 2097152, 'documents/pedagogy/commun/algo_structures.pdf', '22222222-2222-2222-2222-222222222222'),
  ('fa020016-0000-0000-0000-000000000016', 'f2020006-0000-0000-0000-000000000006', 'Sujet_DS_Maths_Mars_2026.pdf', 'Devoir surveillé mathématiques — mars 2026', ARRAY['maths','ds','sujet','mars-2026'], 'application/pdf', 327680, 'documents/pedagogy/commun/ds_maths_mars.pdf', '22222222-2222-2222-2222-222222222222'),
  ('fa020017-0000-0000-0000-000000000017', 'f2020006-0000-0000-0000-000000000006', 'Corrige_DS_Maths_Mars_2026.pdf', 'Corrigé du DS mathématiques — mars 2026', ARRAY['maths','ds','corrigé','mars-2026'], 'application/pdf', 491520, 'documents/pedagogy/commun/corrige_maths_mars.pdf', '22222222-2222-2222-2222-222222222222'),
  -- Pédagogie > Référentiels
  ('fa020018-0000-0000-0000-000000000018', 'f2020007-0000-0000-0000-000000000007', 'Referentiel_BTS_SIO_2025.pdf', 'Référentiel national BTS SIO — édition 2025', ARRAY['référentiel','bts','national','officiel'], 'application/pdf', 4718592, 'documents/pedagogy/referentiels/ref_bts_sio_2025.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa020019-0000-0000-0000-000000000019', 'f2020007-0000-0000-0000-000000000007', 'Grille_Evaluation_E4.pdf', 'Grille d''évaluation épreuve E4 — parcours de professionnalisation', ARRAY['grille','évaluation','E4','examen'], 'application/pdf', 163840, 'documents/pedagogy/referentiels/grille_e4.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa020020-0000-0000-0000-000000000020', 'f2020007-0000-0000-0000-000000000007', 'Grille_Evaluation_E5.pdf', 'Grille d''évaluation épreuve E5 — situation professionnelle', ARRAY['grille','évaluation','E5','examen'], 'application/pdf', 163840, 'documents/pedagogy/referentiels/grille_e5.pdf', '55555555-5555-5555-5555-555555555555'),
  -- Vie scolaire > Règlement
  ('fa030001-0000-0000-0000-000000000001', 'f2020008-0000-0000-0000-000000000008', 'Reglement_Interieur_2025-2026.pdf', 'Règlement intérieur en vigueur', ARRAY['règlement','officiel','2025-2026'], 'application/pdf', 655360, 'documents/viescolaire/reglement_2025_2026.pdf', '66666666-6666-6666-6666-666666666666'),
  ('fa030002-0000-0000-0000-000000000002', 'f2020008-0000-0000-0000-000000000008', 'Charte_Informatique.pdf', 'Charte d''utilisation du matériel informatique et du réseau', ARRAY['charte','informatique','réseau'], 'application/pdf', 327680, 'documents/viescolaire/charte_info.pdf', '66666666-6666-6666-6666-666666666666'),
  -- Vie scolaire > Conseils de classe
  ('fa030003-0000-0000-0000-000000000003', 'f2020009-0000-0000-0000-000000000009', 'PV_Conseil_SLAM2_Sem1.pdf', 'PV conseil de classe SLAM2 — semestre 1', ARRAY['pv','conseil','slam2','semestre1'], 'application/pdf', 245760, 'documents/viescolaire/conseils/pv_slam2_s1.pdf', '33333333-3333-3333-3333-333333333333'),
  ('fa030004-0000-0000-0000-000000000004', 'f2020009-0000-0000-0000-000000000009', 'PV_Conseil_SISR2_Sem1.pdf', 'PV conseil de classe SISR2 — semestre 1', ARRAY['pv','conseil','sisr2','semestre1'], 'application/pdf', 229376, 'documents/viescolaire/conseils/pv_sisr2_s1.pdf', '33333333-3333-3333-3333-333333333333'),
  -- Examens > Session 2026
  ('fa040001-0000-0000-0000-000000000001', 'f2020010-0000-0000-0000-000000000010', 'Calendrier_Examens_Mai_2026.pdf', 'Planning des épreuves — session mai/juin 2026', ARRAY['examens','calendrier','2026','planning'], 'application/pdf', 196608, 'documents/examens/session2026/calendrier.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa040002-0000-0000-0000-000000000002', 'f2020010-0000-0000-0000-000000000010', 'Consignes_Epreuve_E4.pdf', 'Consignes et attendus pour l''épreuve E4', ARRAY['E4','consignes','examen'], 'application/pdf', 524288, 'documents/examens/session2026/consignes_e4.pdf', '55555555-5555-5555-5555-555555555555'),
  -- Examens > Session 2025 (archives)
  ('fa040003-0000-0000-0000-000000000003', 'f2020011-0000-0000-0000-000000000011', 'Sujet_E5_Session_2025.pdf', 'Sujet épreuve E5 — session 2025 (archive)', ARRAY['E5','sujet','2025','archive'], 'application/pdf', 786432, 'documents/examens/session2025/sujet_e5.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa040004-0000-0000-0000-000000000004', 'f2020011-0000-0000-0000-000000000011', 'Corrige_E5_Session_2025.pdf', 'Corrigé épreuve E5 — session 2025', ARRAY['E5','corrigé','2025','archive'], 'application/pdf', 1048576, 'documents/examens/session2025/corrige_e5.pdf', '55555555-5555-5555-5555-555555555555'),
  -- Alternance > Conventions
  ('fa050001-0000-0000-0000-000000000001', 'f2020012-0000-0000-0000-000000000012', 'Convention_Tripartite_Type.docx', 'Modèle de convention tripartite (école–entreprise–étudiant)', ARRAY['convention','alternance','modèle'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 57344, 'documents/alternance/conventions/convention_type.docx', '55555555-5555-5555-5555-555555555555'),
  ('fa050002-0000-0000-0000-000000000002', 'f2020012-0000-0000-0000-000000000012', 'Guide_Maitre_Apprentissage.pdf', 'Guide à destination des maîtres d''apprentissage', ARRAY['guide','alternance','maître'], 'application/pdf', 819200, 'documents/alternance/conventions/guide_ma.pdf', '55555555-5555-5555-5555-555555555555'),
  -- Alternance > Fiches entreprises
  ('fa050003-0000-0000-0000-000000000003', 'f2020013-0000-0000-0000-000000000013', 'Fiche_AcmeCorp.pdf', 'Fiche entreprise Acme Corp — Dev Full Stack', ARRAY['acme','entreprise','fiche'], 'application/pdf', 163840, 'documents/alternance/fiches/fiche_acme.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa050004-0000-0000-0000-000000000004', 'f2020013-0000-0000-0000-000000000013', 'Fiche_NeoSystems.pdf', 'Fiche entreprise NeoSystems — Admin Systèmes', ARRAY['neosystems','entreprise','fiche'], 'application/pdf', 163840, 'documents/alternance/fiches/fiche_neosystems.pdf', '55555555-5555-5555-5555-555555555555'),
  ('fa050005-0000-0000-0000-000000000005', 'f2020013-0000-0000-0000-000000000013', 'Fiche_Nextech.pdf', 'Fiche entreprise Nextech SAS — Dev mobile Flutter', ARRAY['nextech','entreprise','fiche'], 'application/pdf', 147456, 'documents/alternance/fiches/fiche_nextech.pdf', '55555555-5555-5555-5555-555555555555'),
  -- Communication > Identité visuelle
  ('fa060001-0000-0000-0000-000000000001', 'f2020014-0000-0000-0000-000000000014', 'Logo_ESIEE_Principal.png', 'Logo principal de l''école — haute résolution', ARRAY['logo','identité','officiel'], 'image/png', 524288, 'documents/communication/logo_principal.png', '33333333-3333-3333-3333-333333333333'),
  ('fa060002-0000-0000-0000-000000000002', 'f2020014-0000-0000-0000-000000000014', 'Charte_Graphique_2025.pdf', 'Charte graphique : couleurs, typographies, usages du logo', ARRAY['charte','graphique','identité'], 'application/pdf', 2097152, 'documents/communication/charte_graphique.pdf', '33333333-3333-3333-3333-333333333333'),
  -- Communication > Supports événements
  ('fa060003-0000-0000-0000-000000000003', 'f2020015-0000-0000-0000-000000000015', 'Affiche_Forum_Entreprises_2026.pdf', 'Affiche A3 du forum entreprises — 23 avril 2026', ARRAY['affiche','forum','événement'], 'application/pdf', 3145728, 'documents/communication/events/affiche_forum.pdf', '33333333-3333-3333-3333-333333333333'),
  ('fa060004-0000-0000-0000-000000000004', 'f2020015-0000-0000-0000-000000000015', 'Presentation_JPO_Mars_2026.pptx', 'Présentation PowerPoint pour les journées portes ouvertes', ARRAY['jpo','présentation','portes-ouvertes'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 8388608, 'documents/communication/events/pres_jpo.pptx', '33333333-3333-3333-3333-333333333333'),
  ('fa060005-0000-0000-0000-000000000005', 'f2020015-0000-0000-0000-000000000015', 'Flyer_Hackathon_DevOps.pdf', 'Flyer de promotion du hackathon DevOps — mai 2026', ARRAY['hackathon','flyer','devops'], 'application/pdf', 1572864, 'documents/communication/events/flyer_hackathon.pdf', '55555555-5555-5555-5555-555555555555');

-- ─── Permissions par dossier ─────────────────────────────────
INSERT INTO public.doc_permissions (folder_id, role_target, level, granted_by) VALUES
  -- Administration : admin + coordinateur en write
  ('f2010001-0000-0000-0000-000000000001', 'admin', 'admin', '33333333-3333-3333-3333-333333333333'),
  ('f2010001-0000-0000-0000-000000000001', 'coordinateur', 'write', '33333333-3333-3333-3333-333333333333'),
  -- Pédagogie : profs en write, élèves en read
  ('f2010002-0000-0000-0000-000000000002', 'professeur', 'write', '55555555-5555-5555-5555-555555555555'),
  ('f2010002-0000-0000-0000-000000000002', 'eleve', 'read', '55555555-5555-5555-5555-555555555555'),
  ('f2010002-0000-0000-0000-000000000002', 'coordinateur', 'admin', '55555555-5555-5555-5555-555555555555'),
  -- Vie scolaire : staff en write, profs en read
  ('f2010003-0000-0000-0000-000000000003', 'staff', 'write', '66666666-6666-6666-6666-666666666666'),
  ('f2010003-0000-0000-0000-000000000003', 'professeur', 'read', '66666666-6666-6666-6666-666666666666'),
  -- Examens : profs en write, coordinateur en admin
  ('f2010004-0000-0000-0000-000000000004', 'professeur', 'write', '55555555-5555-5555-5555-555555555555'),
  ('f2010004-0000-0000-0000-000000000004', 'coordinateur', 'admin', '55555555-5555-5555-5555-555555555555'),
  -- Alternance : coordinateur en admin, entreprises en read
  ('f2010005-0000-0000-0000-000000000005', 'coordinateur', 'admin', '55555555-5555-5555-5555-555555555555'),
  ('f2010005-0000-0000-0000-000000000005', 'entreprise', 'read', '55555555-5555-5555-5555-555555555555'),
  -- Communication : admin en admin, tous en read
  ('f2010006-0000-0000-0000-000000000006', 'admin', 'admin', '33333333-3333-3333-3333-333333333333'),
  ('f2010006-0000-0000-0000-000000000006', 'professeur', 'read', '33333333-3333-3333-3333-333333333333'),
  ('f2010006-0000-0000-0000-000000000006', 'eleve', 'read', '33333333-3333-3333-3333-333333333333');

-- ─── Liens de partage ────────────────────────────────────────
INSERT INTO public.doc_share_links (file_id, folder_id, token, label, expires_at, max_uses, created_by) VALUES
  -- Lien vers le référentiel BTS (fichier)
  (NULL, 'f2020007-0000-0000-0000-000000000007', 'ref-bts-sio-2025-public', 'Référentiels BTS — accès public', NOW() + INTERVAL '180 days', NULL, '55555555-5555-5555-5555-555555555555'),
  -- Lien vers le règlement intérieur (fichier)
  ('fa030001-0000-0000-0000-000000000001', NULL, 'reglement-interieur-2026', 'Règlement intérieur — lien parents', NOW() + INTERVAL '365 days', NULL, '66666666-6666-6666-6666-666666666666'),
  -- Lien vers le guide MA (fichier)
  ('fa050002-0000-0000-0000-000000000002', NULL, 'guide-ma-2026-entreprises', 'Guide MA — envoyé aux entreprises', NOW() + INTERVAL '90 days', 50, '55555555-5555-5555-5555-555555555555'),
  -- Lien vers le dossier supports événements
  (NULL, 'f2020015-0000-0000-0000-000000000015', 'supports-events-partage', 'Supports événements — partage équipe com', NOW() + INTERVAL '60 days', NULL, '33333333-3333-3333-3333-333333333333');

-- ═══════════════════════════════════════════════════════════════
-- FIN DU SEED — 94 comptes, 4 classes, ~2000+ enregistrements
-- ═══════════════════════════════════════════════════════════════
