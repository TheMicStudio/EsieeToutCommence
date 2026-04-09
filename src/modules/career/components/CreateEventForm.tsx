'use client';

import { useActionState, useEffect, useRef } from 'react';
import { publishCareerEvent } from '../actions';
import { Calendar } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export function CreateEventForm({ onSuccess }: Readonly<{ onSuccess?: () => void }>) {
  const [state, action, pending] = useActionState(publishCareerEvent, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      if (onSuccess) onSuccess();
    }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ev-titre" className={labelCls}>Titre de l&apos;événement *</label>
          <input id="ev-titre" name="titre" required placeholder="Forum Entreprises 2026" className={inputCls} />
        </div>

        <div>
          <label htmlFor="ev-date_debut" className={labelCls}>Date de début *</label>
          <input id="ev-date_debut" name="date_debut" type="datetime-local" required className={inputCls} />
        </div>

        <div>
          <label htmlFor="ev-date_fin" className={labelCls}>Date de fin</label>
          <input id="ev-date_fin" name="date_fin" type="datetime-local" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="ev-lieu" className={labelCls}>Lieu</label>
          <input id="ev-lieu" name="lieu" placeholder="Amphi A, Campus principal…" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="ev-description" className={labelCls}>Description</label>
          <textarea
            id="ev-description"
            name="description"
            rows={3}
            placeholder="Décrivez l'événement, le programme, les intervenants…"
            className={inputCls + ' h-auto resize-none leading-relaxed'}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Événement publié avec succès.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <Calendar className="h-4 w-4" />
        {pending ? 'Publication…' : 'Publier l\'événement'}
      </button>
    </form>
  );
}
