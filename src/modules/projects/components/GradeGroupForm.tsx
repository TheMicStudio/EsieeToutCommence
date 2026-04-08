'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gradeGroup } from '../actions';
import { Star, Check } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export function GradeGroupForm({ groupId, initialNote, initialFeedback }: {
  groupId: string;
  initialNote?: number;
  initialFeedback?: string;
}) {
  const [note, setNote] = useState(String(initialNote ?? ''));
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(note);
    if (isNaN(n) || n < 0 || n > 20) { setError('La note doit être entre 0 et 20'); return; }
    setLoading(true);
    setError('');
    const result = await gradeGroup(groupId, n, feedback);
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSuccess(true); router.refresh(); setTimeout(() => setSuccess(false), 3000); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className={labelCls}>Notation</p>
      <div className="flex gap-3">
        <div className="w-28">
          <label className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Star className="h-3.5 w-3.5" /> Note /20
          </label>
          <input
            type="number"
            min={0} max={20} step={0.5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="0–20"
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Points forts, axes d'amélioration…"
            className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all resize-none"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        {success ? <><Check className="h-4 w-4" /> Note enregistrée !</> : loading ? 'Enregistrement…' : 'Enregistrer la note'}
      </button>
    </form>
  );
}
