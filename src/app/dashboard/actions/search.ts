'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';

export type SearchResult = {
  id: string;
  type: 'personne' | 'actualite' | 'cours' | 'offre';
  label: string;
  sublabel?: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return [];

  const admin = createAdminClient();
  const like = `%${q}%`;
  const results: SearchResult[] = [];

  // ── Personnes ──────────────────────────────────────────────────────────────
  const [{ data: students }, { data: teachers }, { data: admins }, { data: companies }] =
    await Promise.all([
      admin.from('student_profiles').select('id, prenom, nom, email').or(`prenom.ilike.${like},nom.ilike.${like},email.ilike.${like}`).limit(4),
      admin.from('teacher_profiles').select('id, prenom, nom, email').or(`prenom.ilike.${like},nom.ilike.${like},email.ilike.${like}`).limit(3),
      admin.from('admin_profiles').select('id, prenom, nom, fonction').or(`prenom.ilike.${like},nom.ilike.${like}`).limit(3),
      admin.from('company_profiles').select('id, prenom, nom, entreprise').or(`prenom.ilike.${like},nom.ilike.${like},entreprise.ilike.${like}`).limit(3),
    ]);

  for (const p of students ?? []) {
    results.push({ id: p.id, type: 'personne', label: `${p.prenom} ${p.nom}`, sublabel: p.email ?? 'Élève', href: '/dashboard/annuaire' });
  }
  for (const p of teachers ?? []) {
    results.push({ id: p.id, type: 'personne', label: `${p.prenom} ${p.nom}`, sublabel: p.email ?? 'Professeur', href: '/dashboard/annuaire' });
  }
  for (const p of admins ?? []) {
    results.push({ id: p.id, type: 'personne', label: `${p.prenom} ${p.nom}`, sublabel: p.fonction ?? 'Administration', href: '/dashboard/annuaire' });
  }
  for (const p of companies ?? []) {
    results.push({ id: p.id, type: 'personne', label: `${p.prenom} ${p.nom}`, sublabel: p.entreprise ?? 'Entreprise', href: '/dashboard/annuaire' });
  }

  // ── Actualités ─────────────────────────────────────────────────────────────
  const { data: posts } = await admin
    .from('news_posts')
    .select('id, title, category')
    .or(`title.ilike.${like},content.ilike.${like}`)
    .limit(4);

  for (const p of posts ?? []) {
    results.push({ id: p.id, type: 'actualite', label: p.title, sublabel: p.category, href: '/dashboard/actualites' });
  }

  // ── Cours ──────────────────────────────────────────────────────────────────
  const { data: materials } = await admin
    .from('course_materials')
    .select('id, titre, matiere')
    .or(`titre.ilike.${like},matiere.ilike.${like}`)
    .limit(4);

  for (const m of materials ?? []) {
    results.push({ id: m.id, type: 'cours', label: m.titre, sublabel: m.matiere, href: '/dashboard/pedagogie/cours' });
  }

  // ── Offres d'emploi ────────────────────────────────────────────────────────
  const { data: offers } = await admin
    .from('job_offers')
    .select('id, titre, entreprise')
    .or(`titre.ilike.${like},entreprise.ilike.${like}`)
    .eq('actif', true)
    .limit(3);

  for (const o of offers ?? []) {
    results.push({ id: o.id, type: 'offre', label: o.titre, sublabel: o.entreprise, href: '/dashboard/carriere/job-board' });
  }

  return results.slice(0, 12);
}
