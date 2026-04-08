'use client';

import { useEffect, useRef, useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { CreateWeekForm } from './CreateWeekForm';

interface NewWeekModalProps {
  classId: string;
}

export function NewWeekModal({ classId }: NewWeekModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  function handleBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
      >
        <CalendarPlus className="h-4 w-4" />
        Créer une semaine
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdrop}
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
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
        <div className="p-6">
          <CreateWeekForm classId={classId} />
        </div>
      </dialog>
    </>
  );
}
