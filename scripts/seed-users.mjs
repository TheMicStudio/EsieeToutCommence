/**
 * Seed script — crée les comptes de test via l'Admin API Supabase
 * Usage : node scripts/seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcrxfmqtqunrgabyooxr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcnhmbXF0cXVucmdhYnlvb3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1ODQzMSwiZXhwIjoyMDkxMTM0NDMxfQ.kGP_GjMedeBKXNzrAMUUMXwuCKYFVhXOH8Ms3BzYaWI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: 'etudiant@hub-ecole.dev',
    password: 'Test1234!',
    role: 'eleve',
    profile: { nom: 'Martin', prenom: 'Lucas', type_parcours: 'alternant' },
    table: 'student_profiles',
  },
  {
    email: 'prof@hub-ecole.dev',
    password: 'Test1234!',
    role: 'professeur',
    profile: { nom: 'Bernard', prenom: 'Sophie', matieres_enseignees: ['Mathématiques', 'Algorithmique'] },
    table: 'teacher_profiles',
  },
  {
    email: 'admin@hub-ecole.dev',
    password: 'Test1234!',
    role: 'admin',
    profile: { nom: 'Dupont', prenom: 'Marie', fonction: 'Responsable pédagogique' },
    table: 'admin_profiles',
  },
  {
    email: 'entreprise@hub-ecole.dev',
    password: 'Test1234!',
    role: 'entreprise',
    profile: { nom: 'Leroy', prenom: 'Thomas', entreprise: 'Acme Corp', poste: "Maître d'apprentissage" },
    table: 'company_profiles',
  },
];

async function deleteUser(email) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`  Suppression de l'ancien compte ${email}…`);
    await supabase.auth.admin.deleteUser(existing.id);
  }
}

async function main() {
  console.log('=== Seed comptes de test Hub École ===\n');

  const createdIds = {};

  for (const u of USERS) {
    console.log(`→ ${u.email}`);

    // 1. Supprimer si existant
    await deleteUser(u.email);

    // 2. Créer via Admin API (mot de passe correct, email confirmé)
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error(`  ✗ Erreur création auth : ${error?.message}`);
      continue;
    }

    const userId = data.user.id;
    createdIds[u.role] = userId;
    console.log(`  ✓ Auth créé — ID : ${userId}`);

    // 3. Insérer le rôle
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ id: userId, role: u.role });
    if (roleError) console.error(`  ✗ user_roles : ${roleError.message}`);
    else console.log(`  ✓ Rôle "${u.role}" inséré`);

    // 4. Insérer le profil
    const { error: profileError } = await supabase
      .from(u.table)
      .upsert({ id: userId, ...u.profile });
    if (profileError) console.error(`  ✗ ${u.table} : ${profileError.message}`);
    else console.log(`  ✓ Profil inséré dans ${u.table}`);

    console.log('');
  }

  // ── Classe + associations ──────────────────────────────────
  console.log('→ Création de la classe BTS SIO SLAM 2…');

  const CLASS_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  await supabase.from('classes').upsert({ id: CLASS_ID, nom: 'BTS SIO SLAM 2', annee: 2026 });

  const eleveId = createdIds['eleve'];
  const profId = createdIds['professeur'];

  if (eleveId) {
    await supabase.from('class_members').upsert({ class_id: CLASS_ID, student_id: eleveId });
    console.log('  ✓ Élève ajouté à la classe');
  }

  if (profId) {
    await supabase.from('teacher_classes').upsert({ class_id: CLASS_ID, teacher_id: profId, matiere: 'Mathématiques' });
    await supabase.from('teacher_classes').upsert({ class_id: CLASS_ID, teacher_id: profId, matiere: 'Algorithmique' });
    console.log('  ✓ Prof assigné à la classe (2 matières)');
  }

  // ── Notes ──────────────────────────────────────────────────
  if (eleveId && profId) {
    const notes = [
      { student_id: eleveId, teacher_id: profId, class_id: CLASS_ID, matiere: 'Mathématiques', examen: 'DS n°1', note: 14.5, coefficient: 2 },
      { student_id: eleveId, teacher_id: profId, class_id: CLASS_ID, matiere: 'Mathématiques', examen: 'Contrôle', note: 12, coefficient: 1 },
      { student_id: eleveId, teacher_id: profId, class_id: CLASS_ID, matiere: 'Algorithmique', examen: 'TP noté', note: 16, coefficient: 3 },
      { student_id: eleveId, teacher_id: profId, class_id: CLASS_ID, matiere: 'Algorithmique', examen: 'Projet', note: 18, coefficient: 2 },
    ];
    const { error } = await supabase.from('grades').insert(notes);
    if (error) console.error(`  ✗ notes : ${error.message}`);
    else console.log('  ✓ 4 notes insérées');
  }

  // ── Matériaux de cours ────────────────────────────────────
  if (profId) {
    await supabase.from('course_materials').insert([
      { class_id: CLASS_ID, teacher_id: profId, titre: 'Introduction aux algorithmes de tri', type: 'lien', url: 'https://fr.wikipedia.org/wiki/Algorithme_de_tri', matiere: 'Algorithmique' },
      { class_id: CLASS_ID, teacher_id: profId, titre: 'Cours Mathématiques — Probabilités', type: 'lien', url: 'https://fr.khanacademy.org/math/statistics-probability', matiere: 'Mathématiques' },
    ]);
    console.log('  ✓ 2 cours insérés');
  }

  // ── Canaux de classe ─────────────────────────────────────
  const CHAN1 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CHAN2 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  await supabase.from('class_channels').upsert([
    { id: CHAN1, class_id: CLASS_ID, nom: 'Général' },
    { id: CHAN2, class_id: CLASS_ID, nom: 'Entraide élèves' },
  ]);
  if (profId && eleveId) {
    await supabase.from('class_messages').insert([
      { channel_id: CHAN1, author_id: profId, contenu: 'Bonjour à tous ! Le TP de lundi est confirmé.' },
      { channel_id: CHAN1, author_id: eleveId, contenu: 'Merci professeur !' },
      { channel_id: CHAN2, author_id: eleveId, contenu: "Quelqu'un a les corrections du DS ?" },
    ]);
    console.log('  ✓ Canaux + messages insérés');
  }

  // ── Ticket support ────────────────────────────────────────
  if (eleveId) {
    await supabase.from('tickets').insert({
      sujet: "Accès à l'ENT impossible depuis hier",
      description: "Je n'arrive plus à me connecter à l'ENT depuis hier soir. J'ai essayé sur Firefox et Chrome.",
      categorie: 'informatique',
      statut: 'ouvert',
      auteur_id: eleveId,
    });
    console.log('  ✓ Ticket support inséré');
  }

  // ── FAQ ───────────────────────────────────────────────────
  const adminId = createdIds['admin'];
  if (adminId) {
    await supabase.from('faq_articles').insert([
      { question: 'Comment réinitialiser mon mot de passe ?', reponse: 'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Un email vous sera envoyé avec un lien de réinitialisation valable 1 heure.', categorie: 'informatique', publie: true, auteur_id: adminId },
      { question: 'Comment accéder à mes notes ?', reponse: 'Dans le dashboard, cliquez sur "Pédagogie" puis "Mes notes". Vous y trouverez toutes vos notes par matière avec votre moyenne générale.', categorie: 'pedagogie', publie: true, auteur_id: adminId },
    ]);
    console.log('  ✓ 2 articles FAQ insérés');
  }

  console.log('\n=== Seed terminé ===');
  console.log('Comptes de test :');
  console.log('  etudiant@hub-ecole.dev   / Test1234!');
  console.log('  prof@hub-ecole.dev       / Test1234!');
  console.log('  admin@hub-ecole.dev      / Test1234!');
  console.log('  entreprise@hub-ecole.dev / Test1234!');
}

main().catch(console.error);
