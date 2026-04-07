'use client';

import { useActionState } from 'react';
import { addCourseMaterial } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddCourseMaterialFormProps {
  classId: string;
  matieres: string[];
}

export function AddCourseMaterialForm({ classId, matieres }: AddCourseMaterialFormProps) {
  const [state, action, pending] = useActionState(addCourseMaterial, null);

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Ajouter un support de cours</h3>
      <input type="hidden" name="class_id" value={classId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titre">Titre</Label>
          <Input id="titre" name="titre" placeholder="Introduction aux réseaux" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matiere">Matière</Label>
          <select
            id="matiere"
            name="matiere"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sélectionner…</option>
            {matieres.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sélectionner…</option>
            <option value="pdf">PDF</option>
            <option value="video">Vidéo</option>
            <option value="lien">Lien</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input id="url" name="url" type="url" placeholder="https://…" required />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-primary">Support ajouté avec succès.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Ajout en cours…' : 'Ajouter'}
      </Button>
    </form>
  );
}
