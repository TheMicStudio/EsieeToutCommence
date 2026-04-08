import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getAllTickets, getAdminList } from '@/modules/support/actions';
import { KanbanBoard } from '@/modules/support/components/KanbanBoard';

export default async function AdminSupportPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  if (profile.role !== 'admin') redirect('/dashboard/support');

  const [tickets, admins] = await Promise.all([getAllTickets(), getAdminList()]);

  const open = tickets.filter((t) => t.statut === 'ouvert').length;
  const inProgress = tickets.filter((t) => t.statut === 'en_cours').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Gestion des tickets</h1>
          <p className="mt-1 text-sm text-slate-500">{tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total</p>
        </div>
        {open > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
            {open} à traiter
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'À traiter', value: open, color: 'bg-red-50 border-red-200/60', text: 'text-red-600' },
          { label: 'En cours', value: inProgress, color: 'bg-amber-50 border-amber-200/60', text: 'text-amber-600' },
          { label: 'Résolus', value: tickets.filter((t) => t.statut === 'resolu').length, color: 'bg-emerald-50 border-emerald-200/60', text: 'text-emerald-600' },
          { label: 'Fermés', value: tickets.filter((t) => t.statut === 'ferme').length, color: 'bg-slate-50 border-slate-200/60', text: 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className={['rounded-2xl border p-4 text-center', s.color].join(' ')}>
            <p className={['text-2xl font-bold', s.text].join(' ')}>{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <KanbanBoard tickets={tickets} admins={admins} />
    </div>
  );
}
