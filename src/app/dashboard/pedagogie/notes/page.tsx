import { getCurrentUserProfile } from '@/modules/auth/actions';
import {
  computeAverage,
  getClassGrades,
  getMyClass,
  getMyGrades,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { GradeBook } from '@/modules/pedagogy/components/GradeBook';
import { GradeGrid } from '@/modules/pedagogy/components/GradeGrid';
import { AverageWidget } from '@/modules/pedagogy/components/AverageWidget';
import { createClient } from '@/lib/supabase/server';
import type { StudentProfile } from '@/modules/auth/types';

export const metadata = { title: 'Notes — Hub École' };

export default async function NotesPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  // ── Vue élève ─────────────────────────────────────────────────────────────
  if (userProfile.role === 'eleve') {
    const classe = await getMyClass();
    const grades = await getMyGrades();
    const averages = classe
      ? await computeAverage(userProfile.profile.id, classe.id)
      : [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes notes</h1>
          {classe && (
            <p className="mt-1 text-sm text-muted-foreground">
              {classe.nom} — Promo {classe.annee}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GradeBook grades={grades} />
          </div>
          <div>
            <h2 className="mb-4 font-semibold">Mes moyennes</h2>
            <AverageWidget averages={averages} />
          </div>
        </div>
      </div>
    );
  }

  // ── Vue professeur ────────────────────────────────────────────────────────
  if (userProfile.role === 'professeur') {
    const teacherClasses = await getMyTeacherClasses();
    if (teacherClasses.length === 0) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Vous n&apos;avez pas encore de classe assignée.</p>
        </div>
      );
    }

    const activeClass = teacherClasses[0];
    const grades = await getClassGrades(activeClass.id);

    // Récupère les élèves de la classe
    const supabase = await createClient();
    const { data: members } = await supabase
      .from('class_members')
      .select('student_profiles(id, nom, prenom)')
      .eq('class_id', activeClass.id);

    const students: StudentProfile[] = (members ?? [])
      .map((m) => m.student_profiles as unknown as StudentProfile)
      .filter(Boolean);

    // Matières du prof pour cette classe
    const { data: tc } = await supabase
      .from('teacher_classes')
      .select('matiere')
      .eq('class_id', activeClass.id)
      .eq('teacher_id', userProfile.profile.id);
    const matieres = (tc ?? []).map((t) => t.matiere as string);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeClass.nom} — {students.length} élève{students.length > 1 ? 's' : ''}
          </p>
        </div>

        <GradeGrid
          classId={activeClass.id}
          students={students}
          grades={grades}
          matieres={matieres}
        />
      </div>
    );
  }

  return null;
}
