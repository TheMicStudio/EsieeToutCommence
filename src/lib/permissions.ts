import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';

/**
 * Récupère toutes les permissions actives de l'utilisateur courant.
 * Wrappé dans cache() : une seule requête DB par render, peu importe
 * combien de pages/layouts l'appellent.
 */
export const getRequestPermissions = cache(async (): Promise<Set<string>> => {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return new Set();
  return getUserPermissions(userProfile.profile.id, userProfile.role);
});

/**
 * Récupère toutes les permissions actives d'un utilisateur par userId+role.
 */
export async function getUserPermissions(
  userId: string,
  role: string
): Promise<Set<string>> {
  const admin = createAdminClient();

  const [{ data: rolePerms }, { data: overrides }] = await Promise.all([
    admin
      .from('role_permissions')
      .select('permission_key, enabled')
      .eq('role', role),
    admin
      .from('user_permission_overrides')
      .select('permission_key, enabled')
      .eq('user_id', userId),
  ]);

  const active = new Set<string>();

  for (const rp of rolePerms ?? []) {
    if (rp.enabled) active.add(rp.permission_key);
  }

  for (const ov of overrides ?? []) {
    if (ov.enabled) {
      active.add(ov.permission_key);
    } else {
      active.delete(ov.permission_key);
    }
  }

  return active;
}

/**
 * Guard de page : redirige vers /dashboard si la permission manque.
 * À appeler en tête de chaque Server Component de page.
 */
export async function requirePermission(permission: string): Promise<void> {
  const perms = await getRequestPermissions();
  if (!perms.has(permission)) redirect('/dashboard');
}

/**
 * Vérifie si un utilisateur a une permission donnée (usage ponctuel).
 */
export async function can(
  userId: string,
  role: string,
  permission: string
): Promise<boolean> {
  const perms = await getUserPermissions(userId, role);
  return perms.has(permission);
}
