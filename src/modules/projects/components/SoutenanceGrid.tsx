'use client';

import { useState } from 'react';
import { bookSlot } from '../actions';
import type { SoutenanceSlot, ProjectGroup } from '../types';

interface SoutenanceGridProps {
  slots: SoutenanceSlot[];
  weekId: string;
  myGroupId?: string;
}

export function SoutenanceGrid({ slots, weekId, myGroupId }: SoutenanceGridProps) {
  const [localSlots, setLocalSlots] = useState(slots);
  const [error, setError] = useState('');

  async function handleBook(slotId: string) {
    if (!myGroupId) return;
    setError('');
    const result = await bookSlot(slotId, myGroupId, weekId);
    if (result.error) {
      setError(result.error);
    } else {
      setLocalSlots((prev) =>
        prev.map((s) => s.id === slotId ? { ...s, group_id: myGroupId } : s)
      );
    }
  }

  if (localSlots.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun créneau défini.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {localSlots.map((slot) => {
        const isTaken = !!slot.group_id;
        const isMySlot = slot.group_id === myGroupId;
        return (
          <div
            key={slot.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              isTaken
                ? isMySlot
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-destructive/20 bg-destructive/5'
                : 'border-green-500/20 bg-green-500/5'
            }`}
          >
            <div>
              <p className="text-sm font-medium">
                {new Date(slot.heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' → '}
                {new Date(slot.heure_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {isTaken && (
                <p className="text-xs text-muted-foreground">
                  {isMySlot ? 'Votre groupe' : slot.group_name ?? 'Réservé'}
                </p>
              )}
            </div>
            {!isTaken && myGroupId && (
              <button
                type="button"
                onClick={() => handleBook(slot.id)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Réserver
              </button>
            )}
            {!isTaken && !myGroupId && (
              <span className="text-xs text-green-600 font-medium">Libre</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
