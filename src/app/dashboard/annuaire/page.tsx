import { createClient } from '@/lib/supabase/server';
import { AnnuaireGrid } from '@/modules/auth/components/AnnuaireGrid';
import type { StudentProfile, TeacherProfile } from '@/modules/auth/types';

export const metadata = { title: 'Annuaire — Hub École' };

export default async function AnnuairePage() {
  const supabase = await createClient();

  const [{ data: elevesRaw }, { data: professeurs }, { data: classMembers }, { data: classes }] = await Promise.all([
    supabase.from('student_profiles').select('*').order('nom'),
    supabase.from('teacher_profiles').select('*').order('nom'),
    supabase.from('class_members').select('student_id, class_id'),
    supabase.from('classes').select('id, nom').order('nom'),
  ]);

  // Injecter le class_id dans chaque profil élève
  const classMemberMap = new Map<string, string>();
  for (const m of classMembers ?? []) {
    classMemberMap.set(m.student_id, m.class_id);
  }

  const eleves = (elevesRaw as StudentProfile[] ?? []).map((e) => ({
    ...e,
    class_id: classMemberMap.get(e.id) ?? e.class_id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Annuaire</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trombinoscope de tous les membres de la plateforme.
        </p>
      </div>

      <AnnuaireGrid
        eleves={eleves}
        professeurs={(professeurs as TeacherProfile[]) ?? []}
        classes={(classes as { id: string; nom: string }[]) ?? []}
      />
    </div>
  );
}
