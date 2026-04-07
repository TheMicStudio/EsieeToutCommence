import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getAllTickets } from '@/modules/support/actions';
import { KanbanBoard } from '@/modules/support/components/KanbanBoard';
import { buttonVariants } from '@/components/ui/button';

export default async function AdminSupportPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  if (!profile || profile.role !== 'admin') redirect('/dashboard/support');

  const tickets = await getAllTickets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des tickets</h1>
          <p className="text-muted-foreground">Vue Kanban — {tickets.length} ticket(s) au total</p>
        </div>
        <Link href="/dashboard/support" className={buttonVariants({ variant: 'outline' })}>
          Vue liste
        </Link>
      </div>
      <KanbanBoard tickets={tickets} />
    </div>
  );
}
