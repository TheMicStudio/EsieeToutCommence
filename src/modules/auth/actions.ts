'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ActionState,
  AdminProfile,
  CompanyProfile,
  ParentProfile,
  RolePrincipal,
  StudentProfile,
  TeacherProfile,
  UserProfile,
} from './types';

// ─── Sign In ────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email ou mot de passe incorrect.' };
    }
    return { error: 'Une erreur est survenue. Réessayez.' };
  }

  redirect('/dashboard');
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

interface SignUpData {
  email: string;
  password: string;
  role: RolePrincipal;
  nom: string;
  prenom: string;
  // Élève
  type_parcours?: 'temps_plein' | 'alternant';
  // Prof
  matieres_enseignees?: string;
  // Admin
  fonction?: string;
  // Entreprise
  entreprise?: string;
  poste?: string;
}

export async function signUp(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const data: SignUpData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    role: formData.get('role') as RolePrincipal,
    nom: formData.get('nom') as string,
    prenom: formData.get('prenom') as string,
    type_parcours: (formData.get('type_parcours') as 'temps_plein' | 'alternant') || undefined,
    matieres_enseignees: (formData.get('matieres_enseignees') as string) || undefined,
    fonction: (formData.get('fonction') as string) || undefined,
    entreprise: (formData.get('entreprise') as string) || undefined,
    poste: (formData.get('poste') as string) || undefined,
  };

  if (!data.email || !data.password || !data.role || !data.nom || !data.prenom) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError || !authData.user) {
    if (authError?.message.includes('already registered')) {
      return { error: 'Cet email est déjà utilisé.' };
    }
    return { error: 'Impossible de créer le compte. Réessayez.' };
  }

  const userId = authData.user.id;

  // Insérer le rôle
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ id: userId, role: data.role });

  if (roleError) {
    return { error: 'Erreur lors de la création du profil.' };
  }

  // Insérer le profil selon le rôle
  let profileError = null;

  if (data.role === 'eleve') {
    const { error } = await supabase.from('student_profiles').insert({
      id: userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      type_parcours: data.type_parcours ?? 'temps_plein',
    });
    profileError = error;
  } else if (data.role === 'professeur') {
    const matieres = data.matieres_enseignees
      ? data.matieres_enseignees.split(',').map((m) => m.trim()).filter(Boolean)
      : [];
    const { error } = await supabase.from('teacher_profiles').insert({
      id: userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      matieres_enseignees: matieres,
    });
    profileError = error;
  } else if (data.role === 'admin') {
    const { error } = await supabase.from('admin_profiles').insert({
      id: userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      fonction: data.fonction,
    });
    profileError = error;
  } else if (data.role === 'entreprise') {
    const { error } = await supabase.from('company_profiles').insert({
      id: userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      entreprise: data.entreprise ?? '',
      poste: data.poste,
    });
    profileError = error;
  } else if (data.role === 'parent') {
    const { error } = await supabase.from('parent_profiles').insert({
      id: userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
    });
    profileError = error;
  }

  if (profileError) {
    return { error: 'Erreur lors de la création du profil métier.' };
  }

  redirect('/dashboard');
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

// ─── Get Current User Profile (API publique pour tous les modules) ────────────

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  // 1. Vérifier l'identité via le client anon (valide le JWT auprès d'Auth)
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  // 2. Lire les données avec le client admin (bypass RLS — safe car identité vérifiée)
  const admin = createAdminClient();

  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!userRole) return null;

  const role = userRole.role as RolePrincipal;

  if (role === 'eleve') {
    const { data } = await admin
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return null;
    return { role: 'eleve', profile: data as StudentProfile };
  }

  if (role === 'professeur') {
    const { data } = await admin
      .from('teacher_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return null;
    return { role: 'professeur', profile: data as TeacherProfile };
  }

  if (role === 'admin') {
    const { data } = await admin
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return null;
    return { role: 'admin', profile: data as AdminProfile };
  }

  if (role === 'entreprise') {
    const { data } = await admin
      .from('company_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return null;
    return { role: 'entreprise', profile: data as CompanyProfile };
  }

  if (role === 'parent') {
    const { data } = await admin
      .from('parent_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return null;
    return { role: 'parent', profile: data as ParentProfile };
  }

  return null;
}

// ─── Update Profile ──────────────────────────────────────────────────────────

export async function updateProfile(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    return { error: 'Non authentifié.' };
  }

  const { role, profile } = userProfile;
  const nom = formData.get('nom') as string;
  const prenom = formData.get('prenom') as string;
  const email = (formData.get('email') as string | null)?.trim() || undefined;
  const phone_mobile = (formData.get('phone_mobile') as string | null)?.trim() || undefined;
  const phone_fixed = (formData.get('phone_fixed') as string | null)?.trim() || undefined;

  if (!nom || !prenom) {
    return { error: 'Nom et prénom sont requis.' };
  }

  const phoneFields = {
    ...(phone_mobile !== undefined ? { phone_mobile } : {}),
    ...(phone_fixed !== undefined ? { phone_fixed } : {}),
  };

  let error = null;

  if (role === 'eleve') {
    const { error: e } = await supabase
      .from('student_profiles')
      .update({ nom, prenom, ...phoneFields })
      .eq('id', profile.id);
    error = e;
  } else if (role === 'professeur') {
    const matieres = (formData.get('matieres_enseignees') as string)
      ?.split(',').map((m) => m.trim()).filter(Boolean) ?? [];
    const { error: e } = await supabase
      .from('teacher_profiles')
      .update({ nom, prenom, matieres_enseignees: matieres, ...phoneFields })
      .eq('id', profile.id);
    error = e;
  } else if (role === 'admin') {
    const { error: e } = await supabase
      .from('admin_profiles')
      .update({ nom, prenom, fonction: formData.get('fonction') as string, ...phoneFields })
      .eq('id', profile.id);
    error = e;
  } else if (role === 'entreprise') {
    const { error: e } = await supabase
      .from('company_profiles')
      .update({
        nom,
        prenom,
        entreprise: formData.get('entreprise') as string,
        poste: formData.get('poste') as string,
        ...phoneFields,
      })
      .eq('id', profile.id);
    error = e;
  } else if (role === 'parent') {
    const { error: e } = await supabase
      .from('parent_profiles')
      .update({ nom, prenom, ...phoneFields })
      .eq('id', profile.id);
    error = e;
  }

  if (error) {
    return { error: 'Erreur lors de la mise à jour du profil.' };
  }

  return { success: true };
}

// ─── Changement d'email (flow séparé) ────────────────────────────────────────

export async function requestEmailChange(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const newEmail = (formData.get('new_email') as string)?.trim().toLowerCase();
  const confirmEmail = (formData.get('confirm_email') as string)?.trim().toLowerCase();

  if (!newEmail) return { error: 'Veuillez saisir une adresse e-mail.' };
  if (newEmail !== confirmEmail) return { error: 'Les deux adresses ne correspondent pas.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié.' };

  if (newEmail === user.email?.toLowerCase()) {
    return { error: 'C\'est déjà votre adresse e-mail actuelle.' };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return { error: 'Trop de demandes envoyées. Attendez quelques minutes avant de réessayer.' };
    }
    return { error: 'Impossible de changer l\'e-mail : ' + error.message };
  }

  return { success: true };
}
