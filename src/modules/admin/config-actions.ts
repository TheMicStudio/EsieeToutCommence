'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (profile?.role !== 'admin') throw new Error('Accès refusé.');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfigItem { id: string; nom: string }
export interface CategoryItem { id: string; slug: string; label: string }
export interface RoleItem { id: string; slug: string; label: string }

// ─── Matières ────────────────────────────────────────────────────────────────

export async function getSubjects(): Promise<ConfigItem[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('subjects').select('id, nom').order('nom');
  return (data as ConfigItem[]) ?? [];
}

export async function createSubject(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const nom = (formData.get('nom') as string)?.trim();
  if (!nom) return { error: 'Le nom est requis.' };

  const admin = createAdminClient();
  const { error } = await admin.from('subjects').insert({ nom });
  if (error) return { error: error.code === '23505' ? 'Cette matière existe déjà.' : error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteSubject(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('subjects').delete().eq('id', id);
  revalidatePath('/dashboard/admin');
}

// ─── Fonctions admin ──────────────────────────────────────────────────────────

export async function getAdminFunctions(): Promise<ConfigItem[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('admin_functions').select('id, nom').order('nom');
  return (data as ConfigItem[]) ?? [];
}

export async function createAdminFunction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const nom = (formData.get('nom') as string)?.trim();
  if (!nom) return { error: 'Le nom est requis.' };

  const admin = createAdminClient();
  const { error } = await admin.from('admin_functions').insert({ nom });
  if (error) return { error: error.code === '23505' ? 'Cette fonction existe déjà.' : error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteAdminFunction(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('admin_functions').delete().eq('id', id);
  revalidatePath('/dashboard/admin');
}

// ─── Catégories de tickets ────────────────────────────────────────────────────

export async function getTicketCategories(): Promise<CategoryItem[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('ticket_categories').select('id, slug, label').order('label');
  return (data as CategoryItem[]) ?? [];
}

export async function createTicketCategory(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const label = (formData.get('label') as string)?.trim();
  if (!label) return { error: 'Le libellé est requis.' };
  const slug = label.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').replaceAll(/[^a-z0-9]+/g, '_');

  const admin = createAdminClient();
  const { error } = await admin.from('ticket_categories').insert({ slug, label });
  if (error) return { error: error.code === '23505' ? 'Cette catégorie existe déjà.' : error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteTicketCategory(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('ticket_categories').delete().eq('id', id);
  revalidatePath('/dashboard/admin');
}

// ─── Rôles secondaires ────────────────────────────────────────────────────────

export async function getSecondaryRoles(): Promise<RoleItem[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('secondary_roles').select('id, slug, label').order('label');
  return (data as RoleItem[]) ?? [];
}

export async function createSecondaryRole(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const label = (formData.get('label') as string)?.trim();
  if (!label) return { error: 'Le libellé est requis.' };
  const slug = label.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').replaceAll(/[^a-z0-9]+/g, '_');

  const admin = createAdminClient();
  const { error } = await admin.from('secondary_roles').insert({ slug, label });
  if (error) return { error: error.code === '23505' ? 'Ce rôle existe déjà.' : error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteSecondaryRole(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('secondary_roles').delete().eq('id', id);
  revalidatePath('/dashboard/admin');
}
