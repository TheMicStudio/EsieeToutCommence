'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ChevronDown, Info } from 'lucide-react';
import { createAttendanceSession } from '../actions';

interface TeacherClass {
  id: string;
  nom: string;
  annee: string | number;
}

interface StartSessionFormProps {
  classes: TeacherClass[];
  initialClassId?: string;
}

const DURATIONS = [5, 10, 15, 30] as const;
type Duration = (typeof DURATIONS)[number];

export function StartSessionForm({ classes, initialClassId }: StartSessionFormProps) {
  const [classId, setClassId]   = useState(initialClassId ?? classes[0]?.id ?? '');
  const [duration, setDuration] = useState<Duration>(5);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  const activeClass = classes.find((c) => c.id === classId);
  const activeLabel = activeClass
    ? `${activeClass.nom} — Promo ${activeClass.annee}`
    : 'Sélectionner une classe';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await createAttendanceSession(classId, duration);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.session) {
      router.push(`/dashboard/emargement/session/${result.session.id}`);
    }
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4">
        <p className="text-[13px] font-medium text-amber-700">
          Vous n&apos;êtes assigné à aucune classe pour le moment.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      aria-label="Formulaire de lancement d'appel"
    >
      {/* 2-col grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Gauche — Classe concernée */}
        <div>
          <label
            htmlFor="session-class-select"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a90]"
          >
            Classe concernée
          </label>

          {/* Styled select wrapper */}
          <div className="relative">
            <select
              id="session-class-select"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              aria-label={`Classe sélectionnée : ${activeLabel}`}
              className="flex h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-[13px] font-medium text-[#0f1a2e] transition-colors hover:border-[#41c0f0]/60 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/30 focus:border-[#0471a6]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — Promo {c.annee}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>

          <p className="mt-1.5 text-[12px] text-slate-500">
            La liste des étudiants sera basée sur cet effectif.
          </p>
        </div>

        {/* Droite — Durée QR */}
        <div>
          <p
            id="duration-group-label"
            className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a90]"
          >
            Durée de validité du QR Code
          </p>

          <div
            role="group"
            aria-labelledby="duration-group-label"
            className="flex flex-wrap gap-2"
          >
            {DURATIONS.map((d) => {
              const isSelected = duration === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  aria-pressed={isSelected}
                  className={[
                    'rounded-full px-5 py-2.5 text-[13px] font-bold transition-all',
                    isSelected
                      ? 'bg-[#0471a6] text-white shadow-md shadow-[#0471a6]/10'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {d} min
                </button>
              );
            })}
          </div>

          <p className="mt-1.5 text-[12px] text-slate-500">
            Le code expirera automatiquement après ce délai.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-2 text-[13px] font-medium text-red-600"
        >
          {error}
        </p>
      )}

      {/* CTA — full width */}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0471a6] px-4 py-3 text-[14px] font-bold text-white shadow-lg shadow-[#0471a6]/20 transition-all hover:bg-[#0471a6]/90 active:scale-[0.98] disabled:opacity-50"
      >
        <QrCode size={18} aria-hidden="true" />
        {loading ? 'Création en cours…' : "Générer le QR Code & Lancer l'appel"}
      </button>

      {/* Hint box */}
      <div
        className="flex items-start gap-3 rounded-2xl bg-amber-50/50 p-4"
        role="note"
      >
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-[13px] font-medium text-slate-600">
          Le QR code sera disponible pour affichage immédiat après avoir cliqué sur le bouton de
          lancement.
        </p>
      </div>
    </form>
  );
}
