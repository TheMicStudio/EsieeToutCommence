import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/permissions';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { CreateWeekForm } from '@/modules/projects/components/CreateWeekForm';

interface NouveauPageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function NouveauProjetPage({ searchParams }: NouveauPageProps) {
  const { classe: classeParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  await requirePermission('project_week.manage');

  const teacherClasses = await getMyTeacherClasses();
  if (teacherClasses.length === 0) redirect('/dashboard/pedagogie/projets');

  const activeClass = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Nouvelle semaine projet</h1>
        <p className="text-sm text-slate-500">{activeClass.nom}</p>
      </div>
      <CreateWeekForm classId={activeClass.id} />
    </div>
  );
}
