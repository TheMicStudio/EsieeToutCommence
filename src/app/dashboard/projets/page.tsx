import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { ProjectWeekCard } from '@/modules/projects/components/ProjectWeekCard';
import { NewWeekModal } from '@/modules/projects/components/NewWeekModal';
import { createClient } from '@/lib/supabase/server';

export default async function ProjetsPage() {
  await requirePermission('project_week.read');
  const perms = await getRequestPermissions();
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let classId = '';
  if (profile.role === 'eleve') {
    const { data } = await supabase.from('class_members').select('class_id').eq('student_id', user?.id ?? '').eq('is_current', true).maybeSingle();
    classId = data?.class_id ?? '';
  } else {
    // maybeSingle() échoue si le prof a plusieurs matières → on prend le premier résultat
    const { data } = await supabase.from('teacher_classes').select('class_id').eq('teacher_id', user?.id ?? '').limit(1).maybeSingle();
    classId = data?.class_id ?? '';
  }

  const weeks = classId ? await getProjectWeeks(classId) : [];

  const groupCounts: Record<string, number> = {};
  await Promise.all(
    weeks.map(async (w) => {
      const groups = await getGroups(w.id);
      groupCounts[w.id] = groups.length;
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Projets</h1>
          <p className="text-sm text-slate-500">Semaines projets de votre classe</p>
        </div>
        {perms.has('project_week.manage') && classId && (
          <NewWeekModal classId={classId} />
        )}
      </div>

      {weeks.length === 0 ? (
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
