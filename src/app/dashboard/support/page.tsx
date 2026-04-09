import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyTickets } from '@/modules/support/actions';
import { TicketList } from '@/modules/support/components/TicketList';
import { NewTicketModal } from '@/modules/support/components/NewTicketModal';

export default async function SupportPage() {
  await requirePermission('support.use');
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  if (profile.role === 'admin' || profile.role === 'staff') redirect('/dashboard/support/admin');

  const tickets = await getMyTickets();

  const open = tickets.filter((t) => t.statut !== 'ferme').length;
  const closed = tickets.filter((t) => t.statut === 'ferme').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Support</h1>
          <p className="mt-1 text-sm text-slate-500">Vos demandes et tickets d&apos;assistance</p>
        </div>
        <NewTicketModal isDelegue={profile.role === 'eleve' && (profile.profile as { role_secondaire?: string }).role_secondaire === 'delegue'} />
      </div>

      {/* Stats rapides */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: tickets.length, color: 'bg-slate-100 text-slate-600' },
            { label: 'En cours', value: open, color: 'bg-[#89aae6]/20 text-[#3685b5]' },
            { label: 'Fermés', value: closed, color: 'bg-emerald-100 text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-[#061826]">{s.value}</p>
              <p className={['mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', s.color].join(' ')}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste des tickets */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Aucun ticket</p>
            <p className="text-sm text-slate-500">Créez votre premier ticket si vous avez une demande.</p>
            <NewTicketModal isDelegue={profile.role === 'eleve' && (profile.profile as { role_secondaire?: string }).role_secondaire === 'delegue'} variant="ghost" />
          </div>
        ) : (
          <div className="p-4">
            <TicketList tickets={tickets} />
          </div>
        )}
      </div>
    </div>
  );
}
