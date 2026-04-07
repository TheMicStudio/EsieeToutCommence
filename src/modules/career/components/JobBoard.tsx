'use client';

import { useState } from 'react';
import { JobOfferCard } from './JobOfferCard';
import { Input } from '@/components/ui/input';
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
}

export function JobBoard({ offers }: JobBoardProps) {
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Rechercher une offre ou une entreprise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Aucune offre pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} offre{filtered.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
