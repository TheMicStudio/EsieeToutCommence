'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gradeGroup } from '../actions';
import { Star, Check, X, ClipboardEdit } from 'lucide-react';

export function GradeGroupForm({ groupId, groupName, initialNote, initialFeedback }: {
  groupId: string;
  groupName: string;
  initialNote?: number;
  initialFeedback?: string;
}) {
  const [open, setOpen] = useState(false);
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
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 1500);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-4 py-2.5 text-sm font-semibold text-[#0471a6] hover:bg-[#0471a6]/10 transition-all"
      >
        <ClipboardEdit className="h-4 w-4" />
        {initialNote !== undefined && initialNote !== null ? `Modifier la note (${initialNote}/20)` : 'Attribuer une note'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0471a6]/10">
                  <Star className="h-4.5 w-4.5 text-[#0471a6]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Notation du groupe</h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{groupName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Note /20 *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0} max={20} step={0.5}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex : 14.5"
                    className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all"
                    required
                  />
                  {note && !isNaN(parseFloat(note)) && (
                    <span className="text-2xl font-bold text-[#0471a6]">
                      {parseFloat(note)}/20
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Feedback (optionnel)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Points forts, axes d'amélioration, commentaire général…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all resize-none"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                La note sera propagée automatiquement dans le carnet de notes de chaque membre du groupe (matière : Projet).
              </p>

              {error && <p className="text-xs text-red-500 rounded-xl bg-red-50 px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-60 transition-all"
              >
                {success
                  ? <><Check className="h-4 w-4" /> Note enregistrée !</>
                  : loading
                    ? 'Enregistrement…'
                    : 'Enregistrer la note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
