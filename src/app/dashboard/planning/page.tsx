import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';
import { getRooms, getClosures } from '@/modules/admin/planning-actions';
import {
  Upload,
  DoorOpen,
  CalendarOff,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { CsvImportPanel } from './CsvImportPanel';
import { RoomsPanel } from './RoomsPanel';
import { ClosuresPanel } from './ClosuresPanel';

export const metadata = { title: 'Planning — EsieeToutCommence' };

const TABS = [
  { id: 'import',    label: 'Import CSV',    icon: Upload },
  { id: 'salles',    label: 'Salles',        icon: DoorOpen },
  { id: 'fermetures',label: 'Fermetures',    icon: CalendarOff },
  { id: 'calendrier',label: 'Calendrier',    icon: Calendar },
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

  const [rooms, closures] = await Promise.all([
    tab === 'salles'     ? getRooms()    : Promise.resolve([]),
    tab === 'fermetures' ? getClosures() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Gestion du Planning</h1>
        <p className="mt-1 text-sm text-slate-500">
          Importez les étudiants, configurez les salles, les fermetures et générez le planning annuel.
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
                'flex flex-1 min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-white text-[#0471a6] shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-[#061826] hover:bg-white/60',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Contenu par onglet */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
        {tab === 'import' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#89aae6]/20">
                <Upload className="h-5 w-5 text-[#3685b5]" />
              </div>
              <div>
                <h2 className="font-bold text-[#061826]">Import CSV — Étudiants</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Importez le fichier exporté depuis votre logiciel de gestion.
                  Les comptes sont créés automatiquement avec un mot de passe temporaire.
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <CsvImportPanel />
          </div>
        )}

        {tab === 'salles' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                <DoorOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-[#061826]">Salles de cours</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Configurez les salles disponibles. Elles seront assignées lors de la génération
                  du planning. La vérification de conflit de salle est automatique.
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <RoomsPanel rooms={rooms} />
          </div>
        )}

        {tab === 'fermetures' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <CalendarOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-[#061826]">Fermetures scolaires</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Définissez les vacances, jours fériés et fermetures exceptionnelles.
                  Le moteur de planning ne planifiera aucune session sur ces périodes.
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <ClosuresPanel closures={closures} />
          </div>
        )}

        {tab === 'calendrier' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-[#061826]">Calendrier école / entreprise</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Configurez le rythme de présence de chaque classe. Disponible après import CSV.
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Calendar className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Bientôt disponible</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Cette section sera active après l&apos;import des classes via CSV.
                Vous pourrez configurer le mode (Temps plein, Pattern fixe ou Manuel).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
