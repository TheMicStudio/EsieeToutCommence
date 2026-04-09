import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { getAllClasses, getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { ProjectWeekGrid, type WeekWithMeta } from '@/modules/projects/components/ProjectWeekGrid';
import { NewWeekModal } from '@/modules/projects/components/NewWeekModal';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Projets — EsieeToutCommence' };

export default async function ProjetsPage() {
  const perms = await getRequestPermissions();
  if (!perms.has('project_week.read')) redirect('/dashboard');

  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let weeks: WeekWithMeta[] = [];
  let canManage = perms.has('project_week.manage');
  let newWeekClasses: { id: string; nom: string; annee: number; created_at: string }[] = [];

  if (profile.role === 'eleve') {
    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(nom)')
      .eq('student_id', user?.id ?? '')
      .eq('is_current', true)
      .maybeSingle();

    const classId = (data?.class_id as string) ?? '';
    const classNom = (data?.classes as unknown as { nom: string } | null)?.nom ?? '';

    const raw = classId ? await getProjectWeeks(classId) : [];
    const counts = await Promise.all(raw.map((w) => getGroups(w.id).then((g) => g.length)));
    weeks = raw.map((w, i) => ({ ...w, classId, classNom, groupCount: counts[i] }));
    canManage = false;
  } else {
    const isCoord = profile.role === 'coordinateur' || profile.role === 'admin';
    const classes = isCoord ? await getAllClasses() : await getMyTeacherClasses();
    newWeekClasses = classes;

    const allRaw = await Promise.all(
      classes.map(async (cls) => {
        const ws = await getProjectWeeks(cls.id);
        return ws.map((w) => ({ ...w, classId: cls.id, classNom: cls.nom }));
      })
    );
    const flat = allRaw.flat();
    const counts = await Promise.all(flat.map((w) => getGroups(w.id).then((g) => g.length)));
    weeks = flat.map((w, i) => ({ ...w, groupCount: counts[i] }));
  }

  const headerSlot = canManage && newWeekClasses.length > 0 ? (
    <NewWeekModal classes={newWeekClasses} />
  ) : null;

  return (
    <ProjectWeekGrid
      weeks={weeks}
      basePath="/dashboard/projets"
      showClassLabel={profile.role !== 'eleve'}
      headerSlot={headerSlot}
    />
  );
}
