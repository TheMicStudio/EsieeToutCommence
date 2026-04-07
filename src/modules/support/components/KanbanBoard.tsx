'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateTicketStatus } from '../actions';
import { TicketStatusBadge } from './TicketStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORIE_LABELS, type Ticket, type TicketStatut } from '../types';

interface KanbanBoardProps {
  tickets: Ticket[];
}

const COLUMNS: { statut: TicketStatut; label: string; color: string }[] = [
  { statut: 'ouvert', label: 'À traiter', color: 'border-destructive/30 bg-destructive/5' },
  { statut: 'en_cours', label: 'En cours', color: 'border-secondary/40 bg-secondary/5' },
  { statut: 'resolu', label: 'Résolu', color: 'border-primary/30 bg-primary/5' },
];

export function KanbanBoard({ tickets: initialTickets }: KanbanBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);

  async function moveTicket(ticketId: string, newStatut: TicketStatut) {
    await updateTicketStatus(ticketId, newStatut);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, statut: newStatut } : t));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.statut === col.statut);
        return (
          <div key={col.statut} className={`rounded-xl border-2 p-4 ${col.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{col.label}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                {colTickets.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTickets.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Aucun ticket</p>
              ) : (
                colTickets.map((ticket) => (
                  <Card key={ticket.id} className="bg-background">
                    <CardContent className="p-3 space-y-2">
                      <Link href={`/dashboard/support/${ticket.id}`}
                        className="block font-medium text-sm hover:text-primary hover:underline line-clamp-2">
                        {ticket.sujet}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIE_LABELS[ticket.categorie]} · {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex gap-1.5">
                        {COLUMNS.filter((c) => c.statut !== col.statut).map((target) => (
                          <Button key={target.statut} size="sm" variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => moveTicket(ticket.id, target.statut)}>
                            → {target.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
