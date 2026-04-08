import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getSoutenanceSlots, getGroups } from '@/modules/projects/actions';
import { SoutenanceGrid } from '@/modules/projects/components/SoutenanceGrid';
import { createClient } from '@/lib/supabase/server';

interface SoutenancesPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function SoutenancesPage({ params }: SoutenancesPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  await requirePermission('soutenance.read');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const [slots, groups] = await Promise.all([
    getSoutenanceSlots(weekId),
    getGroups(weekId),
  ]);

  // Trouver le groupe de l'élève
  const myGroup = profile.role === 'eleve'
    ? groups.find((g) => g.members?.some((m) => m.student_id === currentUserId))
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#061826]">Créneaux de soutenance</h1>
      <SoutenanceGrid slots={slots} weekId={weekId} myGroupId={myGroup?.id} />
    </div>
  );
}
