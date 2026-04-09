import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { requirePermission } from '@/lib/permissions';
import { QrCodeDisplay } from '@/modules/attendance/components/QrCodeDisplay';
import { createClient } from '@/lib/supabase/server';

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;

  await requirePermission('attendance.manage');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select()
    .eq('id', sessionId)
    .single();
  if (!session) notFound();

  if (session.statut === 'ferme') redirect(`/dashboard/emargement/rapport/${sessionId}`);

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const scanBaseUrl = `${proto}://${host}`;

  return <QrCodeDisplay session={session} scanBaseUrl={scanBaseUrl} />;
}
