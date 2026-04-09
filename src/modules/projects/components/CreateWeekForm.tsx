'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectWeek } from '../actions';
import { Plus } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export function CreateWeekForm({ classId, onClose }: Readonly<{ classId: string; onClose?: () => void }>) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const startDate = fd.get('start_date') as string;
    const endDate = fd.get('end_date') as string;

    setLoading(true);
    setError('');
    const result = await createProjectWeek(classId, title, startDate, endDate);
    setLoading(false);

    if (result.error) setError(result.error);
    else if (result.week) {
      if (onClose) { onClose(); router.refresh(); }
      else router.push(`/dashboard/pedagogie/projets/${result.week.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="cw-title" className={labelCls}>Titre *</label>
        <input
          id="cw-title"
          name="title"
          placeholder="ex: Semaine Intelligence Artificielle"
          required
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cw-start_date" className={labelCls}>Date de début *</label>
          <input id="cw-start_date" name="start_date" type="date" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="cw-end_date" className={labelCls}>Date de fin *</label>
          <input id="cw-end_date" name="end_date" type="date" required className={inputCls} />
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
        <Plus className="h-4 w-4" />
        {loading ? 'Création…' : 'Créer la semaine'}
      </button>
    </form>
  );
}
