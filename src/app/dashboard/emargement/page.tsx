import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyTeacherSessions } from '@/modules/attendance/actions';
import { StartSessionForm } from '@/modules/attendance/components/StartSessionForm';
import { createClient } from '@/lib/supabase/server';

export default async function EmargementPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'professeur' && profile.role !== 'admin') redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Récupérer les classes du prof
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id, classes(id, nom, filiere)')
    .eq('teacher_id', user?.id ?? '');

  const classes = (teacherClasses ?? []).map((tc) => {
    const c = tc.classes as unknown as { id: string; nom: string; filiere: string } | null;
    return { id: c?.id ?? '', nom: c?.nom ?? '', filiere: c?.filiere ?? '' };
  }).filter((c) => c.id);

  const sessions = await getMyTeacherSessions();
  const openSessions = sessions.filter((s) => s.statut === 'ouvert');
  const closedSessions = sessions.filter((s) => s.statut === 'ferme').slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Émargement QR Code</h1>
        <p className="text-muted-foreground">Gérez vos appels de présence</p>
      </div>

      {openSessions.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-primary">Session en cours</p>
          {openSessions.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/emargement/session/${s.id}`}
              className="block text-sm text-primary underline underline-offset-4"
            >
              Rejoindre la session → {new Date(s.expiration).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Link>
          ))}
        </div>
      )}

      <StartSessionForm classes={classes} />

      {closedSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Sessions passées</h2>
          <div className="space-y-2">
            {closedSessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/emargement/rapport/${s.id}`}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:border-primary/40 transition-colors"
              >
                <span className="text-sm">
                  {new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-xs text-muted-foreground">Voir le rapport →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
