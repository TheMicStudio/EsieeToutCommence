import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec la service role key — bypass RLS.
 * À utiliser UNIQUEMENT côté serveur, après vérification de l'identité via getUser().
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
