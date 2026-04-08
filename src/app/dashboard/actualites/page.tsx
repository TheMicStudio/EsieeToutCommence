import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getNewsPosts } from '@/modules/news/actions';
import { PostCard } from '@/modules/news/components/PostCard';
import type { PostCategory } from '@/modules/news/types';
import { CATEGORY_LABELS } from '@/modules/news/types';

export const metadata = { title: 'Actualités — Hub École' };

const ALL_CATEGORIES = ['annonce', 'actu', 'evenement'] as PostCategory[];

interface ActualitesPageProps {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function ActualitesPage({ searchParams }: ActualitesPageProps) {
  const { categorie } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');

  const allPosts = await getNewsPosts();

  const activeCategory = ALL_CATEGORIES.includes(categorie as PostCategory)
    ? (categorie as PostCategory)
    : null;

  const posts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  const canCreate = profile.role === 'admin' || profile.role === 'professeur';
  const isAdmin = profile.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Actualités</h1>
          <p className="mt-1 text-sm text-slate-500">Annonces, actualités et événements de l&apos;école</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/actualites/nouveau"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nouvelle publication
          </Link>
        )}
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/actualites"
          className={[
            'rounded-xl border px-4 py-1.5 text-sm font-medium transition-all',
            !activeCategory
              ? 'border-[#0471a6] bg-[#0471a6] text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Tout
        </Link>
        {ALL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/dashboard/actualites?categorie=${cat}`}
            className={[
              'rounded-xl border px-4 py-1.5 text-sm font-medium transition-all',
              activeCategory === cat
                ? 'border-[#0471a6] bg-[#0471a6] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

      {/* Fil */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canManage={canCreate && (isAdmin || post.author_id === profile.profile.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">
            {activeCategory ? `Aucune publication dans cette catégorie.` : 'Aucune publication pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
}
