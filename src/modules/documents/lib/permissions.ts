import { createAdminClient } from '@/lib/supabase/admin';
import type { DocPermissionLevel } from '../types';

/**
 * Résout le niveau de permission effectif d'un utilisateur sur un dossier.
 * Remonte l'arborescence (dossier → parent → grand-parent…) jusqu'à trouver une règle.
 * Priorité : permission individuelle > permission par rôle.
 * Défaut si aucune règle : 'admin' (accès total pour les utilisateurs du module).
 */
export async function resolveFolderPermission(
  userId: string,
  userRole: string,
  folderId: string
): Promise<DocPermissionLevel> {
  const admin = createAdminClient();

  // Construire la chaîne d'ancêtres (dossier actuel + tous les parents)
  const ancestors: string[] = [];
  let currentId: string | null = folderId;

  while (currentId && ancestors.length < 20) {
    ancestors.push(currentId);
    const { data: folder }: { data: { parent_id: string | null } | null } = await admin
      .from('doc_folders')
      .select('parent_id')
      .eq('id', currentId)
      .maybeSingle() as { data: { parent_id: string | null } | null };
    currentId = folder?.parent_id ?? null;
  }

  // Chercher une règle du plus spécifique au plus général
  for (const id of ancestors) {
    const { data: perms } = await admin
      .from('doc_permissions')
      .select('*')
      .eq('folder_id', id);

    if (!perms || perms.length === 0) continue;

    // Permission individuelle (priorité maximale)
    const userPerm = perms.find((p) => p.user_target === userId);
    if (userPerm) return userPerm.level as DocPermissionLevel;

    // Permission par rôle
    const rolePerm = perms.find((p) => p.role_target === userRole);
    if (rolePerm) return rolePerm.level as DocPermissionLevel;
  }

  // Aucune règle : accès admin par défaut pour les utilisateurs du module (équipe de confiance)
  return 'admin';
}

export function canWrite(level: DocPermissionLevel): boolean {
  return level === 'write' || level === 'admin';
}

export function canAdmin(level: DocPermissionLevel): boolean {
  return level === 'admin';
}
