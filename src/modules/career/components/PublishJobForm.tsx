'use client';

import { useActionState, useEffect } from 'react';
import { publishJobOffer } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PublishJobForm({ onSuccess }: Readonly<{ onSuccess?: () => void }>) {
  const [state, action, pending] = useActionState(publishJobOffer, null);

  useEffect(() => {
    if (state?.success && onSuccess) onSuccess();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titre">Titre du poste</Label>
          <Input id="titre" name="titre" placeholder="Développeur Full Stack" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entreprise">Entreprise</Label>
          <Input id="entreprise" name="entreprise" placeholder="Acme Corp" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type_contrat">Type de contrat</Label>
          <select
            id="type_contrat"
            name="type_contrat"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sélectionner…</option>
            <option value="stage">Stage</option>
            <option value="alternance">Alternance</option>
            <option value="cdi">CDI</option>
            <option value="cdd">CDD</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="localisation">Localisation</Label>
          <Input id="localisation" name="localisation" placeholder="Paris, Remote…" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Description du poste…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lien_candidature">Lien de candidature</Label>
          <Input id="lien_candidature" name="lien_candidature" type="url" placeholder="https://…" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Offre publiée avec succès.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Publication…' : 'Publier l\'offre'}
      </Button>
    </form>
  );
}
