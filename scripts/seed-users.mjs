/**
 * Seed script — crée les comptes de test via l'Admin API Supabase (GoTrue)
 * Usage : node scripts/seed-users.mjs
 *
 * Ce script DOIT être exécuté AVANT seed.sql.
 * Il crée les utilisateurs avec des UUIDs fixes via l'API admin (pas via SQL direct),
 * ce qui garantit que GoTrue initialise tous les champs requis correctement.
 *
 * Volumétrie : 94 comptes
 *   - 3 admin/staff/coordinateur
 *   - 6 professeurs
 *   - 5 entreprises
 *   - 80 élèves (20 par classe × 4 classes)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lire les variables d'environnement depuis .env.local
let SUPABASE_URL, SERVICE_ROLE_KEY;
for (const envFile of ['.env.local', '.env']) {
  try {
    const env = readFileSync(resolve(__dirname, '..', envFile), 'utf8');
    for (const line of env.split('\n')) {
      const [k, ...rest] = line.split('=');
      const v = rest.join('=').trim();
      if (k === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = v;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_ROLE_KEY = v;
    }
    if (SUPABASE_URL && SERVICE_ROLE_KEY) break;
  } catch { /* fichier absent */ }
}
if (!SUPABASE_URL) SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SERVICE_ROLE_KEY) SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Convention UUID ──────────────────────────────────────────────────────────
// Admin/Staff       : 33333333-... , 55555555-... , 66666666-...
// Profs             : 22222222-... , 99999999-... , f001XXXX-...
// Entreprises       : 44444444-... , eeeeeeee-... , 2e01XXXX-...
// SLAM2 (8 origine) : 11111111-... , 77777777-... , 88888888-... , 1a0200XX-...
// SLAM2 (ajoutés)   : 1a020000-0000-0000-0000-0000000000XX
// SLAM1             : 1a010000-0000-0000-0000-0000000000XX
// SISR1             : 1b010000-0000-0000-0000-0000000000XX
// SISR2             : 1b020000-0000-0000-0000-0000000000XX
// ──────────────────────────────────────────────────────────────────────────────

