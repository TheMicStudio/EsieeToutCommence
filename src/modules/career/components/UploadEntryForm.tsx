'use client';

import { useActionState } from 'react';
import { uploadApprenticeshipEntry } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadEntryFormProps {
  chatId: string;
}

export function UploadEntryForm({ chatId }: UploadEntryFormProps) {
  const [state, action, pending] = useActionState(uploadApprenticeshipEntry, null);

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Déposer un rendu</h3>
      <input type="hidden" name="chat_id" value={chatId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titre">Titre du rendu</Label>
          <Input id="titre" name="titre" placeholder="Rapport de stage — Mois 1" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description (optionnel)</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Contexte, objectifs…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fichier">Fichier (PDF, PPTX…)</Label>
          <Input id="fichier" name="fichier" type="file" accept=".pdf,.pptx,.docx,.zip" required />
          <p className="text-xs text-muted-foreground">Max 10 Mo. Formats acceptés : PDF, PPTX, DOCX, ZIP.</p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Rendu déposé avec succès.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Envoi en cours…' : 'Déposer le rendu'}
      </Button>
    </form>
  );
}
