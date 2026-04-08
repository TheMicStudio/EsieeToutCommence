import { getCurrentUserProfile, signOut } from '@/modules/auth/actions';
import { DashboardSidebar } from '@/modules/auth/components/DashboardSidebar';
import { TopNavbar } from './components/TopNavbar';
import { RightSidebar } from './components/RightSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex min-h-screen bg-[#F7F9FB]">
      {/* Blobs décoratifs */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 -right-40 h-96 w-96 rounded-full bg-[#89aae6]/25 blur-3xl z-0"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#ac80a0]/20 blur-3xl z-0"
      />

      {/* Sidebar gauche */}
      <DashboardSidebar userProfile={userProfile} />

      {/* Zone centrale + droite */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        {/* Mobile header is inside DashboardSidebar, this handles the main content column */}
        <div className="flex flex-1 min-h-0">
          {/* Main column */}
          <div className="flex flex-1 flex-col min-w-0 gap-4 p-4 lg:p-5">
            {/* Navbar pill */}
            <TopNavbar userProfile={userProfile} />

            {/* Page content */}
            <div className="flex flex-1 gap-4">
              <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
              </main>

              {/* Right sidebar */}
              <RightSidebar userProfile={userProfile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
