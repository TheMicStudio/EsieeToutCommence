import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyTeacherSessions } from '@/modules/attendance/actions';
import { StartSessionForm } from '@/modules/attendance/components/StartSessionForm';
import { createClient } from '@/lib/supabase/server';

export default async function EmargementPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  // Seuls les professeurs ont accès à cette page
  if (profile.role !== 'professeur') redirect('/dashboard');

  const teacherId = profile.profile.id;

  const supabase = await createClient();

  // Récupérer les classes du prof via son ID de profil
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id, classes(id, nom, annee)')
    .eq('teacher_id', teacherId);

  // Dédupliquer par class_id
  const seen = new Set<string>();
  const classes = (teacherClasses ?? [])
    .map((tc) => {
      const c = tc.classes as unknown as { id: string; nom: string; annee: number } | null;
      return { id: c?.id ?? '', nom: c?.nom ?? '', annee: c?.annee ?? '' };
    })
    .filter((c) => c.id && !seen.has(c.id) && seen.add(c.id));

  const sessions = await getMyTeacherSessions();
  const openSessions = sessions.filter((s) => s.statut === 'ouvert');
  const closedSessions = sessions.filter((s) => s.statut === 'ferme').slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Émargement QR Code</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez vos appels de présence et générez des QR codes</p>
      </div>

      {/* Session en cours */}
      {openSessions.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-800">Session en cours</p>
          </div>
          {openSessions.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/emargement/session/${s.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Rejoindre → expire à {new Date(s.expiration).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Link>
          ))}
        </div>
      )}

      {/* Formulaire nouvelle session */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Nouvelle session</p>
        <StartSessionForm classes={classes} />
      </div>

      {/* Sessions passées */}
      {closedSessions.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Sessions passées</p>
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
            {closedSessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/emargement/rapport/${s.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="text-sm font-medium text-slate-700">
                  {new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-xs font-semibold text-[#0471a6]">Rapport →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
