'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAttendanceSession } from '../actions';
import { QrCode } from 'lucide-react';

interface TeacherClass {
  id: string;
  nom: string;
  annee: string | number;
}

interface StartSessionFormProps {
  classes: TeacherClass[];
  initialClassId?: string;
}

export function StartSessionForm({ classes, initialClassId }: StartSessionFormProps) {
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? '');
  const [duration, setDuration] = useState<5 | 10 | 15 | 30>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5">
        <p className="text-sm text-amber-700">Vous n&apos;êtes assigné à aucune classe pour le moment.</p>
      </div>
    );
  }

  const selectClass = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="class" className={labelClass}>Classe</label>
        <select
          id="class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={selectClass}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} — Promo {c.annee}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={labelClass}>Durée de validité du QR Code</p>
        <div className="flex gap-2 flex-wrap">
          {([5, 10, 15, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={[
                'rounded-xl border px-5 py-2 text-sm font-semibold transition-all',
                duration === d
                  ? 'border-[#0471a6] bg-[#0471a6] text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <QrCode className="h-4 w-4" />
        {loading ? 'Création en cours…' : 'Lancer l\'appel'}
      </button>
    </form>
  );
}
