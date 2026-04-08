import Link from 'next/link';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getCareerEvents, getMyEventRegistrations } from '@/modules/career/actions';
import { EventCard } from '@/modules/career/components/EventCard';
import { CreateEventForm } from '@/modules/career/components/CreateEventForm';

export const metadata = { title: 'Événements — EsieeToutCommence' };

export default async function EvenementsPage() {
  await requirePermission('career_event.read');
  const perms = await getRequestPermissions();
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const canParticipate = perms.has('career_event.participate');
  const canManage = perms.has('career_event.manage');
  const [events, registrations] = await Promise.all([
    getCareerEvents(),
    canParticipate ? getMyEventRegistrations() : Promise.resolve([]),
  ]);

  const upcoming = events.filter((e) => new Date(e.date_debut) >= new Date());
  const past = events.filter((e) => new Date(e.date_debut) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
        <Link
          href="/dashboard/carriere"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Carrière
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061826]">Événements carrière</h1>
              <p className="mt-0.5 text-sm text-slate-500">Forums, ateliers CV, journées de recrutement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canManage && (
              <span className="rounded-2xl bg-[#0471a6]/10 px-3.5 py-2 text-sm font-semibold text-[#0471a6]">
                Mode gestion
              </span>
            )}
            {upcoming.length > 0 && (
              <span className="rounded-2xl bg-amber-100 px-3.5 py-2 text-sm font-semibold text-amber-700">
                {upcoming.length} à venir
              </span>
            )}
            {past.length > 0 && (
              <span className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-500">
                {past.length} passé{past.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-[#0471a6]" />
            <h2 className="text-sm font-semibold text-[#061826]">Créer un événement</h2>
          </div>
          <CreateEventForm />
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="px-1 text-sm font-semibold text-[#061826]">À venir</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registrations.includes(event.id)}
                canParticipate={canParticipate}
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="px-1 text-sm font-semibold text-slate-400">Passés</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registrations.includes(event.id)}
                canParticipate={canParticipate}
              />
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white">
          <Calendar className="h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">Aucun événement pour l&apos;instant.</p>
        </div>
      )}
    </div>
  );
}
