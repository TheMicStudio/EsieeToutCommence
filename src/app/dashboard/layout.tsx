import { getCurrentUserProfile, signOut } from '@/modules/auth/actions';
import { DashboardSidebar } from '@/modules/auth/components/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userProfile = await getCurrentUserProfile();

  // Si authentifié mais pas de profil : afficher une erreur avec déconnexion.
  // NE PAS rediriger vers /auth/* — le middleware renverrait vers /dashboard → boucle.
  if (!userProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg font-semibold">Profil introuvable</p>
        <p className="text-sm text-muted-foreground">
          Votre compte existe mais votre profil est incomplet.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <DashboardSidebar userProfile={userProfile} />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
