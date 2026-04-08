'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, requestEmailChange } from '../actions';
import type { UserProfile } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MATIERES, FONCTIONS } from '@/lib/constants';
import { ChevronDown, Mail } from 'lucide-react';

interface ProfileEditFormProps {
  userProfile: UserProfile;
  subjects?: string[];
  adminFunctions?: string[];
}

export function ProfileEditForm({ userProfile, subjects, adminFunctions }: ProfileEditFormProps) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [emailState, emailAction, emailPending] = useActionState(requestEmailChange, null);
  const { profile, role } = userProfile;
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  const matieresOptions = subjects && subjects.length > 0 ? subjects : MATIERES;
  const fonctionsOptions = adminFunctions && adminFunctions.length > 0 ? adminFunctions : FONCTIONS;

  const [selectedMatieres, setSelectedMatieres] = useState<string[]>(
    role === 'professeur' ? profile.matieres_enseignees : []
  );
  const [showEmailForm, setShowEmailForm] = useState(false);

  function toggleMatiere(m: string) {
    setSelectedMatieres((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Formulaire profil principal ── */}
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

        {/* Email en lecture seule */}
        <div className="space-y-2">
          <Label>Adresse e-mail</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground select-all">
            {profile.email ?? '—'}
          </div>
          <p className="text-xs text-muted-foreground">
            Pour changer votre e-mail, utilisez la section ci-dessous.
          </p>
        </div>

        {/* Téléphones */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone_mobile">Mobile</Label>
            <Input
              id="phone_mobile"
              name="phone_mobile"
              type="tel"
              defaultValue={profile.phone_mobile ?? ''}
              placeholder="06 XX XX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_fixed">Téléphone fixe</Label>
            <Input
              id="phone_fixed"
              name="phone_fixed"
              type="tel"
              defaultValue={profile.phone_fixed ?? ''}
              placeholder="01 XX XX XX XX"
            />
          </div>
        </div>

        {role === 'professeur' && (
          <div className="space-y-2">
            <Label>Matières enseignées</Label>
            <input type="hidden" name="matieres_enseignees" value={selectedMatieres.join(',')} />
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3 sm:grid-cols-3">
              {matieresOptions.map((m) => {
                const checked = selectedMatieres.includes(m);
                return (
                  <label
                    key={m}
                    className={[
                      'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                      checked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMatiere(m)}
                      className="accent-primary"
                    />
                    {m}
                  </label>
                );
              })}
            </div>
            {selectedMatieres.length === 0 && (
              <p className="text-xs text-destructive">Sélectionnez au moins une matière.</p>
            )}
          </div>
        )}

        {role === 'admin' && (
          <div className="space-y-2">
            <Label htmlFor="fonction">Fonction</Label>
            <select
              id="fonction"
              name="fonction"
              defaultValue={profile.fonction ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Sélectionner —</option>
              {fonctionsOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
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
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">Profil mis à jour avec succès.</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending || (role === 'professeur' && selectedMatieres.length === 0)}>
            {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>

      {/* ── Changement d'email (section séparée) ── */}
      <div className="rounded-xl border border-slate-200/60">
        <button
          type="button"
          onClick={() => setShowEmailForm((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Mail className="h-4 w-4 text-slate-400" />
          Changer mon adresse e-mail
          <ChevronDown className={['ml-auto h-4 w-4 text-slate-400 transition-transform', showEmailForm ? 'rotate-180' : ''].join(' ')} />
        </button>

        {showEmailForm && (
          <form action={emailAction} className="border-t border-slate-100 px-4 py-4 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              L&apos;adresse e-mail sera mise à jour immédiatement. Vous devrez vous reconnecter avec la nouvelle adresse.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new_email">Nouvelle adresse e-mail</Label>
              <Input
                id="new_email"
                name="new_email"
                type="email"
                placeholder="nouvelle@email.fr"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_email">Confirmer la nouvelle adresse</Label>
              <Input
                id="confirm_email"
                name="confirm_email"
                type="email"
                placeholder="nouvelle@email.fr"
                required
                autoComplete="email"
              />
            </div>

            {emailState?.error && (
              <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{emailState.error}</p>
            )}
            {emailState?.success && (
              <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Adresse e-mail mise à jour. Reconnectez-vous avec votre nouvelle adresse.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={emailPending}>
                {emailPending ? 'Envoi…' : 'Envoyer le lien de confirmation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
