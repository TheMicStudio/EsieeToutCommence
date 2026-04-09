import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getStaffDirectory } from '@/modules/communication/actions';
import { StaffDirectoryList } from '@/modules/communication/components/StaffDirectoryList';

export default async function AnnuairePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  await requirePermission('staff_channel.participate');

  const contacts = await getStaffDirectory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annuaire staff</h1>
        <p className="text-muted-foreground">{contacts.length} membre(s) de l&apos;équipe éducative</p>
      </div>
      <StaffDirectoryList contacts={contacts} />
    </div>
  );
}
