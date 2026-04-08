'use client';

import { useState } from 'react';
import { updateGroupLinks } from '../actions';
import { GitBranch, Presentation, Check } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export function SubmitLinksForm({ groupId, initialRepo, initialSlides }: {
  groupId: string;
  initialRepo?: string;
  initialSlides?: string;
}) {
  const [repo, setRepo] = useState(initialRepo ?? '');
  const [slides, setSlides] = useState(initialSlides ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (repo && !repo.startsWith('https://')) { setError('L\'URL GitHub doit commencer par https://'); return; }
    if (slides && !slides.startsWith('https://')) { setError('L\'URL Slides doit commencer par https://'); return; }
    setLoading(true);
    setError('');
    const result = await updateGroupLinks(groupId, repo, slides);
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className={labelCls}>Livrables</p>
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
          <GitBranch className="h-3.5 w-3.5" /> GitHub
        </label>
        <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/..." className={inputCls} />
      </div>
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Presentation className="h-3.5 w-3.5" /> Slides
        </label>
        <input value={slides} onChange={(e) => setSlides(e.target.value)} placeholder="https://docs.google.com/..." className={inputCls} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
      >
        {success ? <><Check className="h-4 w-4 text-emerald-500" /> Enregistré !</> : loading ? 'Enregistrement…' : 'Déposer les livrables'}
      </button>
    </form>
  );
}
