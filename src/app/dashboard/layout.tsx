import { getCurrentUserProfile, signOut } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import { DashboardSidebar } from '@/modules/auth/components/DashboardSidebar';
import { TopNavbar } from './components/TopNavbar';
import { RightSidebar } from './components/RightSidebar';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FB] px-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#061826]">Profil introuvable</p>
          <p className="mt-1 text-sm text-slate-500">
            Votre compte existe mais votre profil est incomplet.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-[#0471a6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // getRequestPermissions est cache()-ée : pas de double requête si les pages l'appellent aussi
  const permissions = await getRequestPermissions();
  const permissionsArray = Array.from(permissions);

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-[#F7F9FB]">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-[#89aae6]/30 blur-[80px]" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-32 h-[360px] w-[360px] rounded-full bg-[#ac80a0]/20 blur-[80px]" />
        <div className="absolute -bottom-24 left-1/3 h-[300px] w-[300px] rounded-full bg-[#0471a6]/15 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-full lg:gap-4 lg:p-5">
        <DashboardSidebar userProfile={userProfile} permissions={permissionsArray} />

        <div className="flex flex-1 flex-col min-w-0 gap-6 p-4 lg:p-0 lg:overflow-hidden">
          <TopNavbar userProfile={userProfile} />
          <main className="flex-1 overflow-y-auto min-w-0 pb-2">
            {children}
          </main>
        </div>

        <RightSidebar userProfile={userProfile} />
      </div>
    </div>
  );
}
