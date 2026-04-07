import { getCurrentUserProfile } from '@/modules/auth/actions';
import { ROLE_LABELS } from '@/modules/auth/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Briefcase, GraduationCap, MessageSquare, QrCode, Users } from 'lucide-react';

export const metadata = { title: 'Tableau de bord — Hub École' };

const ROLE_WELCOME: Record<string, { title: string; subtitle: string }> = {
  eleve: {
    title: 'Bonjour !',
    subtitle: 'Retrouvez vos cours, vos notes et votre espace carrière.',
  },
  professeur: {
    title: 'Bonjour !',
    subtitle: 'Gérez vos classes, vos cours et les émargements.',
  },
  admin: {
    title: 'Bienvenue !',
    subtitle: 'Gérez les tickets support et la communication interne.',
  },
  entreprise: {
    title: 'Bienvenue !',
    subtitle: 'Suivez vos alternants et gérez le livret d\'apprentissage.',
  },
};

const ROLE_CARDS: Record<string, { title: string; description: string; icon: React.ElementType; href: string }[]> = {
  eleve: [
    { title: 'Mes cours', description: 'Accédez à vos supports de cours', icon: BookOpen, href: '/dashboard/cours' },
    { title: 'Carrière', description: 'Offres de stage, alternance et événements', icon: Briefcase, href: '/dashboard/carriere' },
    { title: 'Support', description: 'Ouvrir un ticket ou consulter la FAQ', icon: MessageSquare, href: '/dashboard/support' },
    { title: 'Annuaire', description: 'Trombinoscope de la promotion', icon: Users, href: '/dashboard/annuaire' },
  ],
  professeur: [
    { title: 'Mes classes', description: 'Cours, notes et chat de classe', icon: GraduationCap, href: '/dashboard/classes' },
    { title: 'Émargement', description: 'Générer un QR code de présence', icon: QrCode, href: '/dashboard/emargement' },
    { title: 'Communication', description: 'Canaux staff internes', icon: MessageSquare, href: '/dashboard/communication' },
    { title: 'Annuaire', description: 'Trombinoscope de la promotion', icon: Users, href: '/dashboard/annuaire' },
  ],
  admin: [
    { title: 'Support', description: 'Kanban des tickets ouverts', icon: MessageSquare, href: '/dashboard/support' },
    { title: 'Communication', description: 'Canaux staff internes', icon: MessageSquare, href: '/dashboard/communication' },
    { title: 'Annuaire', description: 'Annuaire complet', icon: Users, href: '/dashboard/annuaire' },
  ],
  entreprise: [
    { title: 'Alternance', description: 'Suivi et livret de vos alternants', icon: Briefcase, href: '/dashboard/alternance' },
    { title: 'Annuaire', description: 'Contacts de l\'école', icon: Users, href: '/dashboard/annuaire' },
  ],
};

export default async function DashboardPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const { profile, role } = userProfile;
  const welcome = ROLE_WELCOME[role];
  const cards = ROLE_CARDS[role] ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {welcome.title}{' '}
            <span className="text-primary">{profile.prenom}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">{welcome.subtitle}</p>
        </div>
        <Badge variant="secondary" className="w-fit text-sm">
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      {/* Raccourcis modules */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <a key={card.href} href={card.href}>
              <Card className="group h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="mt-3 text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
