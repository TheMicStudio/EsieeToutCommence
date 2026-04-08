'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { linkChild } from '../actions';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

export function LinkChildForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const result = await linkChild(email);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    setEmail('');
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
          Email de l&apos;élève
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@eleve.fr"
          className={inputCls}
          required
        />
        <p className="mt-1.5 text-xs text-slate-400">
          L&apos;adresse email doit correspondre au compte élève enregistré dans le système.
        </p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">Lien créé avec succès !</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <UserPlus className="h-4 w-4" />
        {loading ? 'Liaison…' : 'Lier mon enfant'}
      </button>
    </form>
  );
}
