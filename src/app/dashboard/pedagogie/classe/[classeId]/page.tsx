import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, FolderKanban, GraduationCap, History, QrCode, Star } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyAllClasses, getMyTeacherClasses } from '@/modules/pedagogy/actions';

const MODULE_ITEMS = [
  { key: 'notes',       label: 'Notes & moyennes',    description: 'Résultats et progression des élèves',      icon: Star,         gradient: 'from-amber-50 to-amber-50/30',      iconBg: 'bg-amber-100 text-amber-500',      profOnly: false },
  { key: 'projets',     label: 'Semaines projets',    description: 'Semaines projets et groupes',              icon: FolderKanban, gradient: 'from-emerald-50 to-emerald-50/30',   iconBg: 'bg-emerald-100 text-emerald-600',  profOnly: false },
  { key: 'emargement',  label: 'Émargement',          description: 'Lancer et gérer les appels de présence',  icon: QrCode,       gradient: 'from-violet-50 to-violet-50/30',    iconBg: 'bg-violet-100 text-violet-600',    profOnly: true  },
];

interface ClasseDetailPageProps {
  params: Promise<{ classeId: string }>;
}

export default async function ClasseDetailPage({ params }: ClasseDetailPageProps) {
  const { classeId } = await params;
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';

  // Vérifier que la classe appartient bien à l'utilisateur
  let activeClass: { id: string; nom: string; annee: string | number } | null = null;
  let isPastClass = false;

  if (isProf) {
    const classes = await getMyTeacherClasses();
    activeClass = classes.find((c) => c.id === classeId) ?? null;
  } else {
    const allClasses = await getMyAllClasses();
    const found = allClasses.find((c) => c.id === classeId);
    if (found) {
      activeClass = found;
      isPastClass = !found.is_current;
    }
  }

  if (!activeClass) redirect('/dashboard/pedagogie');

  const modules = MODULE_ITEMS.filter((m) => !m.profOnly || isProf);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/pedagogie"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isPastClass ? 'bg-slate-100' : 'bg-[#0471a6]/15'].join(' ')}>
            <GraduationCap className={['h-5 w-5', isPastClass ? 'text-slate-400' : 'text-[#0471a6]'].join(' ')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#061826] truncate">{activeClass.nom}</h1>
              {isPastClass && (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  <History className="h-3 w-3" />
                  Archivée
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Promotion {activeClass.annee}</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Modules</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon;
            const href = `/dashboard/pedagogie/${item.key}?classe=${activeClass!.id}`;
            return (
              <Link key={item.key} href={href} className="group block">
                <div className={['h-full rounded-2xl border border-slate-200/60 bg-gradient-to-br p-5 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5', item.gradient].join(' ')}>
                  <div className={['mb-4 flex h-10 w-10 items-center justify-center rounded-xl', item.iconBg].join(' ')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-[#061826]">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
