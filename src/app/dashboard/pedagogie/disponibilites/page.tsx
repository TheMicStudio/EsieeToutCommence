import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';
import { getTeacherWeekAvailabilities } from '@/modules/admin/planning-actions';
import { WeekAvailabilityGrid } from '@/app/dashboard/planning/WeekAvailabilityGrid';
import { CalendarDays, Info } from 'lucide-react';
import type { TeacherProfile } from '@/modules/auth/types';

export const metadata = { title: 'Mes disponibilités — EsieeToutCommence' };

export default async function DisponibilitesPage() {
  const userProfile = await getCurrentUserProfile();

  if (
    !userProfile ||
    (userProfile.role !== 'professeur' && userProfile.role !== 'coordinateur')
  ) {
    redirect('/dashboard');
  }

  const profile = userProfile.profile as TeacherProfile;
  const weeks = await getTeacherWeekAvailabilities(profile.id);

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Mes disponibilités</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez les semaines où vous pouvez enseigner. Ces informations sont utilisées pour construire votre planning.
        </p>
      </div>

      {/* Info contextuelle */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#89aae6]/40 bg-[#0471a6]/5 px-5 py-4">
        <Info className="h-5 w-5 text-[#0471a6] shrink-0 mt-0.5" />
        <div className="text-sm text-[#3685b5]">
          <p className="font-semibold mb-0.5">Comment ça fonctionne ?</p>
          <ul className="space-y-1 text-[13px] text-[#3685b5]/80">
            <li>• <strong>Sans sélection</strong> : vous êtes considéré(e) disponible toute l&apos;année.</li>
            <li>• <strong>Avec sélection</strong> : le moteur de planning n&apos;affectera aucun cours hors de vos semaines sélectionnées.</li>
            <li>• Utilisez <em>Toute l&apos;année</em> si vous êtes disponible en permanence, ou sélectionnez vos semaines manuellement.</li>
          </ul>
        </div>
      </div>

      {/* Grille */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
        {/* Header section */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0471a6]/10">
            <CalendarDays className="h-5 w-5 text-[#0471a6]" />
          </div>
          <div>
            <h2 className="font-bold text-[#061826]">
              {profile.prenom} {profile.nom} — Semaines disponibles
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Année scolaire en cours · Cliquez sur une semaine pour la sélectionner ou la désélectionner
            </p>
          </div>
        </div>
        <div className="h-px bg-slate-100 mb-5" />

        <WeekAvailabilityGrid
          teacherId={profile.id}
          initialWeeks={weeks}
        />
      </div>
    </div>
  );
}
