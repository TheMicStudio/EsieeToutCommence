import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { TicketForm } from '@/modules/support/components/TicketForm';

export default async function NouveauTicketPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');

  const isDelegue = profile.role === 'eleve' && 'est_delegue' in profile && profile.est_delegue === true;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau ticket</h1>
        <p className="text-muted-foreground">Décrivez votre problème ou votre demande</p>
      </div>
      <TicketForm isDelegue={isDelegue} />
    </div>
  );
}