const USERS = [
  // ══════════════════════════════════════════════════════════════
  // DIRECTION / STAFF / COORDINATEUR (3)
  // ══════════════════════════════════════════════════════════════
  { id: '33333333-3333-3333-3333-333333333333', email: 'admin@hub-ecole.dev',        password: 'Test1234!', label: 'Marie Dupont (direction)' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'coordinateur@hub-ecole.dev', password: 'Test1234!', label: 'Julien Moreau (coordinateur)' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'staff@hub-ecole.dev',        password: 'Test1234!', label: 'Isabelle Laurent (secrétariat)' },

  // ══════════════════════════════════════════════════════════════
  // PROFESSEURS (6)
  // ══════════════════════════════════════════════════════════════
  { id: '22222222-2222-2222-2222-222222222222', email: 'prof@hub-ecole.dev',         password: 'Test1234!', label: 'Sophie Bernard (Maths/Algo)' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'prof2@hub-ecole.dev',        password: 'Test1234!', label: 'Antoine Girard (Dev web/BDD)' },
  { id: 'f0010000-0000-0000-0000-000000000001', email: 'fontaine@hub-ecole.dev',     password: 'Test1234!', label: 'Cyril Fontaine (Réseaux/Sécu)' },
  { id: 'f0010000-0000-0000-0000-000000000002', email: 'dumas@hub-ecole.dev',        password: 'Test1234!', label: 'Amélie Dumas (Anglais/Com)' },
  { id: 'f0010000-0000-0000-0000-000000000003', email: 'martinez@hub-ecole.dev',     password: 'Test1234!', label: 'Carlos Martinez (Droit/Éco)' },
  { id: 'f0010000-0000-0000-0000-000000000004', email: 'noel@hub-ecole.dev',         password: 'Test1234!', label: 'Hélène Noël (Gestion projet/SI)' },

  // ══════════════════════════════════════════════════════════════
  // ENTREPRISES (5)
  // ══════════════════════════════════════════════════════════════
  { id: '44444444-4444-4444-4444-444444444444', email: 'entreprise@hub-ecole.dev',   password: 'Test1234!', label: 'Thomas Leroy (Acme Corp)' },
  { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', email: 'entreprise2@hub-ecole.dev',  password: 'Test1234!', label: 'Caroline Favre (Nextech SAS)' },
  { id: '2e010000-0000-0000-0000-000000000001', email: 'neosystems@hub-ecole.dev',   password: 'Test1234!', label: 'Bertrand Morin (NeoSystems)' },
  { id: '2e010000-0000-0000-0000-000000000002', email: 'innovlab@hub-ecole.dev',     password: 'Test1234!', label: 'Nadia Hamid (InnovLab Paris)' },
  { id: '2e010000-0000-0000-0000-000000000003', email: 'cloudnine@hub-ecole.dev',    password: 'Test1234!', label: 'Éric Vasseur (Cloud Nine)' },

  // ══════════════════════════════════════════════════════════════
  // BTS SIO SLAM 2ème année — 20 élèves
  // ══════════════════════════════════════════════════════════════
  { id: '11111111-1111-1111-1111-111111111111', email: 'etudiant@hub-ecole.dev',          password: 'Test1234!', label: 'Lucas Martin (SLAM2)' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'etudiant2@hub-ecole.dev',         password: 'Test1234!', label: 'Emma Rousseau (SLAM2)' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'etudiant3@hub-ecole.dev',         password: 'Test1234!', label: 'Hugo Petit (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000001', email: 'chloe.bonnet@hub-ecole.dev',     password: 'Test1234!', label: 'Chloé Bonnet (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000002', email: 'rayan.benali@hub-ecole.dev',     password: 'Test1234!', label: 'Rayan Benali (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000003', email: 'manon.dubois@hub-ecole.dev',     password: 'Test1234!', label: 'Manon Dubois (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000004', email: 'theo.lambert@hub-ecole.dev',     password: 'Test1234!', label: 'Théo Lambert (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000005', email: 'zoe.marchand@hub-ecole.dev',     password: 'Test1234!', label: 'Zoé Marchand (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000006', email: 'alex.moreau@hub-ecole.dev',      password: 'Test1234!', label: 'Alexandre Moreau (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000007', email: 'clara.simon@hub-ecole.dev',      password: 'Test1234!', label: 'Clara Simon (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000008', email: 'nassim.bouzidi@hub-ecole.dev',   password: 'Test1234!', label: 'Nassim Bouzidi (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000009', email: 'lea.garcia@hub-ecole.dev',       password: 'Test1234!', label: 'Léa Garcia (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000010', email: 'kevin.pham@hub-ecole.dev',       password: 'Test1234!', label: 'Kevin Pham (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000011', email: 'oceane.leroy@hub-ecole.dev',     password: 'Test1234!', label: 'Océane Leroy (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000012', email: 'mehdi.kaddour@hub-ecole.dev',    password: 'Test1234!', label: 'Mehdi Kaddour (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000013', email: 'juliette.fabre@hub-ecole.dev',   password: 'Test1234!', label: 'Juliette Fabre (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000014', email: 'louis.bertrand@hub-ecole.dev',   password: 'Test1234!', label: 'Louis Bertrand (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000015', email: 'aya.el-idrissi@hub-ecole.dev',   password: 'Test1234!', label: 'Aya El Idrissi (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000016', email: 'maxence.roger@hub-ecole.dev',    password: 'Test1234!', label: 'Maxence Roger (SLAM2)' },
  { id: '1a020000-0000-0000-0000-000000000017', email: 'laura.chevalier@hub-ecole.dev',  password: 'Test1234!', label: 'Laura Chevalier (SLAM2)' },

  // ══════════════════════════════════════════════════════════════
  // BTS SIO SLAM 1ère année — 20 élèves
  // ══════════════════════════════════════════════════════════════
  { id: '1a010000-0000-0000-0000-000000000001', email: 'camille.renard@hub-ecole.dev',    password: 'Test1234!', label: 'Camille Renard (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000002', email: 'tom.lefevre@hub-ecole.dev',       password: 'Test1234!', label: 'Tom Lefèvre (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000003', email: 'ines.moretti@hub-ecole.dev',      password: 'Test1234!', label: 'Inès Moretti (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000004', email: 'baptiste.lemaire@hub-ecole.dev',  password: 'Test1234!', label: 'Baptiste Lemaire (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000005', email: 'lucie.martin@hub-ecole.dev',      password: 'Test1234!', label: 'Lucie Martin (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000006', email: 'alexis.gauthier@hub-ecole.dev',   password: 'Test1234!', label: 'Alexis Gauthier (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000007', email: 'jade.perrin@hub-ecole.dev',       password: 'Test1234!', label: 'Jade Perrin (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000008', email: 'mathieu.simon@hub-ecole.dev',     password: 'Test1234!', label: 'Mathieu Simon (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000009', email: 'elisa.nguyen@hub-ecole.dev',      password: 'Test1234!', label: 'Elisa Nguyen (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000010', email: 'dylan.beaumont@hub-ecole.dev',    password: 'Test1234!', label: 'Dylan Beaumont (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000011', email: 'sarah.delattre@hub-ecole.dev',    password: 'Test1234!', label: 'Sarah Delattre (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000012', email: 'nolan.henry@hub-ecole.dev',       password: 'Test1234!', label: 'Nolan Henry (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000013', email: 'amina.diallo@hub-ecole.dev',      password: 'Test1234!', label: 'Amina Diallo (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000014', email: 'gabriel.roux@hub-ecole.dev',      password: 'Test1234!', label: 'Gabriel Roux (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000015', email: 'margaux.baron@hub-ecole.dev',     password: 'Test1234!', label: 'Margaux Baron (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000016', email: 'adam.lecorre@hub-ecole.dev',      password: 'Test1234!', label: 'Adam Le Corre (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000017', email: 'lina.toure@hub-ecole.dev',        password: 'Test1234!', label: 'Lina Touré (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000018', email: 'robin.picard@hub-ecole.dev',      password: 'Test1234!', label: 'Robin Picard (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000019', email: 'celia.muller@hub-ecole.dev',      password: 'Test1234!', label: 'Célia Müller (SLAM1)' },
  { id: '1a010000-0000-0000-0000-000000000020', email: 'yassine.chaker@hub-ecole.dev',    password: 'Test1234!', label: 'Yassine Chaker (SLAM1)' },

  // ══════════════════════════════════════════════════════════════
  // BTS SIO SISR 1ère année — 20 élèves
  // ══════════════════════════════════════════════════════════════
  { id: '1b010000-0000-0000-0000-000000000001', email: 'julien.canet@hub-ecole.dev',      password: 'Test1234!', label: 'Julien Canet (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000002', email: 'laura.vidal@hub-ecole.dev',       password: 'Test1234!', label: 'Laura Vidal (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000003', email: 'kevin.tissier@hub-ecole.dev',     password: 'Test1234!', label: 'Kevin Tissier (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000004', email: 'ambre.leclerc@hub-ecole.dev',     password: 'Test1234!', label: 'Ambre Leclerc (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000005', email: 'quentin.morel@hub-ecole.dev',     password: 'Test1234!', label: 'Quentin Morel (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000006', email: 'pauline.gros@hub-ecole.dev',      password: 'Test1234!', label: 'Pauline Gros (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000007', email: 'dylan.meyer@hub-ecole.dev',       password: 'Test1234!', label: 'Dylan Meyer (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000008', email: 'anais.roy@hub-ecole.dev',         password: 'Test1234!', label: 'Anaïs Roy (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000009', email: 'samuel.pires@hub-ecole.dev',      password: 'Test1234!', label: 'Samuel Pires (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000010', email: 'eva.morin@hub-ecole.dev',         password: 'Test1234!', label: 'Eva Morin (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000011', email: 'remi.carpentier@hub-ecole.dev',   password: 'Test1234!', label: 'Rémi Carpentier (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000012', email: 'leila.bensaid@hub-ecole.dev',     password: 'Test1234!', label: 'Leïla Bensaïd (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000013', email: 'hugo.ferreira@hub-ecole.dev',     password: 'Test1234!', label: 'Hugo Ferreira (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000014', email: 'nina.lambert@hub-ecole.dev',      password: 'Test1234!', label: 'Nina Lambert (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000015', email: 'antonin.prevost@hub-ecole.dev',   password: 'Test1234!', label: 'Antonin Prévost (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000016', email: 'maeva.durand@hub-ecole.dev',      password: 'Test1234!', label: 'Maéva Durand (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000017', email: 'florian.becker@hub-ecole.dev',    password: 'Test1234!', label: 'Florian Becker (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000018', email: 'yasmine.ait@hub-ecole.dev',       password: 'Test1234!', label: 'Yasmine Aït Ahmed (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000019', email: 'ethan.girault@hub-ecole.dev',     password: 'Test1234!', label: 'Ethan Girault (SISR1)' },
  { id: '1b010000-0000-0000-0000-000000000020', email: 'salome.vernet@hub-ecole.dev',     password: 'Test1234!', label: 'Salomé Vernet (SISR1)' },

  // ══════════════════════════════════════════════════════════════
  // BTS SIO SISR 2ème année — 20 élèves
  // ══════════════════════════════════════════════════════════════
  { id: '1b020000-0000-0000-0000-000000000001', email: 'nicolas.faure@hub-ecole.dev',      password: 'Test1234!', label: 'Nicolas Faure (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000002', email: 'margot.bourgeois@hub-ecole.dev',   password: 'Test1234!', label: 'Margot Bourgeois (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000003', email: 'antoine.chevallier@hub-ecole.dev', password: 'Test1234!', label: 'Antoine Chevallier (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000004', email: 'sarah.giraud@hub-ecole.dev',       password: 'Test1234!', label: 'Sarah Giraud (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000005', email: 'maxime.rolland@hub-ecole.dev',     password: 'Test1234!', label: 'Maxime Rolland (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000006', email: 'emilie.blanc@hub-ecole.dev',       password: 'Test1234!', label: 'Émilie Blanc (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000007', email: 'pierre.colin@hub-ecole.dev',       password: 'Test1234!', label: 'Pierre Colin (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000008', email: 'lea.fontaine@hub-ecole.dev',       password: 'Test1234!', label: 'Léa Fontaine (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000009', email: 'thomas.delorme@hub-ecole.dev',     password: 'Test1234!', label: 'Thomas Delorme (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000010', email: 'charlotte.morel@hub-ecole.dev',    password: 'Test1234!', label: 'Charlotte Morel (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000011', email: 'axel.barbier@hub-ecole.dev',       password: 'Test1234!', label: 'Axel Barbier (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000012', email: 'marie.caron@hub-ecole.dev',        password: 'Test1234!', label: 'Marie Caron (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000013', email: 'dorian.legrand@hub-ecole.dev',     password: 'Test1234!', label: 'Dorian Legrand (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000014', email: 'justine.roussel@hub-ecole.dev',    password: 'Test1234!', label: 'Justine Roussel (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000015', email: 'vincent.maillard@hub-ecole.dev',   password: 'Test1234!', label: 'Vincent Maillard (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000016', email: 'elise.tanguy@hub-ecole.dev',       password: 'Test1234!', label: 'Élise Tanguy (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000017', email: 'mat.ribeiro@hub-ecole.dev',        password: 'Test1234!', label: 'Mathis Ribeiro (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000018', email: 'chloe.vasseur@hub-ecole.dev',      password: 'Test1234!', label: 'Chloé Vasseur (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000019', email: 'benjamin.lopes@hub-ecole.dev',     password: 'Test1234!', label: 'Benjamin Lopes (SISR2)' },
  { id: '1b020000-0000-0000-0000-000000000020', email: 'pauline.david@hub-ecole.dev',      password: 'Test1234!', label: 'Pauline David (SISR2)' },
];

async function main() {
  console.log(`=== seed-users.mjs — Création de ${USERS.length} comptes ===\n`);

  let created = 0, errors = 0;

  for (const u of USERS) {
    process.stdout.write(`→ ${u.email.padEnd(48)} … `);

    const { data: existing } = await supabase.auth.admin.getUserById(u.id);
    if (existing?.user) {
      await supabase.auth.admin.deleteUser(u.id);
      process.stdout.write('(nettoyé) ');
    }

    const { data, error } = await supabase.auth.admin.createUser({
      // @ts-ignore
      id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.log(`✗ ${error?.message}`);
      errors++;
    } else {
      console.log(`✓  ${u.label}`);
      created++;
    }
  }

  console.log(`\n=== ${created} comptes créés, ${errors} erreurs ===`);
  console.log('\nLancez maintenant seed.sql :');
  console.log('  supabase db query --linked -f supabase/seed.sql\n');

  console.log('Comptes principaux (testables) :');
  const mains = [
    'admin@hub-ecole.dev', 'coordinateur@hub-ecole.dev', 'staff@hub-ecole.dev',
    'prof@hub-ecole.dev', 'prof2@hub-ecole.dev', 'fontaine@hub-ecole.dev',
    'martinez@hub-ecole.dev', 'noel@hub-ecole.dev',
    'etudiant@hub-ecole.dev', 'etudiant2@hub-ecole.dev', 'etudiant3@hub-ecole.dev',
    'entreprise@hub-ecole.dev', 'entreprise2@hub-ecole.dev',
  ];
  for (const email of mains) {
    const u = USERS.find(x => x.email === email);
    if (u) console.log(`  ${u.email.padEnd(48)} / ${u.password}  — ${u.label}`);
  }
}

main().catch(console.error);
