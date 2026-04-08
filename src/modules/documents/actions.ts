'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type {
  ActionState,
  DocBreadcrumb,
  DocFile,
  DocFolder,
  DocPermission,
  DocPermissionLevel,
  DocSearchResult,
  DocShareLink,
  DocUser,
} from './types';

// ─── Guard interne ────────────────────────────────────────────────────────────

async function requireDocAccess() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  if (profile.role !== 'admin' && profile.role !== 'coordinateur') return null;
  return profile;
}

// ─── Dossiers ─────────────────────────────────────────────────────────────────

export async function getAllFolders(): Promise<DocFolder[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('doc_folders')
    .select('*')
    .order('name');
  return (data as DocFolder[]) ?? [];
}

export async function getFolderContents(folderId?: string): Promise<{
  folders: DocFolder[];
  files: DocFile[];
}> {
  const admin = createAdminClient();

  const foldersQuery = admin
    .from('doc_folders')
    .select('*')
    .order('name');

  const filesQuery = admin
    .from('doc_files')
    .select('*')
    .order('name');

  if (folderId) {
    foldersQuery.eq('parent_id', folderId);
    filesQuery.eq('folder_id', folderId);
  } else {
    foldersQuery.is('parent_id', null);
    // Pas de fichiers à la racine (les fichiers sont dans des dossiers)
    return {
      folders: ((await foldersQuery).data as DocFolder[]) ?? [],
      files: [],
    };
  }

  const [{ data: folders }, { data: files }] = await Promise.all([
    foldersQuery,
    filesQuery,
  ]);

  return {
    folders: (folders as DocFolder[]) ?? [],
    files: (files as DocFile[]) ?? [],
  };
}

