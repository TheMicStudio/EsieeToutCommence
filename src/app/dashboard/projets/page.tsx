import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { ProjectWeekCard } from '@/modules/projects/components/ProjectWeekCard';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function ProjetsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');
  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let classId = '';
  if (profile.role === 'eleve') {
    const { data } = await supabase.from('class_members').select('class_id').eq('student_id', user?.id ?? '').maybeSingle();
    classId = data?.class_id ?? '';
  } else {
    const { data } = await supabase.from('teacher_classes').select('class_id').eq('teacher_id', user?.id ?? '').maybeSingle();
    classId = data?.class_id ?? '';
  }

  const weeks = classId ? await getProjectWeeks(classId) : [];

  // Compter les groupes par semaine
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
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-muted-foreground">Semaines projets de votre classe</p>
        </div>
        {profile.role === 'professeur' && classId && (
          <Link href="/dashboard/projets/nouveau" className={buttonVariants({})}>
            Créer une semaine
          </Link>
        )}
      </div>

      {weeks.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Aucune semaine projet pour le moment.</p>
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
