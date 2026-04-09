'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { revalidatePath } from 'next/cache';
import type { RolePrincipal } from '@/modules/auth/types';

export interface UserRow {
  id: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
  extra?: string; // type_parcours / fonction / entreprise
  matieres?: string[]; // pour les professeurs
  role_secondaire?: string; // pour élève, professeur, admin
  created_at: string;
}

async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (profile?.role !== 'admin') throw new Error('Accès refusé.');
  return profile;
}

export async function getAllUsers(): Promise<UserRow[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: roles } = await admin.from('user_roles').select('id, role');
  if (!roles) return [];

  const [{ data: students }, { data: teachers }, { data: admins }, { data: companies }] = await Promise.all([
    admin.from('student_profiles').select('id, nom, prenom, type_parcours, role_secondaire'),
    admin.from('teacher_profiles').select('id, nom, prenom, matieres_enseignees, role_secondaire'),
    admin.from('admin_profiles').select('id, nom, prenom, fonction, role_secondaire'),
    admin.from('company_profiles').select('id, nom, prenom, entreprise'),
  ]);

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) emailMap.set(u.id, u.email ?? '');

  const profileMap = new Map<string, { nom: string; prenom: string; extra?: string; matieres?: string[]; role_secondaire?: string }>();
  for (const s of students ?? []) profileMap.set(s.id, { nom: s.nom, prenom: s.prenom, extra: s.type_parcours, role_secondaire: s.role_secondaire ?? undefined });
  for (const t of teachers ?? []) profileMap.set(t.id, { nom: t.nom, prenom: t.prenom, matieres: t.matieres_enseignees ?? [], role_secondaire: t.role_secondaire ?? undefined });
  for (const a of admins ?? []) profileMap.set(a.id, { nom: a.nom, prenom: a.prenom, extra: a.fonction ?? '', role_secondaire: a.role_secondaire ?? undefined });
  for (const c of companies ?? []) profileMap.set(c.id, { nom: c.nom, prenom: c.prenom, extra: c.entreprise });

  return roles.map((r) => {
    const p = profileMap.get(r.id);
    const authU = authUsers?.users.find((u) => u.id === r.id);
    return {
      id: r.id,
      email: emailMap.get(r.id) ?? '—',
      role: r.role,
      nom: p?.nom ?? '—',
      prenom: p?.prenom ?? '—',
      extra: p?.extra,
      matieres: p?.matieres,
      role_secondaire: p?.role_secondaire,
      created_at: authU?.created_at ?? '',
    };
  });
}

export async function deleteUser(userId: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: 'Erreur lors de la suppression.' };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

// ─── Création de compte par l'admin ──────────────────────────────────────────

export async function createUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  const admin = createAdminClient();

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const role = formData.get('role') as RolePrincipal;
  const nom = (formData.get('nom') as string)?.trim();
  const prenom = (formData.get('prenom') as string)?.trim();

  if (!email || !password || !role || !nom || !prenom) {
    return { error: 'Tous les champs obligatoires doivent être remplis.' };
  }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }

  // Créer le compte auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmé directement par l'admin
  });

  if (authError || !authData.user) {
    if (authError?.message.includes('already registered') || authError?.message.includes('already been registered')) {
      return { error: 'Cet email est déjà utilisé.' };
    }
    return { error: 'Impossible de créer le compte : ' + (authError?.message ?? 'erreur inconnue') };
  }

  const userId = authData.user.id;

  // Insérer le rôle
  const { error: roleError } = await admin.from('user_roles').insert({ id: userId, role });
  if (roleError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: 'Erreur lors de la création du rôle.' };
  }

  // Insérer le profil selon le rôle
  let profileError = null;

  if (role === 'eleve') {
    const type_parcours = (formData.get('type_parcours') as string) || 'temps_plein';
    const { error } = await admin.from('student_profiles').insert({ id: userId, nom, prenom, type_parcours });
    profileError = error;
  } else if (role === 'professeur') {
    const matieresRaw = (formData.get('matieres_enseignees') as string) || '';
    const matieres = matieresRaw.split(',').map((m) => m.trim()).filter(Boolean);
    const { error } = await admin.from('teacher_profiles').insert({ id: userId, nom, prenom, matieres_enseignees: matieres });
    profileError = error;
  } else if (role === 'admin') {
    const fonction = (formData.get('fonction') as string) || '';
    const { error } = await admin.from('admin_profiles').insert({ id: userId, nom, prenom, fonction });
    profileError = error;
  } else if (role === 'entreprise') {
    const entreprise = (formData.get('entreprise') as string) || '';
    const poste = (formData.get('poste') as string) || '';
    const { error } = await admin.from('company_profiles').insert({ id: userId, nom, prenom, entreprise, poste });
    profileError = error;
  }

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: 'Erreur lors de la création du profil.' };
  }

  revalidatePath('/dashboard/admin');
  return { success: true };
}

// ─── Édition de profil par l'admin ───────────────────────────────────────────

