import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';
import {
  getRooms, getClosures,
  getClassesWithCalendar, getCalendarWeeks,
  getTeachersForPlanning, getAllTeacherWeekAvailabilities,
  getSubjectRequirements,
} from '@/modules/admin/planning-actions';
import { getPlanningRuns }       from '@/modules/planning/engine';
import {
  Upload, DoorOpen, CalendarOff, Calendar,
  Clock, BookOpen, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { CsvImportPanel }            from './CsvImportPanel';
import { RoomsPanel }                from './RoomsPanel';
import { ClosuresPanel }             from './ClosuresPanel';
import { CalendarPanel }             from './CalendarPanel';
import { AvailabilityPanel }         from './AvailabilityPanel';
import { SubjectRequirementsPanel }  from './SubjectRequirementsPanel';
import { PlanningEnginePanel }       from './PlanningEnginePanel';

export const metadata = { title: 'Planning — EsieeToutCommence' };

const TABS = [
  { id: 'import',    label: 'Import CSV',    icon: Upload },
  { id: 'salles',    label: 'Salles',        icon: DoorOpen },
  { id: 'fermetures',label: 'Fermetures',    icon: CalendarOff },
  { id: 'calendrier',label: 'Calendrier',    icon: Calendar },
  { id: 'dispos',    label: 'Disponibilités',icon: Clock },
  { id: 'matieres',  label: 'Matières',      icon: BookOpen },
  { id: 'moteur',    label: 'Moteur',        icon: Zap },
] as const;

type TabId = typeof TABS[number]['id'];

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') redirect('/dashboard');

  const { tab: rawTab = 'import' } = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === rawTab)
    ? (rawTab as TabId)
    : 'import';

  // Chargement conditionnel selon l'onglet actif
  const [rooms, closures, classes, teachers, runs] = await Promise.all([
    tab === 'salles'     ? getRooms()                : Promise.resolve([]),
    tab === 'fermetures' ? getClosures()             : Promise.resolve([]),
    (tab === 'calendrier' || tab === 'matieres' || tab === 'moteur') ? getClassesWithCalendar() : Promise.resolve([]),
    (tab === 'dispos' || tab === 'matieres') ? getTeachersForPlanning() : Promise.resolve([]),
    tab === 'moteur' ? getPlanningRuns()         : Promise.resolve([]),
  ]);

  // Disponibilités par semaine : une seule query pour tous les profs
  const weeksByTeacher: Record<string, string[]> = tab === 'dispos'
    ? await getAllTeacherWeekAvailabilities(teachers.map((t) => t.id))
    : {};

  // Calendrier : une query par classe
  const weeksByClass: Record<string, Awaited<ReturnType<typeof getCalendarWeeks>>> = {};
  if (tab === 'calendrier') {
    await Promise.all(
      classes.map(async (c) => {
        weeksByClass[c.id] = await getCalendarWeeks(c.id);
      })
    );
  }

  // Besoins matières : une query par classe
  const requirementsByClass: Record<string, Awaited<ReturnType<typeof getSubjectRequirements>>> = {};
  if (tab === 'matieres') {
    await Promise.all(
      classes.map(async (c) => {
        requirementsByClass[c.id] = await getSubjectRequirements(c.id);
      })
    );
  }

  const TAB_META: Record<TabId, { title: string; desc: string; iconBg: string; icon: React.ElementType; iconColor: string }> = {
    import: {
      title: 'Import CSV — Étudiants',
      desc: 'Importez le fichier exporté depuis votre logiciel de gestion (.xlsx, .xls ou .csv). Les comptes sont créés automatiquement avec un mot de passe temporaire.',
      iconBg: 'bg-[#89aae6]/20', icon: Upload, iconColor: 'text-[#3685b5]',
    },
    salles: {
      title: 'Salles de cours',
      desc: 'Configurez les salles disponibles. Le moteur de planning vérifie les conflits de salle automatiquement.',
      iconBg: 'bg-purple-100', icon: DoorOpen, iconColor: 'text-purple-600',
    },
    fermetures: {
      title: 'Fermetures scolaires',
      desc: 'Vacances, jours fériés, fermetures exceptionnelles. Le moteur n\'y planifiera aucune session.',
      iconBg: 'bg-amber-100', icon: CalendarOff, iconColor: 'text-amber-600',
    },
    calendrier: {
      title: 'Calendrier école / entreprise',
      desc: 'Configurez le rythme de présence de chaque classe : Temps plein, Pattern fixe (alternance) ou Manuel semaine par semaine.',
      iconBg: 'bg-emerald-100', icon: Calendar, iconColor: 'text-emerald-600',
    },
    dispos: {
      title: 'Disponibilités des professeurs',
      desc: 'Définissez les créneaux horaires disponibles de chaque professeur. Le moteur n\'affectera aucune session hors de ces plages.',
      iconBg: 'bg-blue-100', icon: Clock, iconColor: 'text-blue-600',
    },
    matieres: {
      title: 'Besoins par matière',
      desc: 'Définissez pour chaque classe le volume horaire total par matière, le professeur assigné et la durée type d\'une séance.',
      iconBg: 'bg-rose-100', icon: BookOpen, iconColor: 'text-rose-600',
    },
    moteur: {
      title: 'Moteur de planning',
      desc: 'Générez le planning annuel automatiquement, visualisez les conflits, puis publiez.',
      iconBg: 'bg-[#0471a6]/10', icon: Zap, iconColor: 'text-[#0471a6]',
    },
  };

  const meta = TAB_META[tab];
  const MetaIcon = meta.icon;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Gestion du Planning</h1>
        <p className="mt-1 text-sm text-slate-500">
          Importez les étudiants, configurez les salles, les fermetures, le calendrier et générez le planning annuel.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/dashboard/planning?tab=${t.id}`}
              className={[
                'flex flex-1 min-w-fit items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-white text-[#0471a6] shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-[#061826] hover:bg-white/60',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Contenu */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
        {/* Header de section */}
        <div className="flex items-start gap-4 mb-5">
          <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', meta.iconBg].join(' ')}>
            <MetaIcon className={['h-5 w-5', meta.iconColor].join(' ')} />
          </div>
          <div>
            <h2 className="font-bold text-[#061826]">{meta.title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{meta.desc}</p>
          </div>
        </div>
        <div className="h-px bg-slate-100 mb-5" />

        {tab === 'import' && <CsvImportPanel />}

        {tab === 'salles' && <RoomsPanel rooms={rooms} />}

        {tab === 'fermetures' && <ClosuresPanel closures={closures} />}

        {tab === 'calendrier' && (
          <CalendarPanel classes={classes} weeksByClass={weeksByClass} />
        )}

        {tab === 'dispos' && (
          <AvailabilityPanel
            teachers={teachers}
            weeksByTeacher={weeksByTeacher}
          />
        )}

        {tab === 'matieres' && (
          <SubjectRequirementsPanel
            classes={classes}
            teachers={teachers}
            requirementsByClass={requirementsByClass}
          />
        )}

        {tab === 'moteur' && (
          <PlanningEnginePanel
            initialRuns={runs as Parameters<typeof PlanningEnginePanel>[0]['initialRuns']}
            classes={classes}
          />
        )}
      </div>
    </div>
  );
}
