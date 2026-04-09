'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signUp } from '../actions';
import type { RolePrincipal } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Seuls ces rôles sont autorisés en auto-inscription.
// Les comptes Professeur et Admin sont créés exclusivement par l'administration.
const ROLES: { value: RolePrincipal; label: string; description: string }[] = [
  { value: 'eleve', label: 'Élève', description: 'Accès aux cours, notes et carrière' },
  { value: 'parent', label: 'Parent d\'élève', description: 'Suivi de la scolarité de votre enfant' },
  { value: 'entreprise', label: 'Tuteur professionnel', description: 'Suivi des alternants en entreprise' },
];

interface Step1Data {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: RolePrincipal | '';
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, null);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<Step1Data>({
    prenom: '', nom: '', email: '', password: '', role: '',
  });
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([]);
  const [password, setPassword] = useState('');

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pwd = fd.get('password') as string;
    setPassword(pwd);
    setStep1({
      prenom: fd.get('prenom') as string,
      nom: fd.get('nom') as string,
      email: fd.get('email') as string,
      password: pwd,
      role: fd.get('role') as RolePrincipal,
    });
    setStep(2);
  }

  function toggleMatiere(m: string) {
    setSelectedMatieres((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  const selectedRoleLabel = ROLES.find((r) => r.value === step1.role)?.label;

  return (
    <div className="space-y-6">
      {/* ── Étape 1 — Compte + Rôle ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                defaultValue={step1.prenom}
                placeholder="Jean"
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                name="nom"
                defaultValue={step1.nom}
                placeholder="Dupont"
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={step1.email}
              placeholder="vous@exemple.fr"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8 caractères minimum"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Votre rôle</p>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    defaultChecked={step1.role === r.value}
                    required
                    className="h-4 w-4 accent-primary shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Les comptes <span className="font-medium">Professeur</span> et{' '}
              <span className="font-medium">Administration</span> sont créés par votre établissement.
            </p>
          </div>

          <Button type="submit" className="w-full">Continuer →</Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      )}

      {/* ── Étape 2 — Profil selon le rôle ── */}
      {step === 2 && (
        <form action={action} className="space-y-5">
          {/* Réinjection données étape 1 — le mot de passe est en mémoire React, pas dans le DOM */}
          <input type="hidden" name="prenom" value={step1.prenom} />
          <input type="hidden" name="nom" value={step1.nom} />
          <input type="hidden" name="email" value={step1.email} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="role" value={step1.role} />
          <input type="hidden" name="matieres_enseignees" value={selectedMatieres.join(',')} />

          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Retour
          </button>

          <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm">
            Rôle : <span className="font-medium">{selectedRoleLabel}</span>
          </div>

          {/* ── Élève ── */}
          {step1.role === 'eleve' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Type de parcours</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'temps_plein', label: 'Temps plein', desc: 'Formation initiale classique' },
                  { value: 'alternant', label: 'Alternant', desc: 'En entreprise en alternance' },
                ].map((p) => (
                  <label
                    key={p.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="type_parcours"
                      value={p.value}
                      defaultChecked={p.value === 'temps_plein'}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Entreprise ── */}
          {step1.role === 'entreprise' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entreprise_nom">Nom de l&apos;entreprise</Label>
                <Input
                  id="entreprise_nom"
                  name="entreprise"
                  placeholder="Acme Corp"
                  required
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poste">Votre poste</Label>
                <Input
                  id="poste"
                  name="poste"
                  placeholder="Maître d'apprentissage, RH…"
                  autoComplete="organization-title"
                />
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

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
