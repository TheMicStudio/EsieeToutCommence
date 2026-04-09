'use client';

import { useState } from 'react';
import { Briefcase, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import { CONTRAT_LABELS, type JobOffer } from '../types';
import { deleteJobOffer } from '../actions';

const CONTRAT_COLORS: Record<string, string> = {
  stage:      'bg-amber-100 text-amber-700',
  alternance: 'bg-[#89aae6]/20 text-[#3685b5]',
  cdi:        'bg-emerald-100 text-emerald-700',
  cdd:        'bg-purple-100 text-purple-700',
};

interface JobOfferCardProps {
  offer: JobOffer;
  canDelete?: boolean;
}

export function JobOfferCard({ offer, canDelete }: Readonly<JobOfferCardProps>) {
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleted) return null;

  async function handleDelete() {
    if (!confirm(`Supprimer l'offre "${offer.titre}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    const result = await deleteJobOffer(offer.id);
    if (result.error) { alert(result.error); setDeleting(false); return; }
    setDeleted(true);
  }

  return (
    <div className={[
      'group relative flex flex-col rounded-3xl border border-slate-200/70 bg-white shadow-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#89aae6]/40 min-w-0',
      deleting ? 'opacity-50 pointer-events-none' : '',
    ].join(' ')}>

      {/* Bouton suppression */}
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Supprimer l'offre"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Header : icône + titre/entreprise + badge */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#89aae6]/15">
          <Briefcase className="h-5 w-5 text-[#3685b5]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#061826] leading-snug line-clamp-2 break-words">
            {offer.titre}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500 truncate">
            {offer.entreprise}
          </p>
        </div>

        <span className={[
          'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
          CONTRAT_COLORS[offer.type_contrat] ?? 'bg-slate-100 text-slate-600',
        ].join(' ')}>
          {CONTRAT_LABELS[offer.type_contrat]}
        </span>
      </div>

      {/* Corps */}
      <div className="mt-4 flex-1 space-y-2 min-w-0">
        {offer.localisation && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{offer.localisation}</span>
          </div>
        )}
        {offer.description && (
          <p className="line-clamp-3 text-sm text-slate-500 leading-relaxed break-words">
            {offer.description}
          </p>
        )}
      </div>

      {/* CTA */}
      {offer.lien_candidature && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <a
            href={offer.lien_candidature}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0471a6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0471a6]/90 transition-colors"
          >
            Postuler <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
