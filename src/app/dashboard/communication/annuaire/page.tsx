import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getStaffDirectory } from '@/modules/communication/actions';
import { StaffDirectoryList } from '@/modules/communication/components/StaffDirectoryList';

export default async function AnnuairePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'admin' && profile.role !== 'professeur') redirect('/dashboard');

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
