'use client';

import { deletePostit } from '../actions';
import type { RetroPostit } from '../types';

interface PostitCardProps {
  postit: RetroPostit;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function PostitCard({ postit, currentUserId, onDelete }: PostitCardProps) {
  async function handleDelete() {
    await deletePostit(postit.id);
    onDelete(postit.id);
  }

  return (
    <div className="group relative rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-sm">{postit.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {postit.is_anonymous ? 'Anonyme' : postit.author_name}
      </p>
      {postit.author_id === currentUserId && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Supprimer"
          className="absolute right-2 top-2 hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
        >
          ✕
        </button>
      )}
    </div>
  );
}
