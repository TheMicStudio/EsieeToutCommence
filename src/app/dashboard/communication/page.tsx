import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getStaffChannels } from '@/modules/communication/actions';

export default async function CommunicationPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');
  if (profile.role !== 'admin' && profile.role !== 'professeur') redirect('/dashboard');

  const channels = await getStaffChannels();
  if (channels.length > 0) {
    redirect(`/dashboard/communication/${channels[0].id}`);
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Aucun canal disponible.</p>
    </div>
  );
}
