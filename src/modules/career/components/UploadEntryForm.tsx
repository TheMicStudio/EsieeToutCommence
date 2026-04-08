'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadApprenticeshipEntry } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadEntryFormProps {
  chatId: string;
}

const MAX_SIZE_MB = 10;

export function UploadEntryForm({ chatId }: UploadEntryFormProps) {
  const [state, action, pending] = useActionState(uploadApprenticeshipEntry, null);
  const [fileError, setFileError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Le fichier dépasse ${MAX_SIZE_MB} Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo).`);
    } else {
      setFileError('');
    }
  }

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
          <Input
            id="fichier"
            name="fichier"
            type="file"
            accept=".pdf,.pptx,.docx,.zip"
            required
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">Max 10 Mo. Formats acceptés : PDF, PPTX, DOCX, ZIP.</p>
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Rendu déposé avec succès.</p>}

      <Button type="submit" disabled={pending || !!fileError}>
        {pending ? 'Envoi en cours…' : 'Déposer le rendu'}
      </Button>
    </form>
  );
}
