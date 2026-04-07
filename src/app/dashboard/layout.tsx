import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { DashboardSidebar } from '@/modules/auth/components/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    redirect('/auth/login');
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
