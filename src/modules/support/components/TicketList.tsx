import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TicketStatusBadge } from './TicketStatusBadge';
import { CATEGORIE_LABELS, type Ticket } from '../types';

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white">
        <p className="text-sm text-slate-500">Aucun ticket pour l&apos;instant.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/dashboard/support/${ticket.id}`}
          className="flex items-center gap-4 px-1 py-3.5 hover:bg-slate-50 transition-colors rounded-xl group"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#061826] group-hover:text-[#0471a6] transition-colors">
              {ticket.sujet}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {CATEGORIE_LABELS[ticket.categorie]} ·{' '}
              {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              {ticket.au_nom_de_classe && ' · Au nom de la classe'}
            </p>
          </div>
          <TicketStatusBadge statut={ticket.statut} />
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </Link>
      ))}
    </div>
  );
}
