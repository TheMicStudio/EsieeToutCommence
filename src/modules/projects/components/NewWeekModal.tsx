'use client';

import { useEffect, useRef, useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { CreateWeekForm } from './CreateWeekForm';

interface ClassOption { id: string; nom: string; annee?: number | string }

interface NewWeekModalProps {
  /** Classe unique pré-sélectionnée (filtre actif) */
  classId?: string;
  /** Toutes les classes disponibles (quand pas de filtre) */
  classes?: ClassOption[];
  /** Label du bouton */
  label?: string;
}

export function NewWeekModal({ classId, classes = [], label = 'Créer une semaine' }: Readonly<NewWeekModalProps>) {
  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classId ?? classes[0]?.id ?? '');
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync si classId change (changement de filtre)
  useEffect(() => {
    setSelectedClassId(classId ?? classes[0]?.id ?? '');
  }, [classId, classes]);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  const effectiveClassId = classId ?? selectedClassId;
  const showSelector = !classId && classes.length > 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all shadow-sm"
      >
        <CalendarPlus className="h-4 w-4" />
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-modal="true"
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={() => setOpen(false)}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-[#061826]">Nouvelle semaine projet</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {showSelector && (
            <div>
              <label htmlFor="nw-classId" className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Classe *
              </label>
              <select
                id="nw-classId"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}{c.annee ? ` — Promo ${c.annee}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {effectiveClassId && (
            <CreateWeekForm classId={effectiveClassId} onClose={() => setOpen(false)} />
          )}
        </div>
      </dialog>
    </>
  );
}
