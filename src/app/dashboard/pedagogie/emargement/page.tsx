import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { getMyTeacherSessions } from '@/modules/attendance/actions/index';
import { StartSessionForm } from '@/modules/attendance/components/StartSessionForm';
import { ClassSelector } from '@/modules/pedagogy/components/ClassSelector';
import { QrCode } from 'lucide-react';

interface EmargementPageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function EmargementPage({ searchParams }: EmargementPageProps) {
  const { classe: classeParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  if (profile.role !== 'professeur') redirect('/dashboard');

  const teacherClasses = await getMyTeacherClasses();
  const activeClass = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0] ?? null;

  const allSessions = await getMyTeacherSessions();
  const classeSessions = activeClass
    ? allSessions.filter((s) => s.class_id === activeClass.id)
    : [];
  const openSessions = classeSessions.filter((s) => s.statut === 'ouvert');
  const closedSessions = classeSessions.filter((s) => s.statut === 'ferme').slice(0, 8);

  const classes = teacherClasses.map((c) => ({ id: c.id, nom: c.nom, annee: c.annee }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Émargement</h1>
        {activeClass && (
          <p className="mt-1 text-sm text-slate-500">{activeClass.nom} — Promo {activeClass.annee}</p>
        )}
      </div>

      {teacherClasses.length > 1 && (
        <ClassSelector
          classes={teacherClasses}
          activeClassId={activeClass?.id ?? ''}
          basePath="/dashboard/pedagogie/emargement"
        />
      )}

      {/* Session ouverte */}
      {openSessions.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-5 space-y-3">
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
              <QrCode className="h-4 w-4" />
              Voir le QR Code — expire à {new Date(s.expiration).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Link>
          ))}
        </div>
      )}

      {/* Nouvelle session */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Lancer un appel</p>
        <StartSessionForm classes={classes} initialClassId={activeClass?.id} />
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
                  {new Date(s.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="text-xs font-semibold text-[#0471a6]">Rapport →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {closedSessions.length === 0 && openSessions.length === 0 && activeClass && (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucune session pour cette classe.</p>
        </div>
      )}
    </div>
  );
}
