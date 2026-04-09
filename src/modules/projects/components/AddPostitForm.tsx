'use client';

import { useState } from 'react';
import { addPostit } from '../actions';
import type { PostitType } from '../types';
import { ThumbsUp, ThumbsDown, Lightbulb, Plus } from 'lucide-react';

const TYPES: { value: PostitType; label: string; active: string; inactive: string }[] = [
  { value: 'POSITIVE', label: 'J\'ai aimé', active: 'bg-emerald-100 text-emerald-700 border-emerald-300', inactive: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' },
  { value: 'NEGATIVE', label: 'Pas aimé', active: 'bg-red-100 text-red-600 border-red-300', inactive: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' },
  { value: 'IDEA', label: 'Idée', active: 'bg-amber-100 text-amber-700 border-amber-300', inactive: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' },
];

interface AddPostitFormProps {
  boardId: string;
  isOpen: boolean;
  authorName: string;
  currentUserId: string;
  onAdd: (postit: { id: string; type: PostitType; content: string; is_anonymous: boolean; author_id: string; author_name: string; board_id: string; created_at: string }) => void;
}

export function AddPostitForm({ boardId, isOpen, authorName, currentUserId, onAdd }: Readonly<AddPostitFormProps>) {
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
    // Mise à jour optimiste immédiate
    if (result.postit) {
      onAdd({
        ...result.postit,
        author_name: isAnonymous ? 'Anonyme' : authorName,
      });
    }
    setContent('');
  }

  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-400">Le mur de rétro est fermé.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ajouter un post-it</p>
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${type === t.value ? t.active : t.inactive}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Votre commentaire…"
        required
        className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all resize-none"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-slate-300"
          />{' '}
          Anonyme
        </label>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          {loading ? '…' : 'Ajouter'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
