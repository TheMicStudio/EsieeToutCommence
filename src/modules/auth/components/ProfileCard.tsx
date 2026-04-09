import { ROLE_LABELS, type UserProfile } from '../types';
import { Mail } from 'lucide-react';

interface ProfileCardProps {
  userProfile: UserProfile;
}

function getInitials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

function getProfileDetails(userProfile: UserProfile): { label: string; value: string }[] {
  if (userProfile.role === 'eleve') {
    const p = userProfile.profile;
    return [
      { label: 'Parcours', value: p.type_parcours === 'alternant' ? 'Alternant' : 'Temps plein' },
      ...(p.role_secondaire ? [{ label: 'Rôle secondaire', value: p.role_secondaire === 'delegue' ? 'Délégué·e' : 'Ambassadeur·rice' }] : []),
    ];
  }
  if (userProfile.role === 'professeur') {
    const matieres = userProfile.profile.matieres_enseignees;
    return [{ label: 'Matières', value: matieres.length > 0 ? matieres.join(', ') : '—' }];
  }
  if (userProfile.role === 'admin') {
    return [{ label: 'Fonction', value: userProfile.profile.fonction ?? '—' }];
  }
  if (userProfile.role === 'entreprise') {
    return [
      { label: 'Entreprise', value: userProfile.profile.entreprise },
      { label: 'Poste', value: userProfile.profile.poste ?? '—' },
    ];
  }
  return [];
}

const ROLE_COLORS: Record<string, { badge: string; avatar: string; banner: string }> = {
  eleve:      { badge: 'bg-[#89aae6]/20 text-[#3685b5]', avatar: 'bg-[#89aae6]/30 text-[#3685b5]', banner: 'from-[#89aae6]/30 to-[#0471a6]/20' },
  professeur: { badge: 'bg-[#ac80a0]/20 text-[#ac80a0]', avatar: 'bg-[#ac80a0]/30 text-[#ac80a0]', banner: 'from-[#ac80a0]/30 to-[#89aae6]/20' },
  admin:      { badge: 'bg-[#0471a6]/20 text-[#0471a6]', avatar: 'bg-[#0471a6]/30 text-[#0471a6]', banner: 'from-[#0471a6]/30 to-[#3685b5]/20' },
  entreprise: { badge: 'bg-[#3685b5]/20 text-[#3685b5]', avatar: 'bg-[#3685b5]/30 text-[#3685b5]', banner: 'from-[#3685b5]/30 to-[#89aae6]/20' },
};

export function ProfileCard({ userProfile }: Readonly<ProfileCardProps>) {
  const { profile, role } = userProfile;
  const initials = getInitials(profile.prenom, profile.nom);
  const details = getProfileDetails(userProfile);
  const colors = ROLE_COLORS[role];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      {/* Bannière */}
      <div className={['h-24 bg-gradient-to-r', colors.banner].join(' ')} />

      {/* Avatar + nom */}
      <div className="px-6 pb-6">
        <div className="-mt-10 flex items-end gap-4">
          <div className={['flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-2xl font-bold shadow-md', colors.avatar].join(' ')}>
            {initials}
          </div>
          <div className="mb-1">
            <h2 className="text-xl font-bold text-[#061826]">
              {profile.prenom} {profile.nom}
            </h2>
            <span className={['mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', colors.badge].join(' ')}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        {/* Email */}
        {profile.email && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{profile.email}</span>
          </div>
        )}

        {/* Détails */}
        {details.length > 0 && (
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-3 text-sm">
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {d.label}
                </span>
                <span className="text-slate-700">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
