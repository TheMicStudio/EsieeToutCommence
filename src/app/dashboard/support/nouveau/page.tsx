import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { TicketForm } from '@/modules/support/components/TicketForm';

export default async function NouveauTicketPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  

  const isDelegue = profile.role === 'eleve' && profile.profile.role_secondaire === 'delegue';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Nouveau ticket</h1>
        <p className="mt-1 text-sm text-slate-500">Décrivez votre problème ou votre demande avec précision</p>
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <TicketForm isDelegue={isDelegue} />
      </div>
    </div>
  );
}
