import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/permissions';
import { AnnuaireGrid } from '@/modules/auth/components/AnnuaireGrid';
import type { StudentProfile, TeacherProfile } from '@/modules/auth/types';
import { Users, GraduationCap, BookOpen } from 'lucide-react';

export const metadata = { title: 'Annuaire — EsieeToutCommence' };

export default async function AnnuairePage() {
  await requirePermission('directory.read');
  const supabase = await createClient();

  const [{ data: elevesRaw }, { data: professeurs }, { data: classMembers }, { data: classes }] = await Promise.all([
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

  const totalEleves = eleves.length;
  const totalProfs = (professeurs ?? []).length;
  const totalClasses = (classes ?? []).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#061826]">Annuaire</h1>
            <p className="mt-1 text-sm text-slate-500">
              Trombinoscope de tous les membres de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-2xl bg-[#89aae6]/10 px-3.5 py-2">
              <GraduationCap className="h-4 w-4 text-[#3685b5]" />
              <span className="text-sm font-semibold text-[#3685b5]">{totalEleves} élève{totalEleves > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-[#ac80a0]/10 px-3.5 py-2">
              <BookOpen className="h-4 w-4 text-[#ac80a0]" />
              <span className="text-sm font-semibold text-[#ac80a0]">{totalProfs} prof{totalProfs > 1 ? 's' : ''}</span>
            </div>
            {totalClasses > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">{totalClasses} classe{totalClasses > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnnuaireGrid
        eleves={eleves}
        professeurs={(professeurs as TeacherProfile[]) ?? []}
        classes={(classes as { id: string; nom: string }[]) ?? []}
      />
    </div>
  );
}
