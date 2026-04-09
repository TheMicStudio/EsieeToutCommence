'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Calendar, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  publishJobOffer,
  toggleJobOffer,
  deleteJobOffer,
  publishCareerEvent,
  deleteCareerEvent,
} from '@/modules/career/actions';
import type { JobOffer, CareerEvent } from '@/modules/career/types';
import { CONTRAT_LABELS } from '@/modules/career/types';

interface CareerPanelProps {
  jobOffers: JobOffer[];
  careerEvents: CareerEvent[];
}

const inputClass = 'flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const selectClass = 'flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

function JobOffersSection({ jobOffers }: { jobOffers: JobOffer[] }) {
  const [state, action, pending] = useActionState(publishJobOffer, null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      {/* Formulaire ajout */}
      <form action={action} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Publier une offre
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="titre" className={labelClass}>Titre du poste</label>
            <input id="titre" name="titre" required placeholder="Développeur Full Stack" className={inputClass} />
          </div>
          <div>
            <label htmlFor="entreprise" className={labelClass}>Entreprise</label>
            <input id="entreprise" name="entreprise" required placeholder="Acme Corp" className={inputClass} />
          </div>
          <div>
            <label htmlFor="type_contrat" className={labelClass}>Type de contrat</label>
            <select id="type_contrat" name="type_contrat" required className={selectClass}>
              <option value="">Sélectionner…</option>
              {(Object.entries(CONTRAT_LABELS) as [string, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="localisation" className={labelClass}>Localisation</label>
            <input id="localisation" name="localisation" placeholder="Paris, Remote…" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Descriptif du poste, missions, profil recherché…"
              className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lien_candidature" className={labelClass}>Lien candidature</label>
            <input id="lien_candidature" name="lien_candidature" type="url" placeholder="https://…" className={inputClass} />
          </div>
        </div>
        {state?.error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.success && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Offre publiée.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" />
          {pending ? 'Publication…' : 'Publier'}
        </button>
      </form>

      {/* Liste des offres */}
      {jobOffers.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-sm text-slate-400">Aucune offre publiée.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
          {jobOffers.map((offer) => (
            <div key={offer.id} className="flex items-center gap-3 px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#061826]">{offer.titre}</p>
                <p className="text-xs text-slate-400">{offer.entreprise} · {CONTRAT_LABELS[offer.type_contrat]}{offer.localisation ? ` · ${offer.localisation}` : ''}</p>
              </div>
              <span className={[
                'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                offer.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
              ].join(' ')}>
                {offer.actif ? 'Active' : 'Masquée'}
              </span>
              <button
                type="button"
                title={offer.actif ? 'Masquer' : 'Activer'}
                disabled={isPending}
                onClick={() => startTransition(async () => { await toggleJobOffer(offer.id, !offer.actif); router.refresh(); })}
                className="text-slate-400 hover:text-[#0471a6] disabled:opacity-40 transition-colors"
              >
                {offer.actif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                title="Supprimer"
                disabled={isPending}
                onClick={() => startTransition(async () => { await deleteJobOffer(offer.id); router.refresh(); })}
                className="text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsSection({ careerEvents }: { careerEvents: CareerEvent[] }) {
  const [state, action, pending] = useActionState(publishCareerEvent, null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      {/* Formulaire ajout */}
      <form action={action} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Créer un événement
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="evt-titre" className={labelClass}>Titre</label>
            <input id="evt-titre" name="titre" required placeholder="Forum Entreprises 2026" className={inputClass} />
          </div>
          <div>
            <label htmlFor="date_debut" className={labelClass}>Date de début</label>
            <input id="date_debut" name="date_debut" type="datetime-local" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="date_fin" className={labelClass}>Date de fin (optionnel)</label>
            <input id="date_fin" name="date_fin" type="datetime-local" className={inputClass} />
          </div>
          <div>
            <label htmlFor="lieu" className={labelClass}>Lieu</label>
            <input id="lieu" name="lieu" placeholder="Amphi A, Campus…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="evt-description" className={labelClass}>Description</label>
            <input id="evt-description" name="description" placeholder="Brève description de l'événement" className={inputClass} />
          </div>
        </div>
        {state?.error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.success && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Événement créé.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" />
          {pending ? 'Création…' : 'Créer'}
        </button>
      </form>

      {/* Liste des événements */}
      {careerEvents.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-sm text-slate-400">Aucun événement à venir.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
          {careerEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#061826]">{event.titre}</p>
                <p className="text-xs text-slate-400">
                  {new Date(event.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.lieu ? ` · ${event.lieu}` : ''}
                </p>
              </div>
              <button
                type="button"
                title="Supprimer"
                disabled={isPending}
                onClick={() => startTransition(async () => { await deleteCareerEvent(event.id); router.refresh(); })}
                className="shrink-0 text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CareerPanel({ jobOffers, careerEvents }: CareerPanelProps) {
  return (
    <div className="space-y-8">
      {/* Offres d'emploi */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-[#0471a6]" />
          <h2 className="text-sm font-bold text-[#061826]">Offres d&apos;emploi / stages</h2>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {jobOffers.length} offre{jobOffers.length > 1 ? 's' : ''}
          </span>
        </div>
        <JobOffersSection jobOffers={jobOffers} />
      </section>

      <div className="border-t border-slate-100" />

      {/* Événements */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#0471a6]" />
          <h2 className="text-sm font-bold text-[#061826]">Événements carrière</h2>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {careerEvents.length} événement{careerEvents.length > 1 ? 's' : ''}
          </span>
        </div>
        <EventsSection careerEvents={careerEvents} />
      </section>
    </div>
  );
}
