import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { CreateWeekForm } from '@/modules/projects/components/CreateWeekForm';
import { createClient } from '@/lib/supabase/server';

export default async function NouveauProjetPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  await requirePermission('project_week.manage'); if (!profile) redirect('/dashboard/projets');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('teacher_classes').select('class_id').eq('teacher_id', user?.id ?? '').maybeSingle();
  const classId = data?.class_id ?? '';

  if (!classId) redirect('/dashboard/projets');

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle semaine projet</h1>
        <p className="text-muted-foreground">Créez une semaine projet pour votre classe</p>
      </div>
      <CreateWeekForm classId={classId} />
    </div>
  );
}
