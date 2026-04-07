import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getSessionRecords } from '@/modules/attendance/actions';
import { QrCodeDisplay } from '@/modules/attendance/components/QrCodeDisplay';
import { createClient } from '@/lib/supabase/server';

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'professeur' && profile.role !== 'admin') redirect('/dashboard');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select()
    .eq('id', sessionId)
    .single();
  if (!session) notFound();

  if (session.statut === 'ferme') redirect(`/dashboard/emargement/rapport/${sessionId}`);

  // Taille de la classe
  const { count: classSize } = await supabase
    .from('class_members')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', session.class_id);

  const records = await getSessionRecords(sessionId);

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const scanBaseUrl = `${proto}://${host}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Session d&apos;appel en cours</h1>
        <p className="text-muted-foreground">
          Expire à {new Date(session.expiration).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <QrCodeDisplay
        session={session}
        classSize={classSize ?? 0}
        initialCount={records.length}
        scanBaseUrl={scanBaseUrl}
      />
    </div>
  );
}
