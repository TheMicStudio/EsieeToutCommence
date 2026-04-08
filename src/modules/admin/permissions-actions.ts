'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';

export type PermissionRow = {
  key: string;
  module: string;
  level: string;
  description: string;
};

export type RolePermissionMap = Record<string, Record<string, boolean>>;
// { role -> { permission_key -> enabled } }

/** Récupère la matrice complète permissions × rôles */
export async function getPermissionsMatrix(): Promise<{
  permissions: PermissionRow[];
  matrix: RolePermissionMap;
}> {
  const admin = createAdminClient();

  const [{ data: perms }, { data: rolePerms }] = await Promise.all([
    admin.from('permissions').select('*').order('module').order('key'),
    admin.from('role_permissions').select('role, permission_key, enabled'),
  ]);

  const matrix: RolePermissionMap = {};
  for (const rp of rolePerms ?? []) {
    if (!matrix[rp.role]) matrix[rp.role] = {};
    matrix[rp.role][rp.permission_key] = rp.enabled;
  }

  return {
    permissions: (perms ?? []) as PermissionRow[],
    matrix,
  };
}

/** Active ou désactive une permission pour un rôle */
export async function toggleRolePermission(
  role: string,
  permissionKey: string,
  enabled: boolean
): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') {
    return { error: 'Accès refusé.' };
  }

  // Protéger permission.manage pour admin
  if (role === 'admin' && permissionKey === 'permission.manage' && !enabled) {
    return { error: 'Impossible de retirer permission.manage au rôle admin.' };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('role_permissions')
    .upsert({ role, permission_key: permissionKey, enabled }, { onConflict: 'role,permission_key' });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin');
  return {};
}

/** Remet les permissions d'un rôle aux valeurs par défaut */
export async function resetRolePermissions(role: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') {
    return { error: 'Accès refusé.' };
  }

  const DEFAULTS: Record<string, string[]> = {
    eleve: ['news.read','directory.read','class.read','course_material.read','grade.read_own','project_week.read','project_group.read','project_group.participate','retro.participate','soutenance.read','soutenance.book','attendance.read_own','job.read','career_event.read','career_event.participate','alternance.access','support.use','profile.edit_own'],
    professeur: ['news.read','news.write','directory.read','class.read','course_material.read','course_material.write','grade.read_class','grade.manage','project_week.read','project_week.manage','project_group.read','project_group.manage','retro.participate','retro.moderate','soutenance.read','soutenance.manage','attendance.read_class','attendance.manage','job.read','career_event.read','alternance.validate','support.use','staff_channel.participate','profile.edit_own'],
    coordinateur: ['news.read','news.write','directory.read','directory.export','class.read','class.manage','course_material.read','course_material.write','course_material.moderate','grade.read_own','grade.read_class','grade.manage','project_week.read','project_week.manage','project_group.read','project_group.manage','retro.participate','retro.moderate','soutenance.read','soutenance.manage','attendance.read_own','attendance.read_class','attendance.manage','job.read','career_event.read','alternance.validate','support.use','staff_channel.participate','profile.edit_own'],
    staff: ['news.read','news.write','news.moderate','directory.read','directory.export','class.read','attendance.read_class','job.read','job.manage','career_event.read','career_event.manage','support.use','support.manage','staff_channel.participate','profile.edit_own'],
    admin: ['news.read','news.write','news.moderate','directory.read','directory.export','class.read','class.manage','course_material.read','course_material.write','course_material.moderate','grade.read_own','grade.read_class','grade.manage','project_week.read','project_week.manage','project_group.read','project_group.manage','retro.participate','retro.moderate','soutenance.read','soutenance.manage','attendance.read_own','attendance.read_class','attendance.manage','job.read','job.manage','career_event.read','career_event.manage','alternance.validate','support.use','support.manage','staff_channel.participate','staff_channel.manage','profile.edit_own','profile.manage_any','user.manage','permission.manage'],
    entreprise: ['news.read','job.read','career_event.read','alternance.access','alternance.validate','support.use','profile.edit_own'],
    parent: ['grade.read_own','attendance.read_own','support.use','profile.edit_own'],
  };

  const activeKeys = new Set(DEFAULTS[role] ?? []);
  const admin = createAdminClient();

  // Récupère toutes les permissions existantes
  const { data: allPerms } = await admin.from('permissions').select('key');
  const allKeys = (allPerms ?? []).map((p) => p.key);

  const rows = allKeys.map((key) => ({
    role,
    permission_key: key,
    enabled: activeKeys.has(key),
  }));

  const { error } = await admin
    .from('role_permissions')
    .upsert(rows, { onConflict: 'role,permission_key' });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin');
  return {};
}
