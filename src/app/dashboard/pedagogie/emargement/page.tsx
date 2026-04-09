import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, QrCode, Filter } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { getMyTeacherSessions } from '@/modules/attendance/actions/index';
import { StartSessionForm } from '@/modules/attendance/components/StartSessionForm';
import type { AttendanceSession } from '@/modules/attendance/types';

export const metadata = { title: 'Émargement — EsieeToutCommence' };

interface EmargementPageProps {
  searchParams: Promise<{ classe?: string }>;
}

function formatSessionDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatSessionTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQrDuration(session: AttendanceSession) {
  const start = new Date(session.created_at).getTime();
  const end = new Date(session.expiration).getTime();
  const minutes = Math.round((end - start) / 60000);
  return `${minutes} min`;
}

export default async function EmargementPage({ searchParams }: Readonly<EmargementPageProps>) {
  const { classe: classeParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  await requirePermission('attendance.manage');

  const teacherClasses = await getMyTeacherClasses();
  if (teacherClasses.length === 0) {
    redirect('/dashboard/pedagogie');
  }

  const activeClass =
    teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0] ?? null;

  const allSessions = await getMyTeacherSessions();
  const classeSessions = activeClass
    ? allSessions.filter((s) => s.class_id === activeClass.id)
    : [];
  const openSessions = classeSessions.filter((s) => s.statut === 'ouvert');
  const closedSessions = classeSessions.filter((s) => s.statut === 'ferme').slice(0, 8);

  const classes = teacherClasses.map((c) => ({ id: c.id, nom: c.nom, annee: c.annee }));

  const activeClassName = activeClass
    ? `${activeClass.nom} — Promo ${activeClass.annee}`
    : '';

  return (
    <div className="space-y-6">

      {/* ── Section 1 — Intro & CTA ─────────────────────────────── */}
      <section
        aria-labelledby="emargement-title"
        className="rounded-3xl border border-slate-200/70 bg-white p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-3">
              <h1
                id="emargement-title"
                className="text-[24px] font-semibold tracking-tight text-[#0f1a2e] md:text-[28px]"
              >
                Émargement
              </h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[#41c0f0]/30 bg-[#41c0f0]/10 px-3 py-1 text-[12px] font-semibold text-[#0471a6]"
                aria-label="Type de check-in : QR Code"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                QR Code Check-In
              </span>
            </div>

            {/* Subtitle */}
            {activeClassName && (
              <p className="mt-1 text-[13px] font-semibold text-slate-600">
                {activeClassName}
              </p>
            )}

            {/* Description */}
            <p className="mt-2 max-w-xl text-[13px] font-medium text-[#6b7a90]">
              Lance un appel en un clic, génère un QR code temporaire et récupère un rapport clair
              (présents, retard, absents) — sans paperasse.
            </p>
          </div>

        </div>
      </section>

      {/* ── Session ouverte — alerte dynamique ──────────────────── */}
      {openSessions.length > 0 && (
        <div
          role="alert"
          className="rounded-3xl border border-emerald-200/70 bg-emerald-50 p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-emerald-800">Session en cours</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {openSessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/emargement/session/${s.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Voir le QR Code — expire à{' '}
                {new Date(s.expiration).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 2 — Configurer la session ───────────────────── */}
      <section
        aria-labelledby="lancer-appel-title"
        className="rounded-3xl border border-slate-200/70 bg-white p-6"
      >
        {/* Section header */}
        <div>
          <p
            id="lancer-appel-title"
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a90]"
          >
            Lancer un appel
          </p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#0f1a2e]">
            Configurer la session d&apos;émargement
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#6b7a90]">
            Sélectionnez les paramètres de la session avant de générer l&apos;appel.
          </p>
        </div>

        {/* Form */}
        <div className="mt-8">
          <StartSessionForm classes={classes} initialClassId={activeClass?.id} />
        </div>
      </section>

      {/* ── Section 3 — Sessions passées ────────────────────────── */}
      <section
        aria-labelledby="sessions-passees-title"
        className="rounded-3xl border border-slate-200/70 bg-white p-6"
      >
        {/* Section header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p
              id="sessions-passees-title"
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a90]"
            >
              Sessions passées
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-[#0f1a2e]">
              Historique des appels lancés
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[#6b7a90]">
              Consulte les sessions précédentes et ouvre un rapport détaillé.
            </p>
          </div>
          <button
            type="button"
            aria-label="Filtrer les sessions passées"
            className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#0f1a2e] hover:bg-slate-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-[#6b7a90]" aria-hidden="true" />
            Filtres
          </button>
        </div>

        {closedSessions.length > 0 ? (
          <ul className="space-y-3" role="list" aria-label="Liste des sessions passées">
            {closedSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/emargement/rapport/${s.id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50/50 hover:border-slate-300 md:flex-row md:items-center md:justify-between"
                  aria-label={`Rapport du ${formatSessionDate(s.created_at)}`}
                >
                  <div>
                    <p className="text-[16px] font-semibold capitalize text-slate-900">
                      {formatSessionDate(s.created_at)}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
                      {formatSessionTime(s.created_at)} — QR valide {getQrDuration(s)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0471a6] hover:text-[#0471a6]/80 transition-colors">
                    Rapport
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="flex h-24 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60"
            role="status"
          >
            <p className="text-[13px] font-medium text-[#6b7a90]">
              Aucune session terminée pour cette classe.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
