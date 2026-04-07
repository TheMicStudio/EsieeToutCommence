import { getCurrentUserProfile } from '@/modules/auth/actions';
import { ProfileCard } from '@/modules/auth/components/ProfileCard';
import { ProfileEditForm } from '@/modules/auth/components/ProfileEditForm';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Mon profil — Hub École' };

export default async function ProfilePage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez et modifiez vos informations personnelles.
        </p>
      </div>

      {/* Carte de profil (lecture) */}
      <ProfileCard userProfile={userProfile} />

      <Separator />

      {/* Formulaire d'édition */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Modifier mon profil</h2>
        <ProfileEditForm userProfile={userProfile} />
      </div>
    </div>
  );
}
