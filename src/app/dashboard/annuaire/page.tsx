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
    { data: { users: authUsers } },
  ] = await Promise.all([
    supabase.from('student_profiles').select('*').order('nom'),
    supabase.from('teacher_profiles').select('*').order('nom'),
    supabase.from('admin_profiles').select('*').order('nom'),
    supabase.from('class_members').select('student_id, class_id').eq('is_current', true),
    supabase.from('classes').select('id, nom').order('nom'),
    supabase.from('user_roles').select('id, role'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  // Map id → email depuis auth.users (source de vérité)
  const authEmailMap = new Map<string, string>();
  for (const u of authUsers ?? []) {
    if (u.email) authEmailMap.set(u.id, u.email);
  }

  const roleMap = new Map<string, string>();
  for (const r of userRoles ?? []) roleMap.set(r.id, r.role);

  const classMemberMap = new Map<string, string>();
  for (const m of classMembers ?? []) classMemberMap.set(m.student_id, m.class_id);

  const eleves = (elevesRaw as StudentProfile[] ?? []).map((e) => ({
    ...e,
    class_id: classMemberMap.get(e.id) ?? e.class_id,
    email: authEmailMap.get(e.id) ?? e.email,
  }));

  // Sépare profs et coordinateurs selon user_roles
  const professeurs: TeacherProfile[] = [];
  const coordinateurs: TeacherProfile[] = [];
  for (const t of (teachersRaw as TeacherProfile[]) ?? []) {
    const withEmail = { ...t, email: authEmailMap.get(t.id) ?? t.email };
    if (roleMap.get(t.id) === 'coordinateur') {
      coordinateurs.push(withEmail);
    } else {
      professeurs.push(withEmail);
    }
  }

  // Sépare direction et secrétariat
  const admins: AdminProfile[] = [];
  const staff: AdminProfile[] = [];
  for (const a of (adminsRaw as AdminProfile[]) ?? []) {
    const withEmail = { ...a, email: authEmailMap.get(a.id) ?? a.email };
    if (roleMap.get(a.id) === 'staff') {
      staff.push(withEmail);
    } else {
      admins.push(withEmail);
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
