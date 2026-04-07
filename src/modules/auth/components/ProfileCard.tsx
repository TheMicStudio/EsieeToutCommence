import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ROLE_LABELS, type UserProfile } from '../types';

interface ProfileCardProps {
  userProfile: UserProfile;
}

function getInitials(nom: string, prenom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

function getProfileDetails(userProfile: UserProfile): { label: string; value: string }[] {
  if (userProfile.role === 'eleve') {
    const p = userProfile.profile;
    return [
      { label: 'Parcours', value: p.type_parcours === 'alternant' ? 'Alternant' : 'Temps plein' },
      ...(p.role_secondaire ? [{ label: 'Rôle secondaire', value: p.role_secondaire === 'delegue' ? 'Délégué' : 'Ambassadeur' }] : []),
    ];
  }
  if (userProfile.role === 'professeur') {
    return [{ label: 'Matières', value: userProfile.profile.matieres_enseignees.join(', ') || '—' }];
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

export function ProfileCard({ userProfile }: ProfileCardProps) {
  const { profile } = userProfile;
  const initials = getInitials(profile.nom, profile.prenom);
  const details = getProfileDetails(userProfile);

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary to-secondary" />
      <CardHeader className="-mt-10 pb-0">
        <div className="flex items-end gap-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-md">
            <AvatarFallback className="bg-accent text-accent-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <h2 className="text-xl font-semibold">
              {profile.prenom} {profile.nom}
            </h2>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[userProfile.role]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-4 space-y-3">
        {details.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="min-w-24 font-medium text-muted-foreground">{d.label}</span>
            <span className="text-foreground">{d.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
