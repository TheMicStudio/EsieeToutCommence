import Link from 'next/link';
import { requirePermission } from '@/lib/permissions';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getSoutenanceSlots, getGroups } from '@/modules/projects/actions';
import { SoutenanceGrid } from '@/modules/projects/components/SoutenanceGrid';
import { CreateSoutenanceSlotsForm } from '@/modules/projects/components/CreateSoutenanceSlotsForm';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft } from 'lucide-react';

interface SoutenancesPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function SoutenancesPage({ params }: Readonly<SoutenancesPageProps>) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  await requirePermission('soutenance.read');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';
  const isProf = profile.role === 'professeur' || profile.role === 'coordinateur' || profile.role === 'admin';

  const [slots, groups] = await Promise.all([
    getSoutenanceSlots(weekId),
    getGroups(weekId),
  ]);

  const myGroup = !isProf
    ? groups.find((g) => g.members?.some((m) => m.student_id === currentUserId))
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/pedagogie/projets/${weekId}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Retour au projet
        </Link>
        <h1 className="text-2xl font-bold text-[#061826]">Passages oraux</h1>
        <p className="text-sm text-slate-500">
          {slots.length > 0
            ? `${slots.length} créneau${slots.length > 1 ? 'x' : ''} · ${groups.length} groupe${groups.length > 1 ? 's' : ''}`
            : 'Aucun créneau défini'}
        </p>
      </div>

      {/* Formulaire prof */}
      {isProf && (
        <CreateSoutenanceSlotsForm
          weekId={weekId}
          groupCount={groups.length}
          hasSlots={slots.length > 0}
        />
      )}

      {/* Grille des créneaux */}
      {slots.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <p className="font-semibold text-[#061826]">
              {isProf ? 'Ordre de passage' : 'Votre créneau'}
            </p>
            {!isProf && !myGroup && (
              <p className="mt-0.5 text-xs text-amber-600">Rejoignez un groupe pour réserver un créneau</p>
            )}
          </div>
          <div className="p-5">
            <SoutenanceGrid slots={slots} weekId={weekId} myGroupId={myGroup?.id} isProf={isProf} />
          </div>
        </div>
      )}

      {slots.length === 0 && !isProf && (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Le professeur n&apos;a pas encore défini les créneaux.</p>
        </div>
      )}
    </div>
  );
}