export async function updateUserProfile(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  const admin = createAdminClient();

  const userId = formData.get('user_id') as string;
  const role = formData.get('role') as RolePrincipal;
  const nom = (formData.get('nom') as string)?.trim();
  const prenom = (formData.get('prenom') as string)?.trim();

  if (!userId || !role || !nom || !prenom) {
    return { error: 'Données manquantes.' };
  }

  let error = null;

  if (role === 'eleve') {
    const type_parcours = formData.get('type_parcours') as string;
    const role_secondaire = (formData.get('role_secondaire') as string) || null;
    const { error: e } = await admin
      .from('student_profiles')
      .update({ nom, prenom, type_parcours, role_secondaire })
      .eq('id', userId);
    error = e;
  } else if (role === 'professeur') {
    const matieresRaw = (formData.get('matieres_enseignees') as string) || '';
    const matieres = matieresRaw.split(',').map((m) => m.trim()).filter(Boolean);
    const role_secondaire = (formData.get('role_secondaire') as string) || null;
    const { error: e } = await admin
      .from('teacher_profiles')
      .update({ nom, prenom, matieres_enseignees: matieres, role_secondaire })
      .eq('id', userId);
    error = e;
  } else if (role === 'admin') {
    const fonction = (formData.get('fonction') as string) || '';
    const role_secondaire = (formData.get('role_secondaire') as string) || null;
    const { error: e } = await admin
      .from('admin_profiles')
      .update({ nom, prenom, fonction, role_secondaire })
      .eq('id', userId);
    error = e;
  } else if (role === 'entreprise') {
    const entreprise = (formData.get('entreprise') as string) || '';
    const poste = (formData.get('poste') as string) || '';
    const { error: e } = await admin
      .from('company_profiles')
      .update({ nom, prenom, entreprise, poste })
      .eq('id', userId);
    error = e;
  }

  if (error) return { error: 'Erreur lors de la mise à jour du profil.' };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

// ─── Config tripartite ────────────────────────────────────────────────────────

export interface AlternantRow {
  id: string;
  nom: string;
  prenom: string;
  chat_id: string | null;
  referent_id: string | null;
  maitre_id: string | null;
  referent_nom: string | null;
  maitre_nom: string | null;
  classe_id: string | null;
  classe_nom: string | null;
}

export async function getAlternants(): Promise<AlternantRow[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: students } = await admin
    .from('student_profiles')
    .select('id, nom, prenom')
    .eq('type_parcours', 'alternant');

  if (!students) return [];

  const studentIds = students.map((s) => s.id);

  const [{ data: chats }, { data: memberships }] = await Promise.all([
    admin.from('tripartite_chats').select('id, student_id, referent_id, maitre_id'),
    studentIds.length > 0
      ? admin.from('class_members').select('student_id, class_id').in('student_id', studentIds).eq('is_current', true)
      : Promise.resolve({ data: [] }),
  ]);

  // Charger les noms de classes
  const classIds = [...new Set((memberships ?? []).map((m) => m.class_id))];
  const { data: classes } = classIds.length > 0
    ? await admin.from('classes').select('id, nom').in('id', classIds)
    : { data: [] };

  const referentIds = [...new Set(chats?.map((c) => c.referent_id) ?? [])];
  const maitrIds = [...new Set(chats?.map((c) => c.maitre_id) ?? [])];

  const [{ data: adminProfiles }, { data: companyProfiles }] = await Promise.all([
    referentIds.length > 0
      ? admin.from('admin_profiles').select('id, nom, prenom').in('id', referentIds)
      : Promise.resolve({ data: [] }),
    maitrIds.length > 0
      ? admin.from('company_profiles').select('id, nom, prenom').in('id', maitrIds)
      : Promise.resolve({ data: [] }),
  ]);

  const adminMap = new Map<string, string>();
  for (const a of adminProfiles ?? []) adminMap.set(a.id, `${a.prenom} ${a.nom}`);
  const companyMap = new Map<string, string>();
  for (const c of companyProfiles ?? []) companyMap.set(c.id, `${c.prenom} ${c.nom}`);
  const classMap = new Map<string, string>();
  for (const c of classes ?? []) classMap.set(c.id, c.nom);
  const membershipMap = new Map<string, string>();
  for (const m of memberships ?? []) membershipMap.set(m.student_id, m.class_id);

  return students.map((s) => {
    const chat = chats?.find((c) => c.student_id === s.id);
    const classeId = membershipMap.get(s.id) ?? null;
    return {
      id: s.id,
      nom: s.nom,
      prenom: s.prenom,
      chat_id: chat?.id ?? null,
      referent_id: chat?.referent_id ?? null,
      maitre_id: chat?.maitre_id ?? null,
      referent_nom: chat ? (adminMap.get(chat.referent_id) ?? null) : null,
      maitre_nom: chat ? (companyMap.get(chat.maitre_id) ?? null) : null,
      classe_id: classeId,
      classe_nom: classeId ? (classMap.get(classeId) ?? null) : null,
    };
  });
}

export async function createTripartiteChat(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  await requireAdmin();
  const studentId = formData.get('student_id') as string;
  const referentId = formData.get('referent_id') as string;
  const maitreId = formData.get('maitre_id') as string;

  if (!studentId || !referentId || !maitreId) {
    return { error: 'Veuillez sélectionner un référent et un maître d\'apprentissage.' };
  }

  const admin = createAdminClient();

  // Upsert sur student_id (UNIQUE constraint) — atomic, jamais de perte de données
  const { error } = await admin
    .from('tripartite_chats')
    .upsert(
      { student_id: studentId, referent_id: referentId, maitre_id: maitreId },
      { onConflict: 'student_id' }
    );

  if (error) return { error: 'Erreur : ' + error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function deleteTripartiteChat(chatId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('tripartite_chats').delete().eq('id', chatId);
  revalidatePath('/dashboard/admin');
}
