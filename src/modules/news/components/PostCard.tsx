'use client';

import { useState } from 'react';
import { Pin, Trash2, PinOff } from 'lucide-react';
import { deleteNewsPost, togglePinPost } from '../actions';
import { CATEGORY_COLORS, CATEGORY_LABELS, type NewsPost } from '../types';

interface PostCardProps {
  post: NewsPost;
  canManage: boolean;
  isAdmin: boolean;
}

export function PostCard({ post, canManage, isAdmin }: PostCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  async function handleDelete() {
    if (!confirm('Supprimer cette publication ?')) return;
    setDeleting(true);
    await deleteNewsPost(post.id);
    setDeleted(true);
  }

  async function handlePin() {
    setPinning(true);
    await togglePinPost(post.id, !post.pinned);
    setPinning(false);
  }

  const categoryColor = CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-500';
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  // Tronquer le contenu à 3 lignes ~200 chars
  const excerpt = post.content.length > 220 ? post.content.slice(0, 220) + '…' : post.content;

  return (
    <article className={[
      'rounded-3xl border bg-white p-5 shadow-card transition-all hover:shadow-md hover:-translate-y-0.5',
      post.pinned ? 'border-[#0471a6]/30' : 'border-slate-200/70',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={['rounded-full px-2.5 py-0.5 text-[11px] font-semibold', categoryColor].join(' ')}>
            {categoryLabel}
          </span>
          {post.pinned && (
            <span className="flex items-center gap-1 rounded-full bg-[#0471a6]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0471a6]">
              <Pin className="h-3 w-3" />
              Épinglé
            </span>
          )}
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            {isAdmin && (
              <button
                type="button"
                onClick={handlePin}
                disabled={pinning}
                title={post.pinned ? 'Désépingler' : 'Épingler'}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#0471a6] transition-colors disabled:opacity-50"
              >
                {post.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Supprimer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <h2 className="mt-3 text-base font-semibold text-[#061826] leading-snug">{post.title}</h2>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed whitespace-pre-line">{excerpt}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-500">{post.author_name}</span>
        <span>·</span>
        <span>
          {new Date(post.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </article>
  );
}
