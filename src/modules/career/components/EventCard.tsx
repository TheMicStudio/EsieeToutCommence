'use client';

import { useRouter } from 'next/navigation';
import { Calendar, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import { registerToEvent, unregisterFromEvent, deleteCareerEvent } from '../actions';
import type { CareerEvent } from '../types';
import { useState } from 'react';

interface EventCardProps {
  event: CareerEvent;
  isRegistered: boolean;
  canParticipate: boolean;
  canDelete?: boolean;
}

export function EventCard({ event, isRegistered, canParticipate, canDelete }: Readonly<EventCardProps>) {
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dateDebut = new Date(event.date_debut);
  const isPast = dateDebut < new Date();

  async function handleToggle() {
    if (isRegistered) {
      await unregisterFromEvent(event.id);
    } else {
      await registerToEvent(event.id);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Supprimer l'événement "${event.titre}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    const result = await deleteCareerEvent(event.id);
    if (result.error) { alert(result.error); setDeleting(false); return; }
    setDeleted(true);
  }

  if (deleted) return null;

  return (
    <div className={[
      'group relative flex flex-col rounded-3xl border border-slate-200/70 bg-white shadow-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5',
      deleting ? 'opacity-50 pointer-events-none' : '',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#061826] leading-snug">{event.titre}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {isRegistered && !isPast && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Inscrit
            </span>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Supprimer l'événement"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3 w-3 shrink-0 text-amber-400" />
          <span className="capitalize">
            {dateDebut.toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        {event.lieu && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-[#89aae6]" />
            {event.lieu}
          </div>
        )}
      </div>

      {event.description && (
        <p className="mt-3 flex-1 line-clamp-2 text-sm text-slate-500 leading-relaxed">{event.description}</p>
      )}

      {canParticipate && !isPast && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleToggle}
            className={[
              'rounded-2xl px-4 py-2 text-xs font-semibold transition-colors',
              isRegistered
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0471a6] text-white hover:bg-[#0471a6]/90',
            ].join(' ')}
          >
            {isRegistered ? 'Se désinscrire' : "S'inscrire"}
          </button>
        </div>
      )}
    </div>
  );
}
