import { Suspense } from 'react';
import { requirePermission } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnnuaireGrid } from '@/modules/auth/components/AnnuaireGrid';
import type { StudentProfile, TeacherProfile, AdminProfile } from '@/modules/auth/types';

export const metadata = { title: 'Annuaire — EsieeToutCommence' };

export default async function AnnuairePage() {
  await requirePermission('directory.read');

  // Admin client pour bypasser la RLS sur les profils
  const supabase = createAdminClient();

  const [
    { data: elevesRaw },
    { data: teachersRaw },
    { data: adminsRaw },
    { data: classMembers },
    { data: classes },
    { data: userRoles },
  ] = await Promise.all([
    supabase.from('student_profiles').select('*').order('nom'),
    supabase.from('teacher_profiles').select('*').order('nom'),
    supabase.from('admin_profiles').select('*').order('nom'),
    supabase.from('class_members').select('student_id, class_id').eq('is_current', true),
    supabase.from('classes').select('id, nom').order('nom'),
    supabase.from('user_roles').select('id, role'),
  ]);

  const roleMap = new Map<string, string>();
  for (const r of userRoles ?? []) roleMap.set(r.id, r.role);

  const classMemberMap = new Map<string, string>();
  for (const m of classMembers ?? []) classMemberMap.set(m.student_id, m.class_id);

  const eleves = (elevesRaw as StudentProfile[] ?? []).map((e) => ({
    ...e,
    class_id: classMemberMap.get(e.id) ?? e.class_id,
  }));

  // Sépare profs et coordinateurs selon user_roles
  const professeurs: TeacherProfile[] = [];
  const coordinateurs: TeacherProfile[] = [];
  for (const t of (teachersRaw as TeacherProfile[]) ?? []) {
    if (roleMap.get(t.id) === 'coordinateur') {
      coordinateurs.push(t);
    } else {
      professeurs.push(t);
    }
  }

  // Sépare direction et secrétariat
  const admins: AdminProfile[] = [];
  const staff: AdminProfile[] = [];
  for (const a of (adminsRaw as AdminProfile[]) ?? []) {
    if (roleMap.get(a.id) === 'staff') {
      staff.push(a);
    } else {
      admins.push(a);
    }
  }

  return (
    <Suspense>
      <AnnuaireGrid
        eleves={eleves}
        professeurs={professeurs}
        coordinateurs={coordinateurs}
        admins={admins}
        staff={staff}
        classes={(classes as { id: string; nom: string }[]) ?? []}
      />
    </Suspense>
  );
}
