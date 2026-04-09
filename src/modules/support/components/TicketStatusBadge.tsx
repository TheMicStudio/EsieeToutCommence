import { Badge } from '@/components/ui/badge';
import { STATUT_LABELS, type TicketStatut } from '../types';

const VARIANT: Record<TicketStatut, 'default' | 'secondary' | 'destructive'> = {
  ouvert: 'destructive',
  en_cours: 'secondary',
  resolu: 'default',
  ferme: 'secondary',
};

export function TicketStatusBadge({ statut }: Readonly<{ statut: TicketStatut }>) {
  return <Badge variant={VARIANT[statut]}>{STATUT_LABELS[statut]}</Badge>;
}
