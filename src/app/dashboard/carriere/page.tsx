import Link from 'next/link';
import { Briefcase, Calendar, GraduationCap, MessageSquare } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Carrière — Hub École' };

export default async function CarrierePage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isEleve = userProfile.role === 'eleve';
  const isAlternant = isEleve && userProfile.profile.type_parcours === 'alternant';
  const isAdmin = userProfile.role === 'admin';

  const tempsPleinItems = [
    { href: '/dashboard/carriere/job-board', label: 'Job Board', icon: Briefcase, description: 'Offres de stages et d\'alternance' },
    { href: '/dashboard/carriere/evenements', label: 'Événements', icon: Calendar, description: 'Forums, ateliers CV, journées portes ouvertes' },
  ];

  const alternantItems = [
    { href: '/dashboard/carriere/tripartite', label: 'Espace tripartite', icon: MessageSquare, description: 'Chat avec votre référent et maître d\'apprentissage' },
    { href: '/dashboard/carriere/livret', label: 'Livret d\'apprentissage', icon: GraduationCap, description: 'Déposez et suivez vos rendus' },
  ];

  const adminItems = [
    { href: '/dashboard/carriere/job-board', label: 'Gérer les offres', icon: Briefcase, description: 'Publier et gérer les offres d\'emploi' },
    { href: '/dashboard/carriere/evenements', label: 'Gérer les événements', icon: Calendar, description: 'Créer et gérer les événements carrière' },
  ];

  const items = isAdmin ? adminItems : isAlternant ? alternantItems : isEleve ? tempsPleinItems : tempsPleinItems;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carrière</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAlternant
              ? 'Espace dédié à votre parcours en alternance'
              : isAdmin
              ? 'Gestion des offres et événements carrière'
              : 'Trouvez votre stage ou alternance'}
          </p>
        </div>
        {isEleve && (
          <Badge variant={isAlternant ? 'default' : 'secondary'}>
            {isAlternant ? 'Alternant' : 'Temps plein'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="group h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="mt-3 text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
