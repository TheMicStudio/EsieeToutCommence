'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEntry } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUT_LABELS, type ApprenticeshipEntry } from '../types';

interface ValidationPanelProps {
  entries: ApprenticeshipEntry[];
}

export function ValidationPanel({ entries }: ValidationPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const pending = entries.filter((e) => e.statut === 'soumis' || e.statut === 'en_revision');

  async function handleValidate(entryId: string, statut: 'valide' | 'refuse') {
    setLoading(entryId);
    const note = statut === 'valide' ? Number.parseFloat(notes[entryId] ?? '') : null;
    const result = await validateEntry(entryId, Number.isNaN(note as number) ? null : note, statut);
    setFeedback((prev) => ({ ...prev, [entryId]: result.error ?? 'Mis à jour.' }));
    setLoading(null);
    if (!result.error) router.refresh();
  }

  if (pending.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Aucun rendu en attente de validation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Rendus à valider ({pending.length})</h3>
      {pending.map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{entry.titre}</CardTitle>
              <Badge variant="secondary">{STATUT_LABELS[entry.statut]}</Badge>
            </div>
            {entry.description && (
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href={entry.fichier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Consulter le fichier →
            </a>

            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor={`note-${entry.id}`}>Note (/20)</Label>
                <Input
                  id={`note-${entry.id}`}
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  placeholder="Ex: 14"
                  className="w-28"
                  value={notes[entry.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                />
              </div>
              <Button
                onClick={() => handleValidate(entry.id, 'valide')}
                disabled={loading === entry.id}
                size="sm"
              >
                Valider
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleValidate(entry.id, 'refuse')}
                disabled={loading === entry.id}
                size="sm"
              >
                Refuser
              </Button>
            </div>
            {feedback[entry.id] && (
              <p className="text-xs text-muted-foreground">{feedback[entry.id]}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
