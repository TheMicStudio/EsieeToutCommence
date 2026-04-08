'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateTicketStatus, assignTicket } from '../actions';
import { ChevronRight, UserCheck } from 'lucide-react';
import { CATEGORIE_LABELS, type AdminContact, type Ticket, type TicketStatut } from '../types';

interface KanbanBoardProps {
  tickets: Ticket[];
  admins?: AdminContact[];
}

const COLUMNS: { statut: TicketStatut; label: string; dot: string; headerBg: string }[] = [
  { statut: 'ouvert',   label: 'À traiter', dot: 'bg-red-400',     headerBg: 'bg-red-50 border-red-200/60' },
  { statut: 'en_cours', label: 'En cours',  dot: 'bg-amber-400',   headerBg: 'bg-amber-50 border-amber-200/60' },
  { statut: 'resolu',   label: 'Résolu',    dot: 'bg-emerald-400', headerBg: 'bg-emerald-50 border-emerald-200/60' },
  { statut: 'ferme',    label: 'Fermé',     dot: 'bg-slate-300',   headerBg: 'bg-slate-50 border-slate-200/60' },
];

const MOVE_TARGETS: Record<TicketStatut, { statut: TicketStatut; label: string }[]> = {
  ouvert:   [{ statut: 'en_cours', label: 'En cours' }, { statut: 'ferme', label: 'Fermer' }],
  en_cours: [{ statut: 'resolu', label: 'Résoudre' }, { statut: 'ferme', label: 'Fermer' }],
  resolu:   [{ statut: 'ferme', label: 'Fermer' }],
  ferme:    [],
};

export function KanbanBoard({ tickets: initialTickets, admins = [] }: KanbanBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);

  async function moveTicket(ticketId: string, newStatut: TicketStatut) {
    await updateTicketStatus(ticketId, newStatut);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, statut: newStatut } : t));
  }

  async function handleAssign(ticketId: string, adminId: string) {
    await assignTicket(ticketId, adminId);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, assigne_a: adminId || undefined } : t));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.statut === col.statut);
        return (
          <div key={col.statut} className="flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            {/* En-tête colonne */}
            <div className={['flex items-center justify-between border-b px-4 py-3', col.headerBg].join(' ')}>
              <div className="flex items-center gap-2">
                <span className={['h-2 w-2 rounded-full', col.dot].join(' ')} />
                <span className="text-sm font-semibold text-[#061826]">{col.label}</span>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm border border-slate-200/60">
                {colTickets.length}
              </span>
            </div>

            {/* Tickets */}
            <div className="flex flex-col gap-2 p-3 flex-1 min-h-[120px]">
              {colTickets.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-6">
                  <p className="text-xs text-slate-400">Aucun ticket</p>
                </div>
              ) : (
                colTickets.map((ticket) => {
                  const assignedAdmin = admins.find((a) => a.id === ticket.assigne_a);
                  return (
                    <div key={ticket.id} className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-3 space-y-2.5">
                      <Link href={`/dashboard/support/${ticket.id}`} className="flex items-start gap-1 group">
                        <span className="flex-1 text-sm font-semibold text-[#061826] group-hover:text-[#0471a6] line-clamp-2 transition-colors leading-snug">
                          {ticket.sujet}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-300 group-hover:text-[#0471a6] transition-colors" />
                      </Link>

                      <p className="text-[11px] text-slate-400">
                        {CATEGORIE_LABELS[ticket.categorie] ?? ticket.categorie}
                        {' · '}
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>

                      {admins.length > 0 && col.statut !== 'ferme' && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                          <select
                            value={ticket.assigne_a ?? ''}
                            onChange={(e) => handleAssign(ticket.id, e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#89aae6]/40"
                          >
                            <option value="">— Non assigné —</option>
                            {admins.map((a) => (
                              <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {assignedAdmin && col.statut === 'ferme' && (
                        <p className="text-[11px] text-slate-400">Traité par {assignedAdmin.prenom} {assignedAdmin.nom}</p>
                      )}

                      {MOVE_TARGETS[col.statut].length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {MOVE_TARGETS[col.statut].map((target) => (
                            <button
                              key={target.statut}
                              type="button"
                              onClick={() => moveTicket(ticket.id, target.statut)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              → {target.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
