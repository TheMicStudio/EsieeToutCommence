import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import {
  getCourseMaterials,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { CourseMaterialList } from '@/modules/pedagogy/components/CourseMaterialList';
import { AddCourseMaterialForm } from '@/modules/pedagogy/components/AddCourseMaterialForm';
import { ClassSelector } from '@/modules/pedagogy/components/ClassSelector';
import { getSubjects } from '@/modules/admin/config-actions';

export const metadata = { title: 'Supports de cours — EsieeToutCommence' };

export default async function CoursPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  await requirePermission('course_material.read');
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const { classe: classeParam } = await searchParams;
  const isProf = userProfile.role === 'professeur';

  if (isProf) {
    const teacherClasses = await getMyTeacherClasses();
    if (teacherClasses.length === 0) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Supports de cours</h1>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore de classe assignée.{' '}
            <span className="text-sm text-muted-foreground/70">Contactez l&apos;administration.</span>
          </p>
        </div>
      );
    }

    const activeClass = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0];
    const [materials, subjects] = await Promise.all([
      getCourseMaterials(activeClass.id),
      getSubjects(),
    ]);
    const matieres = subjects.map((s) => s.nom);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Supports de cours</h1>
          <p className="mt-1 text-sm text-slate-500">{activeClass.nom} — Promo {activeClass.annee}</p>
        </div>
        <ClassSelector
          classes={teacherClasses}
          activeClassId={activeClass.id}
          basePath="/dashboard/pedagogie/cours"
        />
        <AddCourseMaterialForm classId={activeClass.id} matieres={matieres} />
        <CourseMaterialList materials={materials} classId={activeClass.id} canDelete />
      </div>
    );
  }

  // Vue élève
  const classe = await getMyClass();
  if (!classe) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Supports de cours</h1>
        <p className="text-muted-foreground">
          Vous n&apos;êtes assigné à aucune classe.{' '}
          <span className="text-sm text-muted-foreground/70">Contactez l&apos;administration.</span>
        </p>
      </div>
    );
  }

  const materials = await getCourseMaterials(classe.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Supports de cours</h1>
        <p className="mt-1 text-sm text-slate-500">{classe.nom} — Promo {classe.annee}</p>
      </div>
      <CourseMaterialList materials={materials} classId={classe.id} />
    </div>
  );
}
