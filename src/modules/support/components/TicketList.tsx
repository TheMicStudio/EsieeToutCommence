import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStatusBadge } from './TicketStatusBadge';
import { CATEGORIE_LABELS, type Ticket } from '../types';

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Aucun ticket pour l&apos;instant.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
          <Card className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{ticket.sujet}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {CATEGORIE_LABELS[ticket.categorie]} ·{' '}
                  {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                  {ticket.au_nom_de_classe && ' · Au nom de la classe'}
                </p>
              </div>
              <TicketStatusBadge statut={ticket.statut} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
