import { getCurrentUserProfile } from '@/modules/auth/actions';
import { ProfileCard } from '@/modules/auth/components/ProfileCard';
import { ProfileEditForm } from '@/modules/auth/components/ProfileEditForm';
import { getSubjects, getAdminFunctions } from '@/modules/admin/config-actions';

export const metadata = { title: 'Mon profil — EsieeToutCommence' };

export default async function ProfilePage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  // Charger les listes dynamiques pour les rôles concernés
  const [subjects, adminFunctionsList] = await Promise.all([
    userProfile.role === 'professeur' ? getSubjects() : Promise.resolve([]),
    userProfile.role === 'admin' ? getAdminFunctions() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consultez et modifiez vos informations personnelles.
        </p>
      </div>

      {/* Carte de profil */}
      <ProfileCard userProfile={userProfile} />

      {/* Formulaire d'édition */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Modifier mon profil</p>
        <ProfileEditForm
          userProfile={userProfile}
          subjects={subjects.map((s) => s.nom)}
          adminFunctions={adminFunctionsList.map((f) => f.nom)}
        />
      </div>
    </div>
  );
}
