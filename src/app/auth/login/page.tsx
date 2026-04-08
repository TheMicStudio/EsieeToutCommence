import { Suspense } from 'react';
import { GraduationCap } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const metadata = { title: 'Connexion — EsieeToutCommence' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EsieeToutCommence</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Connexion</h2>
          <Suspense><LoginForm /></Suspense>
        </div>
      </div>
    </main>
  );
}
