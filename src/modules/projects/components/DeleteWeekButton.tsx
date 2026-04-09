'use client';

import { useState, useTransition } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { deleteProjectWeek } from '../actions';

interface DeleteWeekButtonProps {
  weekId: string;
  weekTitle: string;
  onDeleted?: () => void;
}

export function DeleteWeekButton({ weekId, weekTitle, onDeleted }: DeleteWeekButtonProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const matches = input.trim() === weekTitle.trim();

  function handleDelete() {
    if (!matches) return;
    startTransition(async () => {
      const res = await deleteProjectWeek(weekId);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        onDeleted?.();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
        title="Supprimer la semaine"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Supprimer la semaine</h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">Cette action est irréversible.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-[13px] text-red-700 leading-relaxed">
                  La suppression de <span className="font-semibold">« {weekTitle} »</span> entraînera la perte
                  de tous les groupes, créneaux, supports et données de rétro associés.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dw-confirm-input" className="block text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Tapez le nom de la semaine pour confirmer
                </label>
                <p className="text-[12px] text-slate-500 font-mono bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  {weekTitle}
                </p>
                <input
                  id="dw-confirm-input"
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(''); }}
                  placeholder="Saisir le nom exact…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
                />
                {error && <p className="text-[12px] text-red-500">{error}</p>}
              </div>

              <button
                type="button"
                onClick={handleDelete}
                disabled={!matches || isPending}
                className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
