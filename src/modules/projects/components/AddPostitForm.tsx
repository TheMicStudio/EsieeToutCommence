'use client';

import { useState } from 'react';
import { addPostit } from '../actions';
import type { PostitType } from '../types';

const TYPE_LABELS: Record<PostitType, string> = {
  POSITIVE: 'J\'ai aimé ✓',
  NEGATIVE: 'Pas aimé ✗',
  IDEA: 'Idée 💡',
};

interface AddPostitFormProps {
  boardId: string;
  isOpen: boolean;
  onAdd: (postit: { id: string; type: PostitType; content: string; is_anonymous: boolean; author_id: string; author_name: string; board_id: string; created_at: string }) => void;
}

export function AddPostitForm({ boardId, isOpen, onAdd }: AddPostitFormProps) {
  const [type, setType] = useState<PostitType>('POSITIVE');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    const result = await addPostit(boardId, type, content.trim(), isAnonymous);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setContent('');
  }

  if (!isOpen) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Le mur de rétro est fermé.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex gap-2">
        {(Object.keys(TYPE_LABELS) as PostitType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Votre commentaire…"
        required
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          Anonyme
        </label>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Ajouter'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
