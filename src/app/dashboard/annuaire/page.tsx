import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/permissions';
import { AnnuaireGrid } from '@/modules/auth/components/AnnuaireGrid';
import type { StudentProfile, TeacherProfile } from '@/modules/auth/types';

export const metadata = { title: 'Annuaire — EsieeToutCommence' };

export default async function AnnuairePage() {
  await requirePermission('directory.read');
  const supabase = await createClient();

  const [{ data: elevesRaw }, { data: professeurs }, { data: classMembers }, { data: classes }] =
    await Promise.all([
      supabase.from('student_profiles').select('*').order('nom'),
      supabase.from('teacher_profiles').select('*').order('nom'),
      supabase.from('class_members').select('student_id, class_id').eq('is_current', true),
      supabase.from('classes').select('id, nom').order('nom'),
    ]);

  const classMemberMap = new Map<string, string>();
  for (const m of classMembers ?? []) {
    classMemberMap.set(m.student_id, m.class_id);
  }

  const eleves = (elevesRaw as StudentProfile[] ?? []).map((e) => ({
    ...e,
    class_id: classMemberMap.get(e.id) ?? e.class_id,
  }));

  return (
    <Suspense>
      <AnnuaireGrid
        eleves={eleves}
        professeurs={(professeurs as TeacherProfile[]) ?? []}
        classes={(classes as { id: string; nom: string }[]) ?? []}
      />
    </Suspense>
  );
}
