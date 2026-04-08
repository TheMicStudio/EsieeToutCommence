import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { ProjectWeekCard } from '@/modules/projects/components/ProjectWeekCard';
import { NewWeekModal } from '@/modules/projects/components/NewWeekModal';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface ProjetsPageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function ProjetsPage({ searchParams }: ProjetsPageProps) {
  await requirePermission('project_week.read');
  const perms = await getRequestPermissions();
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const { classe: classeParam } = await searchParams;
  const canManage = perms.has('project_week.manage');

  // ── Élève : une seule classe ──────────────────────────────────────────────
  if (profile.role === 'eleve') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(nom)')
      .eq('student_id', user?.id ?? '')
      .eq('is_current', true)
      .limit(1)
      .maybeSingle();

    const classId = (data?.class_id as string) ?? '';
    const className = (data?.classes as unknown as { nom: string } | null)?.nom ?? '';
    const weeks = classId ? await getProjectWeeks(classId) : [];
    const groupCounts: Record<string, number> = {};
    await Promise.all(weeks.map(async (w) => {
      groupCounts[w.id] = (await getGroups(w.id)).length;
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Projets</h1>
          {className && <p className="text-sm text-slate-500">{className}</p>}
        </div>
        {weeks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weeks.map((w) => (
              <ProjectWeekCard key={w.id} week={w} groupCount={groupCounts[w.id] ?? 0} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Prof / coordinateur / staff / admin ───────────────────────────────────
  const teacherClasses = await getMyTeacherClasses();

  // Filtre actif : une classe spécifique
  const activeClass = classeParam
    ? teacherClasses.find((c) => c.id === classeParam)
    : null;

  // Charger les semaines de toutes les classes en parallèle
  const allWeeksRaw = await Promise.all(
    teacherClasses.map(async (cls) => {
      const weeks = await getProjectWeeks(cls.id);
      return weeks.map((w) => ({ ...w, classId: cls.id, className: cls.nom }));
    })
  );
  const allWeeks = allWeeksRaw.flat();

  // Filtrer si filtre actif
  const displayedWeeks = activeClass
    ? allWeeks.filter((w) => w.classId === activeClass.id)
    : allWeeks;

  // Compter les groupes
  const groupCounts: Record<string, number> = {};
  await Promise.all(displayedWeeks.map(async (w) => {
    groupCounts[w.id] = (await getGroups(w.id)).length;
  }));

  // Stats globales
  const now = new Date();
  const totalWeeks = allWeeks.length;
  const activeWeeks = allWeeks.filter(
    (w) => new Date(w.start_date) <= now && now <= new Date(w.end_date)
  ).length;
  const upcomingWeeks = allWeeks.filter((w) => new Date(w.start_date) > now).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Projets</h1>
          <p className="text-sm text-slate-500">
            {activeClass ? activeClass.nom : `${teacherClasses.length} classe${teacherClasses.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {canManage && teacherClasses.length > 0 && (
          <NewWeekModal
            classId={activeClass?.id}
            classes={teacherClasses}
          />
        )}
      </div>

      {/* Stats pills */}
      {totalWeeks > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Total" value={totalWeeks} color="slate" />
          <StatPill label="En cours" value={activeWeeks} color="emerald" />
          <StatPill label="À venir" value={upcomingWeeks} color="blue" />
        </div>
      )}

      {/* Filtres par classe */}
      {teacherClasses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/projets"
            className={[
              'rounded-xl border px-4 py-1.5 text-sm font-medium transition-all',
              !activeClass
                ? 'border-[#0471a6] bg-[#0471a6] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            Toutes les classes
          </Link>
          {teacherClasses.map((cls) => (
            <Link
              key={cls.id}
              href={`/dashboard/projets?classe=${cls.id}`}
              className={[
                'rounded-xl border px-4 py-1.5 text-sm font-medium transition-all',
                activeClass?.id === cls.id
                  ? 'border-[#0471a6] bg-[#0471a6] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {cls.nom}
              {cls.annee ? ` — ${cls.annee}` : ''}
            </Link>
          ))}
        </div>
      )}

      {/* Contenu */}
      {teacherClasses.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucune classe assignée.</p>
        </div>
      ) : displayedWeeks.length === 0 ? (
        <EmptyState />
      ) : activeClass ? (
        /* Vue filtrée : grille simple */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedWeeks.map((w) => (
            <ProjectWeekCard key={w.id} week={w} groupCount={groupCounts[w.id] ?? 0} />
          ))}
        </div>
      ) : (
        /* Vue "toutes classes" : groupée par classe */
        <div className="space-y-8">
          {teacherClasses.map((cls) => {
            const clsWeeks = allWeeks.filter((w) => w.classId === cls.id);
            if (clsWeeks.length === 0) return null;
            return (
              <section key={cls.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#061826]">
                    {cls.nom}{cls.annee ? ` — Promo ${cls.annee}` : ''}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {clsWeeks.length} semaine{clsWeeks.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                  <Link
                    href={`/dashboard/projets?classe=${cls.id}`}
                    className="text-xs text-[#0471a6] hover:underline"
                  >
                    Voir tout →
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {clsWeeks.map((w) => (
                    <ProjectWeekCard key={w.id} week={w} groupCount={groupCounts[w.id] ?? 0} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: 'slate' | 'emerald' | 'blue' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-[#89aae6]/15 text-[#3685b5]',
  };
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${colors[color]}`}>
      <span className="text-lg font-bold">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
      <p className="text-sm text-slate-400">Aucune semaine projet pour le moment.</p>
    </div>
  );
}
