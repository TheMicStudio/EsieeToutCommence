import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Newspaper } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getNewsPosts } from '@/modules/news/actions';
import { PostCard } from '@/modules/news/components/PostCard';
import { NewPostModal } from '@/modules/news/components/NewPostModal';
import type { PostCategory } from '@/modules/news/types';
import { CATEGORY_LABELS } from '@/modules/news/types';

export const metadata = { title: 'Actualités — EsieeToutCommence' };

const ALL_CATEGORIES = ['annonce', 'actu', 'evenement'] as PostCategory[];

interface ActualitesPageProps {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function ActualitesPage({ searchParams }: ActualitesPageProps) {
  await requirePermission('news.read');
  const perms = await getRequestPermissions();
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

  const canCreate = perms.has('news.write');
  const isAdmin = perms.has('news.moderate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0471a6]/10">
              <Newspaper className="h-5 w-5 text-[#0471a6]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061826]">Actualités</h1>
              <p className="mt-0.5 text-sm text-slate-500">Annonces, actualités et événements de l&apos;école</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-600">
              {allPosts.length} publication{allPosts.length > 1 ? 's' : ''}
            </span>
            {canCreate && <NewPostModal isAdmin={isAdmin} />}
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/actualites"
            className={[
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              !activeCategory
                ? 'bg-[#0471a6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
            ].join(' ')}
          >
            Tout
          </Link>
          {ALL_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/dashboard/actualites?categorie=${cat}`}
              className={[
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                activeCategory === cat
                  ? 'bg-[#0471a6] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
              ].join(' ')}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>
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
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white">
          <Newspaper className="h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">
            {activeCategory ? `Aucune publication dans cette catégorie.` : 'Aucune publication pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
}
