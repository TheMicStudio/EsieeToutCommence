'use client';

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn } from '../actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUICK_ACCOUNTS = [
  { label: 'Élève',        email: 'etudiant@hub-ecole.dev',     color: 'bg-[#89aae6]/15 text-[#3685b5] hover:bg-[#89aae6]/30 border-[#89aae6]/30' },
  { label: 'Prof',         email: 'prof@hub-ecole.dev',         color: 'bg-[#ac80a0]/15 text-[#ac80a0] hover:bg-[#ac80a0]/25 border-[#ac80a0]/30' },
  { label: 'Resp. péda.', email: 'coordinateur@hub-ecole.dev', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
  { label: 'Secrétariat', email: 'staff@hub-ecole.dev',        color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { label: 'Admin',        email: 'admin@hub-ecole.dev',        color: 'bg-[#0471a6]/10 text-[#0471a6] hover:bg-[#0471a6]/20 border-[#0471a6]/30' },
  { label: 'Tuteur pro',  email: 'entreprise@hub-ecole.dev',   color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [showPassword, setShowPassword] = useState(false);

  /* Hidden form for quick login — avoids forwardRef issues */
  const quickFormRef = useRef<HTMLFormElement>(null);
  const quickEmailRef = useRef<HTMLInputElement>(null);
  const quickPasswordRef = useRef<HTMLInputElement>(null);

  function handleQuickLogin(email: string) {
    if (!quickFormRef.current || !quickEmailRef.current || !quickPasswordRef.current) return;
    quickEmailRef.current.value = email;
    quickPasswordRef.current.value = process.env.NEXT_PUBLIC_DEMO_PASS ?? '';
    quickFormRef.current.requestSubmit();
  }

  return (
    <>
      {/* Hidden quick-login form */}
      <form ref={quickFormRef} action={action} className="hidden" aria-hidden="true">
        <input ref={quickEmailRef} name="email" type="email" />
        <input ref={quickPasswordRef} name="password" type="password" />
      </form>

      <form action={action} className="space-y-4">

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-[#1E293B]">
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre.email@ecole.fr"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              className="pl-10 h-12 border-[#E2E8F0] rounded-lg text-[14px] placeholder:text-slate-400 focus-visible:ring-[#00A3E0]/30 focus-visible:border-[#00A3E0]"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-[#1E293B]">
              Mot de passe
            </label>
            <Link
              href="#"
              className="text-[13px] font-medium text-[#00A3E0] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="pl-10 pr-12 h-12 border-[#E2E8F0] rounded-lg text-[14px] placeholder:text-slate-400 focus-visible:ring-[#00A3E0]/30 focus-visible:border-[#00A3E0]"
            />
            {/* Toggle show/hide */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword
                ? <EyeOff className="h-3.5 w-3.5" />
                : <Eye className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        </div>

        {/* Error messages */}
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

        {/* CTA */}
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-lg text-[14px] font-bold text-white mt-6 cursor-pointer"
          style={{ background: '#00A3E0', border: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,163,224,0.9)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#00A3E0'; }}
        >
          {pending ? 'Connexion…' : 'Se connecter'}
        </Button>

        {/* Accès rapide (dev) */}
        <div className="rounded-xl border border-dashed border-slate-200 p-3 mt-4">
          <p className="mb-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Accès rapide (dev)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={pending}
                onClick={() => handleQuickLogin(acc.email)}
                className={[
                  'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                  acc.color,
                ].join(' ')}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </>
  );
}
