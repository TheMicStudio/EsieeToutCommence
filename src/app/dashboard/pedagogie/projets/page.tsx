import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { getAllClasses, getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { ProjectWeekCard } from '@/modules/projects/components/ProjectWeekCard';
import { NewWeekModal } from '@/modules/projects/components/NewWeekModal';
import { ClassSelector } from '@/modules/pedagogy/components/ClassSelector';
import { createClient } from '@/lib/supabase/server';

interface ProjetsPageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function ProjetsPage({ searchParams }: ProjetsPageProps) {
  const { classe: classeParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  await requirePermission('project_week.read');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let classId = '';
  let className = '';
  let teacherClasses: Awaited<ReturnType<typeof getMyTeacherClasses>> = [];

  if (profile.role === 'eleve') {
    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(nom)')
      .eq('student_id', user?.id ?? '')
      .eq('is_current', true)
      .maybeSingle();
    classId = (data?.class_id as string) ?? '';
    className = (data?.classes as unknown as { nom: string } | null)?.nom ?? '';
  } else if (profile.role === 'coordinateur' || profile.role === 'admin') {
    const allClasses = await getAllClasses();
    teacherClasses = allClasses;
    const activeClass = allClasses.find((c) => c.id === classeParam) ?? allClasses[0];
    classId = activeClass?.id ?? '';
    className = activeClass?.nom ?? '';
  } else {
    teacherClasses = await getMyTeacherClasses();
    const activeClass = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0];
    classId = activeClass?.id ?? '';
    className = activeClass?.nom ?? '';
  }

  const weeks = classId ? await getProjectWeeks(classId) : [];
  const groupCounts: Record<string, number> = {};
  await Promise.all(weeks.map(async (w) => {
    groupCounts[w.id] = (await getGroups(w.id)).length;
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Semaines projets</h1>
          {className && <p className="text-sm text-slate-500">{className}</p>}
        </div>
        {(profile.role === 'professeur' || profile.role === 'coordinateur' || profile.role === 'admin') && classId && (
          <NewWeekModal classId={classId} />
        )}
      </div>

      {/* Sélecteur de classe pour les profs avec plusieurs classes */}
      {teacherClasses.length > 1 && (
        <ClassSelector
          classes={teacherClasses}
          activeClassId={classId}
          basePath="/dashboard/pedagogie/projets"
        />
      )}

      {!classId ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucune classe assignée.</p>
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucune semaine projet pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weeks.map((week) => (
            <ProjectWeekCard key={week.id} week={week} groupCount={groupCounts[week.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
