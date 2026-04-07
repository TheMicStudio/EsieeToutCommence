import { getCurrentUserProfile } from '@/modules/auth/actions';
import {
  getCourseMaterials,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { CourseMaterialList } from '@/modules/pedagogy/components/CourseMaterialList';
import { AddCourseMaterialForm } from '@/modules/pedagogy/components/AddCourseMaterialForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Supports de cours — Hub École' };

export default async function CoursPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';

  if (isProf) {
    const teacherClasses = await getMyTeacherClasses();
    if (teacherClasses.length === 0) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Supports de cours</h1>
          <p className="text-muted-foreground">Vous n&apos;avez pas encore de classe assignée.</p>
        </div>
      );
    }

    // Prend la première classe (on pourra ajouter un sélecteur de classe plus tard)
    const activeClass = teacherClasses[0];
    const materials = await getCourseMaterials(activeClass.id);

    // Récupère les matières du prof pour cette classe
    const supabase = await createClient();
    const { data: tc } = await supabase
      .from('teacher_classes')
      .select('matiere')
      .eq('class_id', activeClass.id)
      .eq('teacher_id', userProfile.profile.id);
    const matieres = (tc ?? []).map((t) => t.matiere as string);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Supports de cours</h1>
          <p className="mt-1 text-sm text-muted-foreground">{activeClass.nom} — Promo {activeClass.annee}</p>
        </div>

        <AddCourseMaterialForm classId={activeClass.id} matieres={matieres} />
        <CourseMaterialList materials={materials} />
      </div>
    );
  }

  // Vue élève
  const classe = await getMyClass();
  if (!classe) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Supports de cours</h1>
        <p className="text-muted-foreground">Vous n&apos;êtes assigné à aucune classe.</p>
      </div>
    );
  }

  const materials = await getCourseMaterials(classe.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supports de cours</h1>
        <p className="mt-1 text-sm text-muted-foreground">{classe.nom} — Promo {classe.annee}</p>
      </div>
      <CourseMaterialList materials={materials} />
    </div>
  );
}
