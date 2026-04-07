import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getAttendanceReport } from '@/modules/attendance/actions';
import { AttendanceReport } from '@/modules/attendance/components/AttendanceReport';
import { buttonVariants } from '@/components/ui/button';

interface RapportPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function RapportPage({ params }: RapportPageProps) {
  const { sessionId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'professeur' && profile.role !== 'admin') redirect('/dashboard');

  const report = await getAttendanceReport(sessionId);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapport de présence</h1>
          <p className="text-muted-foreground">
            Session du {new Date(report.session.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <Link href="/dashboard/emargement" className={buttonVariants({ variant: 'outline' })}>
          Retour
        </Link>
      </div>
      <AttendanceReport report={report} />
    </div>
  );
}
