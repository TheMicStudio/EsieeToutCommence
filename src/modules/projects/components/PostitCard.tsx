'use client';

import { deletePostit } from '../actions';
import type { RetroPostit } from '../types';
import { X } from 'lucide-react';

interface PostitCardProps {
  postit: RetroPostit & { author_name?: string };
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function PostitCard({ postit, currentUserId, onDelete }: PostitCardProps) {
  async function handleDelete() {
    await deletePostit(postit.id);
    onDelete(postit.id);
  }

  return (
    <div className="group relative rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm">
      <p className="text-sm text-slate-700 leading-snug pr-5">{postit.content}</p>
      <p className="mt-2 text-[11px] text-slate-400">
        {postit.is_anonymous ? 'Anonyme' : postit.author_name ?? 'Inconnu'}
      </p>
      {postit.author_id === currentUserId && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Supprimer"
          className="absolute right-2 top-2 hidden rounded-lg p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 group-hover:flex transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
