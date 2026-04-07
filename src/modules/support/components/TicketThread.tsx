'use client';

import { useActionState } from 'react';
import { addTicketMessage, updateTicketStatus, convertTicketToFaq } from '../actions';
import { TicketStatusBadge } from './TicketStatusBadge';
import { Button } from '@/components/ui/button';
import { CATEGORIE_LABELS, type Ticket, type TicketMessage, type TicketStatut } from '../types';

interface TicketThreadProps {
  ticket: Ticket;
  messages: TicketMessage[];
  authorNames: Record<string, string>;
  currentUserId: string;
  isAdmin: boolean;
}

const STATUT_ACTIONS: { statut: TicketStatut; label: string }[] = [
  { statut: 'en_cours', label: 'Prendre en charge' },
  { statut: 'resolu', label: 'Marquer résolu' },
  { statut: 'ferme', label: 'Fermer' },
];

export function TicketThread({ ticket, messages, authorNames, currentUserId, isAdmin }: TicketThreadProps) {
  const [msgState, msgAction, msgPending] = useActionState(addTicketMessage, null);

  async function handleStatusChange(statut: TicketStatut) {
    await updateTicketStatus(ticket.id, statut);
  }

  async function handleConvert() {
    await convertTicketToFaq(ticket.id);
  }

  return (
    <div className="space-y-6">
      {/* En-tête ticket */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{ticket.sujet}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {CATEGORIE_LABELS[ticket.categorie]} ·{' '}
              {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {ticket.au_nom_de_classe && ' · Au nom de la classe'}
            </p>
          </div>
          <TicketStatusBadge statut={ticket.statut} />
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>

        {/* Actions admin */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {STATUT_ACTIONS.filter((a) => a.statut !== ticket.statut).map((a) => (
              <Button key={a.statut} size="sm" variant="outline"
                onClick={() => handleStatusChange(a.statut)}>
                {a.label}
              </Button>
            ))}
            {ticket.statut === 'resolu' && (
              <Button size="sm" variant="secondary" onClick={handleConvert}>
                → Convertir en FAQ
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore de réponse.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                <span className="px-1 text-xs font-medium text-muted-foreground">
                  {authorNames[msg.author_id] ?? 'Utilisateur'}
                </span>
                <div className={`max-w-lg rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted'}`}>
                  {msg.contenu}
                </div>
                <span className="px-1 text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Répondre */}
      {ticket.statut !== 'ferme' && (
        <form action={msgAction} className="flex gap-2">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <textarea name="contenu" rows={2} placeholder="Votre réponse…" required
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="submit" disabled={msgPending} className="self-end">
            Envoyer
          </Button>
        </form>
      )}
      {msgState?.error && <p className="text-sm text-destructive">{msgState.error}</p>}
    </div>
  );
}
