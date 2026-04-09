'use client';

import { useState } from 'react';
import { Search, Briefcase, SlidersHorizontal } from 'lucide-react';
import { JobOfferCard } from './JobOfferCard';
import type { ContratType, JobOffer } from '../types';

const FILTERS: { value: 'tous' | ContratType; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'stage', label: 'Stage' },
  { value: 'alternance', label: 'Alternance' },
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
];

interface JobBoardProps {
  offers: JobOffer[];
  canDelete?: boolean;
}

export function JobBoard({ offers, canDelete }: Readonly<JobBoardProps>) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | ContratType>('tous');

  const filtered = offers.filter((o) => {
    const matchFilter = filter === 'tous' || o.type_contrat === filter;
    const matchSearch =
      o.titre.toLowerCase().includes(search.toLowerCase()) ||
      o.entreprise.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 focus-within:border-[#89aae6] focus-within:ring-2 focus-within:ring-[#89aae6]/20 transition-all sm:max-w-sm">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une offre ou une entreprise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  filter === f.value
                    ? 'bg-[#0471a6] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-medium text-slate-400 whitespace-nowrap">
            {filtered.length} offre{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white">
          <Briefcase className="h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">Aucune offre pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} canDelete={canDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
