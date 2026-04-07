'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signUp } from '../actions';
import type { RolePrincipal } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES: { value: RolePrincipal; label: string; description: string }[] = [
  { value: 'eleve', label: 'Élève', description: 'Accès aux cours, notes et carrière' },
  { value: 'professeur', label: 'Professeur', description: 'Gestion des classes et émargement' },
  { value: 'admin', label: 'Administration', description: 'Gestion globale de la plateforme' },
  { value: 'entreprise', label: 'Entreprise', description: 'Suivi des alternants' },
];

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RolePrincipal | null>(null);

  return (
    <form action={action} className="space-y-6">
      {/* Étape 1 — Compte + Rôle */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" name="prenom" placeholder="Jean" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" placeholder="Dupont" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" name="email" type="email" placeholder="vous@exemple.fr" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" placeholder="8 caractères minimum" required />
          </div>

          <div className="space-y-3">
            <Label>Votre rôle</Label>
            <input type="hidden" name="role" value={selectedRole ?? ''} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={[
                    'rounded-lg border-2 p-4 text-left transition-all',
                    selectedRole === r.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  ].join(' ')}
                >
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!selectedRole}
            onClick={() => setStep(2)}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Étape 2 — Profil selon le rôle */}
      {step === 2 && selectedRole && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Retour
          </button>

          <input type="hidden" name="role" value={selectedRole} />

          {/* Champs communs déjà dans l'étape 1, on les réinjecte en hidden */}
          <p className="text-sm text-muted-foreground">
            Rôle sélectionné :{' '}
            <span className="font-medium text-foreground">
              {ROLES.find((r) => r.value === selectedRole)?.label}
            </span>
          </p>

          {selectedRole === 'eleve' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de parcours</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'temps_plein', label: 'Temps plein' },
                    { value: 'alternant', label: 'Alternant' },
                  ].map((p) => (
                    <label key={p.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:border-primary/40">
                      <input type="radio" name="type_parcours" value={p.value} defaultChecked={p.value === 'temps_plein'} className="accent-primary" />
                      <span className="text-sm font-medium">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'professeur' && (
            <div className="space-y-2">
              <Label htmlFor="matieres_enseignees">Matières enseignées</Label>
              <Input
                id="matieres_enseignees"
                name="matieres_enseignees"
                placeholder="Mathématiques, Physique, Informatique"
              />
              <p className="text-xs text-muted-foreground">Séparées par des virgules</p>
            </div>
          )}

          {selectedRole === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction</Label>
              <Input
                id="fonction"
                name="fonction"
                placeholder="Référent pédagogique, Commercial…"
              />
            </div>
          )}

          {selectedRole === 'entreprise' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entreprise">Nom de l&apos;entreprise</Label>
                <Input id="entreprise" name="entreprise" placeholder="Acme Corp" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poste">Poste</Label>
                <Input id="poste" name="poste" placeholder="Maître d'apprentissage" />
              </div>
            </div>
          )}

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Création en cours…' : 'Créer mon compte'}
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
