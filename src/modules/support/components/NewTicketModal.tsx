'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TicketForm } from './TicketForm';

interface NewTicketModalProps {
  isDelegue?: boolean;
  variant?: 'primary' | 'ghost';
}

export function NewTicketModal({ isDelegue = false, variant = 'primary' }: NewTicketModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all hover:shadow-sm'
            : 'inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-colors'
        }
      >
        <Plus className="h-4 w-4" />
        Nouveau ticket
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-12">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/70 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Nouveau ticket</h2>
                <p className="text-xs text-slate-500 mt-0.5">Décrivez votre problème, nous vous répondrons rapidement.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <TicketForm isDelegue={isDelegue} onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
