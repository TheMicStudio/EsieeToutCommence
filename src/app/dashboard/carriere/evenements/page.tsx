import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getCareerEvents, getMyEventRegistrations } from '@/modules/career/actions';
import { EventCard } from '@/modules/career/components/EventCard';

export const metadata = { title: 'Événements — EsieeToutCommence' };

export default async function EvenementsPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isEleve = userProfile.role === 'eleve';
  const [events, registrations] = await Promise.all([
    getCareerEvents(),
    isEleve ? getMyEventRegistrations() : Promise.resolve([]),
  ]);

  const upcoming = events.filter((e) => new Date(e.date_debut) >= new Date());
  const past = events.filter((e) => new Date(e.date_debut) < new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Événements carrière</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forums, ateliers CV, journées de recrutement
        </p>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold">À venir ({upcoming.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registrations.includes(event.id)}
                isEleve={isEleve}
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-muted-foreground">Passés ({past.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registrations.includes(event.id)}
                isEleve={isEleve}
              />
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Aucun événement pour l&apos;instant.</p>
        </div>
      )}
    </div>
  );
}
