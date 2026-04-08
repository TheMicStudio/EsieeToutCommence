'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type { NewsPost, PostCategory } from './types';

// ── Lecture ──────────────────────────────────────────────────
export async function getNewsPosts(limit = 50): Promise<NewsPost[]> {
  const admin = createAdminClient();

  const { data: posts } = await admin
    .from('news_posts')
    .select()
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!posts || posts.length === 0) return [];

  // Résoudre les noms des auteurs
  const authorIds = [...new Set(posts.map((p) => p.author_id as string))];

  const [{ data: students }, { data: teachers }, { data: admins }] = await Promise.all([
    admin.from('student_profiles').select('id, nom, prenom').in('id', authorIds),
    admin.from('teacher_profiles').select('id, nom, prenom').in('id', authorIds),
    admin.from('admin_profiles').select('id, nom, prenom').in('id', authorIds),
  ]);

  const nameMap = new Map<string, string>();
  for (const p of students ?? []) nameMap.set(p.id, `${p.prenom} ${p.nom}`);
  for (const p of teachers ?? []) nameMap.set(p.id, `${p.prenom} ${p.nom}`);
  for (const p of admins ?? []) nameMap.set(p.id, `${p.prenom} ${p.nom}`);

  return posts.map((p) => ({
    ...p,
    category: p.category as PostCategory,
    author_name: nameMap.get(p.author_id) ?? 'Inconnu',
  }));
}

// ── Création ─────────────────────────────────────────────────
export async function createNewsPost(
  title: string,
  content: string,
  category: PostCategory,
  pinned: boolean,
  bannerUrl?: string | null,
): Promise<{ post?: NewsPost; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('news_posts')
    .insert({ title, content, category, pinned, author_id: user.id, banner_url: bannerUrl ?? null })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/actualites');
  revalidatePath('/dashboard');
  return { post: data as NewsPost };
}

// ── Pin / unpin ───────────────────────────────────────────────
export async function togglePinPost(
  postId: string,
  pinned: boolean,
): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || !['admin', 'professeur'].includes(userProfile.role)) {
    return { error: 'Non autorisé.' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('news_posts')
    .update({ pinned })
    .eq('id', postId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/actualites');
  revalidatePath('/dashboard');
  return {};
}

// ── Suppression ───────────────────────────────────────────────
export async function deleteNewsPost(postId: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const admin = createAdminClient();

  // Vérifier que l'utilisateur est admin ou auteur du post
  if (userProfile.role !== 'admin') {
    const { data: post } = await admin.from('news_posts').select('author_id').eq('id', postId).maybeSingle();
    if (!post || post.author_id !== userProfile.profile.id) {
      return { error: 'Non autorisé.' };
    }
  }

  const { error } = await admin.from('news_posts').delete().eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/actualites');
  revalidatePath('/dashboard');
  return {};
}
