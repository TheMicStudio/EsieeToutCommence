import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyEntries, getMyTripartiteChat } from '@/modules/career/actions';
import { ApprenticeshipList } from '@/modules/career/components/ApprenticeshipList';
import { UploadEntryForm } from '@/modules/career/components/UploadEntryForm';
import { ValidationPanel } from '@/modules/career/components/ValidationPanel';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Livret d\'apprentissage — Hub École' };

export default async function LivretPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  if (userProfile.role === 'eleve' && userProfile.profile.type_parcours !== 'alternant') {
    redirect('/dashboard/carriere');
  }
  if (userProfile.role === 'professeur') {
    redirect('/dashboard/carriere');
  }

  const chat = await getMyTripartiteChat();
  if (!chat) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Livret d&apos;apprentissage</h1>
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">
            Espace tripartite non configuré. Contactez l&apos;administration.
          </p>
        </div>
      </div>
    );
  }

  const entries = await getMyEntries();
  const isValidator = userProfile.role === 'admin' || userProfile.role === 'entreprise';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Livret d&apos;apprentissage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isValidator
            ? 'Validez les rendus déposés par l\'alternant'
            : 'Déposez vos rendus et suivez leur validation'}
        </p>
      </div>

      {/* Formulaire dépôt (élève uniquement) */}
      {userProfile.role === 'eleve' && (
        <>
          <UploadEntryForm chatId={chat.id} />
          <Separator />
        </>
      )}

      {/* Panel validation (référent / maître) */}
      {isValidator && (
        <>
          <ValidationPanel entries={entries} />
          <Separator />
        </>
      )}

      {/* Liste des rendus */}
      <div>
        <h2 className="mb-4 font-semibold">Tous les rendus ({entries.length})</h2>
        <ApprenticeshipList entries={entries} />
      </div>
    </div>
  );
}
