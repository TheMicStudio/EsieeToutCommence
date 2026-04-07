import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyTickets, getAllTickets } from '@/modules/support/actions';
import { TicketList } from '@/modules/support/components/TicketList';
import { buttonVariants } from '@/components/ui/button';

export default async function SupportPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  

  const isAdmin = profile.role === 'admin';
  const tickets = isAdmin ? await getAllTickets() : await getMyTickets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Tous les tickets de support' : 'Vos demandes de support'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/dashboard/support/admin" className={buttonVariants({ variant: 'outline' })}>
              Vue Kanban
            </Link>
          )}
          <Link href="/dashboard/support/nouveau" className={buttonVariants({})}>
            Nouveau ticket
          </Link>
        </div>
      </div>

      <TicketList tickets={tickets} />
    </div>
  );
}
