import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getStaffChannels } from '@/modules/communication/actions';
import { CreateChannelForm } from '@/modules/communication/components/CreateChannelForm';

export default async function CommunicationPage() {
  await requirePermission('staff_channel.participate');
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const perms = await getRequestPermissions();
  const canManageChannels = perms.has('staff_channel.manage');

  const channels = await getStaffChannels();
  if (channels.length > 0) {
    redirect(`/dashboard/communication/${channels[0].id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Communication</h1>
        <p className="mt-1 text-sm text-slate-500">Canaux de communication de l&apos;équipe</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-slate-200/60 bg-white py-16 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <span className="text-2xl">💬</span>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">Aucun canal de communication</p>
          <p className="mt-1 text-sm text-slate-500">
            {canManageChannels
              ? "Créez le premier canal pour commencer à échanger avec l'équipe."
              : 'Aucun canal disponible pour le moment. Contactez l\'administration.'}
          </p>
        </div>
        {canManageChannels && (
          <div className="w-full max-w-sm px-6">
            <CreateChannelForm />
          </div>
        )}
      </div>
    </div>
  );
}
