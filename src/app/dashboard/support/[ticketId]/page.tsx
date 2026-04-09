import { redirect, notFound } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getTicketById, getTicketMessages } from '@/modules/support/actions';
import { getStaffDirectory } from '@/modules/communication/actions';
import { TicketThread } from '@/modules/support/components/TicketThread';
import { createClient } from '@/lib/supabase/server';

interface TicketPageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function TicketPage({ params }: Readonly<TicketPageProps>) {
  await requirePermission('support.use');
  const perms = await getRequestPermissions();
  const { ticketId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const ticket = await getTicketById(ticketId);
  if (!ticket) notFound();

  const canManage = perms.has('support.manage');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const isOwner = ticket.auteur_id === currentUserId;
  if (!canManage && !isOwner) redirect('/dashboard/support');

  const [messages, directory] = await Promise.all([
    getTicketMessages(ticketId),
    getStaffDirectory(),
  ]);

  const authorNames: Record<string, string> = {};
  for (const contact of directory) {
    authorNames[contact.id] = `${contact.prenom} ${contact.nom}`;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <TicketThread
        ticket={ticket}
        messages={messages}
        authorNames={authorNames}
        currentUserId={currentUserId}
        isAdmin={canManage}
      />
    </div>
  );
}
