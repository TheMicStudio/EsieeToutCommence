'use client';

import { useActionState } from 'react';
import { updateProfile } from '../actions';
import type { UserProfile } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileEditFormProps {
  userProfile: UserProfile;
}

export function ProfileEditForm({ userProfile }: ProfileEditFormProps) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const { profile, role } = userProfile;

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" name="prenom" defaultValue={profile.prenom} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" name="nom" defaultValue={profile.nom} required />
        </div>
      </div>

      {role === 'professeur' && (
        <div className="space-y-2">
          <Label htmlFor="matieres_enseignees">Matières enseignées</Label>
          <Input
            id="matieres_enseignees"
            name="matieres_enseignees"
            defaultValue={profile.matieres_enseignees.join(', ')}
            placeholder="Mathématiques, Physique…"
          />
          <p className="text-xs text-muted-foreground">Séparées par des virgules</p>
        </div>
      )}

      {role === 'admin' && (
        <div className="space-y-2">
          <Label htmlFor="fonction">Fonction</Label>
          <Input
            id="fonction"
            name="fonction"
            defaultValue={profile.fonction ?? ''}
            placeholder="Référent pédagogique…"
          />
        </div>
      )}

      {role === 'entreprise' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entreprise">Entreprise</Label>
            <Input id="entreprise" name="entreprise" defaultValue={profile.entreprise} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poste">Poste</Label>
            <Input id="poste" name="poste" defaultValue={profile.poste ?? ''} />
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
          Profil mis à jour avec succès.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}
