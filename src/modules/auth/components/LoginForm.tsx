'use client';

import { useActionState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const QUICK_ACCOUNTS = [
  { label: 'Élève',      email: 'etudiant@hub-ecole.dev',  color: 'bg-[#89aae6]/15 text-[#3685b5] hover:bg-[#89aae6]/30 border-[#89aae6]/30' },
  { label: 'Prof',       email: 'prof@hub-ecole.dev',       color: 'bg-[#ac80a0]/15 text-[#ac80a0] hover:bg-[#ac80a0]/25 border-[#ac80a0]/30' },
  { label: 'Admin',      email: 'admin@hub-ecole.dev',      color: 'bg-[#0471a6]/10 text-[#0471a6] hover:bg-[#0471a6]/20 border-[#0471a6]/30' },
  { label: 'Entreprise', email: 'entreprise@hub-ecole.dev', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const [isQuickLogging, startQuickLogin] = useTransition();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  function handleQuickLogin(email: string) {
    startQuickLogin(async () => {
      const fd = new FormData();
      fd.set('email', email);
      fd.set('password', 'Test1234!');
      await signIn(null, fd);
    });
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          name="email"
          type="email"
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {errorParam === 'no_profile' && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Votre compte existe mais votre profil est incomplet. Reconnectez-vous ou contactez un administrateur.
        </p>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Connexion en cours…' : 'Se connecter'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>

      {/* Accès rapide comptes de test */}
      <div className="rounded-xl border border-dashed border-slate-200 p-3">
        <p className="mb-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Accès rapide (dev)</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={pending || isQuickLogging}
              onClick={() => handleQuickLogin(acc.email)}
              className={['rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50', acc.color].join(' ')}
            >
              {isQuickLogging ? '…' : acc.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
