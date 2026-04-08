/**
 * Seed script — crée les comptes de test via l'Admin API Supabase (GoTrue)
 * Usage : node scripts/seed-users.mjs
 *
 * Ce script DOIT être exécuté AVANT seed.sql.
 * Il crée les utilisateurs avec des UUIDs fixes via l'API admin (pas via SQL direct),
 * ce qui garantit que GoTrue initialise tous les champs requis correctement.
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

// UUIDs fixes pour correspondre aux données du seed.sql
const USERS = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'etudiant@hub-ecole.dev',     password: 'Test1234!' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'etudiant2@hub-ecole.dev',    password: 'Test1234!' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'etudiant3@hub-ecole.dev',    password: 'Test1234!' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'prof@hub-ecole.dev',         password: 'Test1234!' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'prof2@hub-ecole.dev',        password: 'Test1234!' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'admin@hub-ecole.dev',        password: 'Test1234!' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'coordinateur@hub-ecole.dev', password: 'Test1234!' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'staff@hub-ecole.dev',        password: 'Test1234!' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'entreprise@hub-ecole.dev',   password: 'Test1234!' },
  { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', email: 'entreprise2@hub-ecole.dev',  password: 'Test1234!' },
];

async function main() {
  console.log('=== seed-users.mjs — Création des comptes de test ===\n');

  for (const u of USERS) {
    process.stdout.write(`→ ${u.email} … `);

    // 1. Supprimer le compte existant s'il y en a un (cascade supprime les données public.*)
    const { data: existing } = await supabase.auth.admin.getUserById(u.id);
    if (existing?.user) {
      await supabase.auth.admin.deleteUser(u.id);
      process.stdout.write('(supprimé) ');
    }

    // 2. Recréer via admin API avec l'UUID fixe — GoTrue gère tous les champs requis
    const { data, error } = await supabase.auth.admin.createUser({
      // @ts-ignore — le paramètre id est accepté par l'API Supabase
      id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.log(`✗ ERREUR: ${error?.message}`);
    } else {
      console.log(`✓ créé (id: ${data.user.id})`);
    }
  }

  console.log('\n=== Comptes créés. Lancez maintenant seed.sql pour les données. ===');
  console.log('  supabase db query --linked -f supabase/seed.sql\n');
  console.log('Comptes disponibles :');
  for (const u of USERS) {
    console.log(`  ${u.email.padEnd(32)} / ${u.password}`);
  }
}

main().catch(console.error);
