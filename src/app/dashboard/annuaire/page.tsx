import { createClient } from '@/lib/supabase/server';
import { AnnuaireGrid } from '@/modules/auth/components/AnnuaireGrid';
import type { StudentProfile, TeacherProfile } from '@/modules/auth/types';

export const metadata = { title: 'Annuaire — Hub École' };

export default async function AnnuairePage() {
  const supabase = await createClient();

  const [{ data: eleves }, { data: professeurs }] = await Promise.all([
    supabase.from('student_profiles').select('*').order('nom'),
    supabase.from('teacher_profiles').select('*').order('nom'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annuaire</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trombinoscope de tous les membres de la plateforme.
        </p>
      </div>

      <AnnuaireGrid
        eleves={(eleves as StudentProfile[]) ?? []}
        professeurs={(professeurs as TeacherProfile[]) ?? []}
      />
    </div>
  );
}