export async function getBreadcrumb(folderId: string): Promise<DocBreadcrumb[]> {
  const admin = createAdminClient();
  const crumbs: DocBreadcrumb[] = [];
  let currentId: string | null = folderId;

  while (currentId && crumbs.length < 20) {
    const { data } = await admin
      .from('doc_folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .maybeSingle();
    if (!data) break;
    crumbs.unshift({ id: data.id, name: data.name });
    currentId = data.parent_id ?? null;
  }

  return crumbs;
}

export async function createFolder(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const name = (formData.get('name') as string)?.trim();
  const parentId = (formData.get('parent_id') as string) || null;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) return { error: 'Le nom du dossier est requis.' };

  const admin = createAdminClient();
  const { error } = await admin.from('doc_folders').insert({
    name,
    parent_id: parentId,
    description,
    created_by: profile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la création du dossier.' };

  revalidatePath('/dashboard/documents');
  if (parentId) revalidatePath(`/dashboard/documents/${parentId}`);
  return { success: true };
}

export async function renameFolder(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const folderId = formData.get('folder_id') as string;
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!folderId || !name) return { error: 'Données manquantes.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('doc_folders')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', folderId);

  if (error) return { error: 'Erreur lors de la modification.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

export async function deleteFolder(folderId: string): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const admin = createAdminClient();

  // Récupérer tous les fichiers dans le dossier (et sous-dossiers) pour les supprimer du storage
  const { data: files } = await admin
    .from('doc_files')
    .select('storage_path')
    .eq('folder_id', folderId);

  if (files && files.length > 0) {
    await admin.storage
      .from('documents')
      .remove(files.map((f) => f.storage_path));
  }

  // La suppression en cascade (ON DELETE CASCADE) s'occupe des sous-dossiers, fichiers, permissions, liens
  const { error } = await admin.from('doc_folders').delete().eq('id', folderId);
  if (error) return { error: 'Erreur lors de la suppression.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

// ─── Fichiers ──────────────────────────────────────────────────────────────────

export async function uploadFile(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const folderId = formData.get('folder_id') as string;
  const file = formData.get('file') as File;
  const description = (formData.get('description') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

  if (!folderId || !file || file.size === 0) {
    return { error: 'Dossier et fichier sont requis.' };
  }

  if (file.size > 50 * 1024 * 1024) {
    return { error: 'Le fichier dépasse 50 Mo.' };
  }

  const ext = file.name.split('.').pop() ?? '';
  const storagePath = `${folderId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });

  if (uploadError) return { error: `Erreur upload : ${uploadError.message}` };

  const admin = createAdminClient();
  const { error: dbError } = await admin.from('doc_files').insert({
    folder_id: folderId,
    name: file.name,
    description,
    tags,
    mime_type: file.type || null,
    size_bytes: file.size,
    storage_path: storagePath,
    uploaded_by: profile.profile.id,
  });

  if (dbError) {
    // Rollback storage
    await supabase.storage.from('documents').remove([storagePath]);
    return { error: 'Erreur lors de l\'enregistrement du fichier.' };
  }

  revalidatePath(`/dashboard/documents/${folderId}`);
  return { success: true };
}

export async function deleteFile(fileId: string): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const admin = createAdminClient();

  const { data: file } = await admin
    .from('doc_files')
    .select('storage_path, folder_id')
    .eq('id', fileId)
    .maybeSingle();

  if (!file) return { error: 'Fichier introuvable.' };

  await admin.storage.from('documents').remove([file.storage_path]);

  const { error } = await admin.from('doc_files').delete().eq('id', fileId);
  if (error) return { error: 'Erreur lors de la suppression.' };

  revalidatePath(`/dashboard/documents/${file.folder_id}`);
  return { success: true };
}

export async function getSignedDownloadUrl(fileId: string): Promise<{ url?: string; error?: string }> {
  // Vérifie l'auth mais n'exige pas forcément le rôle doc (les liens de partage publics utilisent une autre route)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié.' };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from('doc_files')
    .select('storage_path')
    .eq('id', fileId)
    .maybeSingle();

  if (!file) return { error: 'Fichier introuvable.' };

  const { data, error } = await admin.storage
    .from('documents')
    .createSignedUrl(file.storage_path, 3600); // 1h

  if (error || !data) return { error: 'Impossible de générer le lien.' };
  return { url: data.signedUrl };
}

// ─── Permissions dossier ──────────────────────────────────────────────────────

export async function getFolderPermissions(folderId: string): Promise<DocPermission[]> {
  const profile = await requireDocAccess();
  if (!profile) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from('doc_permissions')
    .select('*')
    .eq('folder_id', folderId)
    .order('granted_at');

  return (data as DocPermission[]) ?? [];
}

export async function setFolderPermission(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const folderId = formData.get('folder_id') as string;
  const roleTarget = (formData.get('role_target') as string) || null;
  const userTarget = (formData.get('user_target') as string) || null;
  const level = formData.get('level') as DocPermissionLevel;

  if (!folderId || !level || (!roleTarget && !userTarget)) {
    return { error: 'Données manquantes.' };
  }
  if (roleTarget && userTarget) {
    return { error: 'Choisissez un rôle OU un utilisateur, pas les deux.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('doc_permissions').insert({
    folder_id: folderId,
    role_target: roleTarget,
    user_target: userTarget,
    level,
    granted_by: profile.profile.id,
  });

  if (error) return { error: 'Erreur lors de l\'ajout de la permission.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

export async function removeFolderPermission(permissionId: string): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('doc_permissions')
    .delete()
    .eq('id', permissionId);

  if (error) return { error: 'Erreur lors de la suppression.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

// ─── Liens de partage ─────────────────────────────────────────────────────────

export async function getShareLinks(
  fileId?: string,
  folderId?: string
): Promise<DocShareLink[]> {
  const profile = await requireDocAccess();
  if (!profile) return [];

  const admin = createAdminClient();
  let query = admin.from('doc_share_links').select('*').order('created_at', { ascending: false });

  if (fileId) query = query.eq('file_id', fileId);
  else if (folderId) query = query.eq('folder_id', folderId);

  const { data } = await query;
  return (data as DocShareLink[]) ?? [];
}

export async function createShareLink(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const fileId = (formData.get('file_id') as string) || null;
  const folderId = (formData.get('folder_id') as string) || null;
  const label = (formData.get('label') as string)?.trim() || null;
  const expiresAt = (formData.get('expires_at') as string) || null;
  const maxUsesRaw = formData.get('max_uses') as string;
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null;

  if (!fileId && !folderId) return { error: 'Cible manquante.' };

  const admin = createAdminClient();
  const { error } = await admin.from('doc_share_links').insert({
    file_id: fileId,
    folder_id: folderId,
    label,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    max_uses: maxUses,
    created_by: profile.profile.id,
  });

  if (error) return { error: 'Erreur lors de la création du lien.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

export async function revokeShareLink(linkId: string): Promise<ActionState> {
  const profile = await requireDocAccess();
  if (!profile) return { error: 'Accès refusé.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('doc_share_links')
    .delete()
    .eq('id', linkId);

  if (error) return { error: 'Erreur lors de la révocation.' };

  revalidatePath('/dashboard/documents');
  return { success: true };
}

/**
 * Résout un lien de partage public (sans auth).
 * Retourne le fichier ou les fichiers du dossier partagé.
 */
export async function resolveShareLink(token: string): Promise<{
  link?: DocShareLink;
  file?: DocFile;
  folderFiles?: DocFile[];
  folderName?: string;
  error?: string;
}> {
  const admin = createAdminClient();

  const { data: link } = await admin
    .from('doc_share_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!link) return { error: 'Lien introuvable ou révoqué.' };

  // Vérifier expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: 'Ce lien a expiré.' };
  }

  // Vérifier quota d'utilisations
  if (link.max_uses !== null && link.uses_count >= link.max_uses) {
    return { error: 'Ce lien a atteint sa limite d\'utilisation.' };
  }

  // Incrémenter le compteur
  await admin
    .from('doc_share_links')
    .update({ uses_count: link.uses_count + 1 })
    .eq('id', link.id);

  if (link.file_id) {
    const { data: file } = await admin
      .from('doc_files')
      .select('*')
      .eq('id', link.file_id)
      .maybeSingle();
    if (!file) return { error: 'Fichier introuvable.' };
    return { link, file: file as DocFile };
  }

  if (link.folder_id) {
    const { data: folder } = await admin
      .from('doc_folders')
      .select('name')
      .eq('id', link.folder_id)
      .maybeSingle();

    const { data: files } = await admin
      .from('doc_files')
      .select('*')
      .eq('folder_id', link.folder_id)
      .order('name');

    return {
      link,
      folderName: folder?.name,
      folderFiles: (files as DocFile[]) ?? [],
    };
  }

  return { error: 'Lien invalide.' };
}

/**
 * Génère une URL signée pour un fichier (accessible sans auth — usage lien de partage).
 */
export async function getPublicSignedUrl(storagePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from('documents')
    .createSignedUrl(storagePath, 86400); // 24h pour les liens publics
  return data?.signedUrl ?? null;
}

// ─── Recherche ────────────────────────────────────────────────────────────────

export async function searchDocuments(query: string): Promise<DocSearchResult[]> {
  if (!query.trim()) return [];

  const profile = await requireDocAccess();
  if (!profile) return [];

  const admin = createAdminClient();
  const q = `%${query.trim()}%`;

  const [{ data: folders }, { data: files }] = await Promise.all([
    admin
      .from('doc_folders')
      .select('id, name, description, parent_id, created_at')
      .or(`name.ilike.${q},description.ilike.${q}`)
      .limit(20),
    admin
      .from('doc_files')
      .select('id, name, description, folder_id, mime_type, uploaded_at, tags')
      .or(`name.ilike.${q},description.ilike.${q}`)
      .limit(20),
  ]);

  const results: DocSearchResult[] = [
    ...((folders ?? []).map((f) => ({
      type: 'folder' as const,
      id: f.id,
      name: f.name,
      description: f.description,
      parent_id: f.parent_id,
      created_at: f.created_at,
    }))),
    ...((files ?? []).map((f) => ({
      type: 'file' as const,
      id: f.id,
      name: f.name,
      description: f.description,
      folder_id: f.folder_id,
      mime_type: f.mime_type,
      uploaded_at: f.uploaded_at,
    }))),
  ];

  return results;
}

// ─── Utilisateurs pour le sélecteur de permissions ───────────────────────────

export async function getDocumentUsers(): Promise<DocUser[]> {
  const profile = await requireDocAccess();
  if (!profile) return [];

  const admin = createAdminClient();

  const { data: roles } = await admin
    .from('user_roles')
    .select('id, role')
    .in('role', ['admin', 'coordinateur']);

  if (!roles || roles.length === 0) return [];

  const userIds = roles.map((r) => r.id);
  const roleMap: Record<string, string> = {};
  for (const r of roles) roleMap[r.id] = r.role;

  // Chercher dans admin_profiles + teacher_profiles
  const [{ data: admins }, { data: teachers }] = await Promise.all([
    admin
      .from('admin_profiles')
      .select('id, nom, prenom')
      .in('id', userIds),
    admin
      .from('teacher_profiles')
      .select('id, nom, prenom')
      .in('id', userIds),
  ]);

  const users: DocUser[] = [
    ...((admins ?? []).map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      role: roleMap[u.id] ?? 'admin',
    }))),
    ...((teachers ?? []).map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      role: roleMap[u.id] ?? 'coordinateur',
    }))),
  ];

  return users.sort((a, b) => a.nom.localeCompare(b.nom));
}
