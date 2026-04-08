import Link from 'next/link';
import { Briefcase, Calendar, GraduationCap, MessageSquare } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Carrière — EsieeToutCommence' };

export default async function CarrierePage() {
  const perms = await getRequestPermissions();
  if (!perms.has('career_event.read') && !perms.has('alternance.access') && !perms.has('alternance.validate')) {
    redirect('/dashboard');
  }
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isEleve = userProfile.role === 'eleve';
  const isAlternant = isEleve && userProfile.profile.type_parcours === 'alternant';
  const isAdmin = userProfile.role === 'admin';
  const isEntreprise = userProfile.role === 'entreprise';

  type CarriereItem = { href: string; label: string; icon: typeof Briefcase; description: string; gradient: string; iconBg: string };

  const tempsPleinItems: CarriereItem[] = [
    { href: '/dashboard/carriere/job-board', label: 'Job Board', icon: Briefcase, description: "Offres de stages et d'alternance sélectionnées", gradient: 'from-[#89aae6]/10 to-[#3685b5]/5', iconBg: 'bg-[#89aae6]/20 text-[#3685b5]' },
    { href: '/dashboard/carriere/evenements', label: 'Événements', icon: Calendar, description: 'Forums, ateliers CV, journées portes ouvertes', gradient: 'from-amber-50 to-amber-50/30', iconBg: 'bg-amber-100 text-amber-500' },
  ];
  const alternantItems: CarriereItem[] = [
    { href: '/dashboard/carriere/tripartite', label: 'Espace tripartite', icon: MessageSquare, description: "Chat avec votre référent et maître d'apprentissage", gradient: 'from-[#ac80a0]/10 to-[#ac80a0]/5', iconBg: 'bg-[#ac80a0]/20 text-[#ac80a0]' },
    { href: '/dashboard/carriere/livret', label: "Livret d'apprentissage", icon: GraduationCap, description: 'Déposez et suivez vos rendus périodiques', gradient: 'from-[#89aae6]/10 to-[#3685b5]/5', iconBg: 'bg-[#89aae6]/20 text-[#3685b5]' },
    { href: '/dashboard/carriere/job-board', label: 'Job Board', icon: Briefcase, description: "Offres de stages et d'alternance", gradient: 'from-amber-50 to-amber-50/30', iconBg: 'bg-amber-100 text-amber-500' },
    { href: '/dashboard/carriere/evenements', label: 'Événements', icon: Calendar, description: 'Forums et journées portes ouvertes', gradient: 'from-emerald-50 to-emerald-50/30', iconBg: 'bg-emerald-100 text-emerald-500' },
  ];
  const adminItems: CarriereItem[] = [
    { href: '/dashboard/carriere/job-board', label: 'Gérer les offres', icon: Briefcase, description: "Publier et gérer les offres d'emploi", gradient: 'from-[#89aae6]/10 to-[#3685b5]/5', iconBg: 'bg-[#89aae6]/20 text-[#3685b5]' },
    { href: '/dashboard/carriere/evenements', label: 'Gérer les événements', icon: Calendar, description: 'Créer et gérer les événements carrière', gradient: 'from-amber-50 to-amber-50/30', iconBg: 'bg-amber-100 text-amber-500' },
  ];
  const entrepriseItems: CarriereItem[] = [
    { href: '/dashboard/carriere/tripartite', label: 'Espace tripartite', icon: MessageSquare, description: "Chat avec votre alternant et le référent pédagogique", gradient: 'from-[#ac80a0]/10 to-[#ac80a0]/5', iconBg: 'bg-[#ac80a0]/20 text-[#ac80a0]' },
    { href: '/dashboard/carriere/livret', label: "Livret d'apprentissage", icon: GraduationCap, description: 'Consulter et valider les entrées de votre alternant', gradient: 'from-[#89aae6]/10 to-[#3685b5]/5', iconBg: 'bg-[#89aae6]/20 text-[#3685b5]' },
  ];

  const items = isAdmin ? adminItems : isEntreprise ? entrepriseItems : isAlternant ? alternantItems : tempsPleinItems;

  const subtitle = isEntreprise ? 'Suivez votre alternant et validez son livret'
    : isAlternant ? 'Espace dédié à votre parcours en alternance'
    : isAdmin ? 'Gestion des offres et événements carrière'
    : 'Trouvez votre stage ou alternance';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0471a6]/10">
              <Briefcase className="h-5 w-5 text-[#0471a6]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061826]">Carrière</h1>
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          {isEleve && (
            <span className={['rounded-2xl px-3.5 py-2 text-sm font-semibold', isAlternant ? 'bg-[#ac80a0]/10 text-[#ac80a0]' : 'bg-slate-100 text-slate-600'].join(' ')}>
              {isAlternant ? 'Alternant' : 'Temps plein'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <div className={['h-full rounded-3xl border border-slate-200/70 bg-gradient-to-br shadow-card p-6 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5', item.gradient].join(' ')}>
                <div className={['mb-4 flex h-11 w-11 items-center justify-center rounded-2xl', item.iconBg].join(' ')}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-[#061826]">{item.label}</p>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
