import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { QrScanner } from '@/modules/attendance/components/QrScanner';

export default async function ScanPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  await requirePermission('attendance.read_own');

  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pointer ma présence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scannez le QR Code affiché par votre professeur
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
