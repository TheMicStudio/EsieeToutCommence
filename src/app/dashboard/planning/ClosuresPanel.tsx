'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2, X, CalendarOff, Loader2, AlertCircle } from 'lucide-react';
import {
  createClosure,
  deleteClosure,
  type ClosureRow,
} from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDurationDays(start: string, end: string) {
  const diff =
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24) + 1;
  return diff;
}

function CreateClosureForm({ onDone }: Readonly<{ onDone: () => void }>) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await createClosure(formData);
      if (!res.error) onDone();
      return res;
    },
    null
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-[#061826]">Ajouter une fermeture</p>
        <button onClick={onDone} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="label" className={labelCls}>Libellé</label>
          <input
            id="label"
            name="label"
            placeholder="Ex: Vacances de Noël 2025, Férié 14 juillet"
            required
            className={inputCls}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="date_start" className={labelCls}>Date de début</label>
            <input id="date_start" name="date_start" type="date" required className={inputCls} />
          </div>
          <div className="flex-1">
            <label htmlFor="date_end" className={labelCls}>Date de fin (incluse)</label>
            <input id="date_end" name="date_end" type="date" required className={inputCls} />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </button>
        </div>
      </form>
      {state?.error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
    </div>
  );
}

export function ClosuresPanel({ closures: initial }: Readonly<{ closures: ClosureRow[] }>) {
  const [closures, setClosures] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteClosure(id);
    setClosures((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  // Séparer passé / futur
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = closures.filter((c) => c.date_end >= today);
  const past = closures.filter((c) => c.date_end < today);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#061826]">
          {upcoming.length} fermeture{upcoming.length > 1 ? 's' : ''} à venir
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      {showForm && <CreateClosureForm onDone={() => setShowForm(false)} />}

      {closures.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <CalendarOff className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Aucune fermeture configurée</p>
          <p className="text-xs text-slate-400">
            Ajoutez les vacances scolaires et jours fériés pour les exclure du planning.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((c) => (
            <ClosureRow
              key={c.id}
              closure={c}
              onDelete={handleDelete}
              deletingId={deletingId}
              past={false}
            />
          ))}
          {past.length > 0 && (
            <>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Passées
              </p>
              {past.map((c) => (
                <ClosureRow
                  key={c.id}
                  closure={c}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                  past
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClosureRow({
  closure,
  onDelete,
  deletingId,
  past,
}: Readonly<{
  closure: ClosureRow;
  onDelete: (id: string) => void;
  deletingId: string | null;
  past: boolean;
}>) {
  const days = getDurationDays(closure.date_start, closure.date_end);

  return (
    <div className={[
      'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
      past
        ? 'border-slate-100 bg-slate-50/60 opacity-60'
        : 'border-slate-200 bg-white',
    ].join(' ')}>
      <div className={[
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        past ? 'bg-slate-100' : 'bg-amber-100',
      ].join(' ')}>
        <CalendarOff className={['h-5 w-5', past ? 'text-slate-400' : 'text-amber-600'].join(' ')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#061826] truncate">{closure.label}</p>
        <p className="text-xs text-slate-400">
          {formatDate(closure.date_start)} → {formatDate(closure.date_end)}{' '}
          <span className="text-slate-300">·</span>{' '}
          {days} jour{days > 1 ? 's' : ''}
        </p>
      </div>
      <button
        onClick={() => onDelete(closure.id)}
        disabled={deletingId === closure.id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all shrink-0"
      >
        {deletingId === closure.id ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
        Supprimer
      </button>
    </div>
  );
}
