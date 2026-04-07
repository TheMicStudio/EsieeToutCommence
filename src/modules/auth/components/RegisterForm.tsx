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

const MATIERES = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Informatique',
  'Algorithmique',
  'Réseaux & Systèmes',
  'Développement Web',
  'Bases de données',
  'Anglais',
  'Français',
  'Management',
  'Économie',
  'Droit',
  'SIO',
  'Électronique',
];

const FONCTIONS = [
  'Directeur·trice',
  'Directeur·trice adjoint·e',
  'Responsable pédagogique',
  'Responsable administratif·ve',
  'Secrétariat',
  'Comptabilité',
  'Ressources humaines',
  'Chargé·e de communication',
  'Référent·e numérique',
  'Autre',
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

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStep1({
      prenom: fd.get('prenom') as string,
      nom: fd.get('nom') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
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
            <Label>Votre rôle</Label>
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
          {/* Réinjection données étape 1 */}
          <input type="hidden" name="prenom" value={step1.prenom} />
          <input type="hidden" name="nom" value={step1.nom} />
          <input type="hidden" name="email" value={step1.email} />
          <input type="hidden" name="password" value={step1.password} />
          <input type="hidden" name="role" value={step1.role} />
          {/* Matières sélectionnées */}
          <input type="hidden" name="matieres_enseignees" value={selectedMatieres.join(', ')} />

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
              <Label>Type de parcours</Label>
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

          {/* ── Professeur ── */}
          {step1.role === 'professeur' && (
            <div className="space-y-3">
              <Label>Matières enseignées</Label>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto rounded-lg border p-3">
                {MATIERES.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMatieres.includes(m)}
                      onChange={() => toggleMatiere(m)}
                      className="h-4 w-4 rounded accent-primary shrink-0"
                    />
                    <span className="text-sm">{m}</span>
                  </label>
                ))}
              </div>
              {selectedMatieres.length > 0 && (
                <p className="text-xs text-primary">
                  {selectedMatieres.length} matière{selectedMatieres.length > 1 ? 's' : ''} sélectionnée{selectedMatieres.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* ── Admin ── */}
          {step1.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction</Label>
              <select
                id="fonction"
                name="fonction"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sélectionner une fonction</option>
                {FONCTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
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
