import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import {
  getCourseMaterials,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { ClassSelector } from '@/modules/pedagogy/components/ClassSelector';
import { CourseGrid } from '@/modules/pedagogy/components/CourseGrid';
import { getSubjects } from '@/modules/admin/config-actions';

export const metadata = { title: 'Cours — EsieeToutCommence' };

// ─── Page ──────────────────────────────────────────────────────────────────────
interface CoursPageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function CoursPage({ searchParams }: CoursPageProps) {
  const perms = await getRequestPermissions();
  if (!perms.has('course_material.read')) redirect('/dashboard');

  const { classe: classeParam } = await searchParams;
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';

  // ── Vue professeur ────────────────────────────────────────────────────────
  if (isProf) {
    const teacherClasses = await getMyTeacherClasses();
    if (teacherClasses.length === 0) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-[#0f1a2e]">Cours</h1>
          <p className="text-sm text-slate-500">
            Vous n&apos;avez pas encore de classe assignée.{' '}
            <span className="text-xs text-slate-400">Contactez l&apos;administration.</span>
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
      <div className="space-y-5">
        {/* Class selector */}
        {teacherClasses.length > 1 && (
          <ClassSelector
            classes={teacherClasses}
            activeClassId={activeClass.id}
            basePath="/dashboard/pedagogie/cours"
          />
        )}

        {/* Main layout */}
        <CourseGrid
          materials={materials}
          canManage
          classId={activeClass.id}
          matieres={matieres}
        />
      </div>
    );
  }

  // ── Vue élève ──────────────────────────────────────────────────────────────
  const classe = await getMyClass();
  if (!classe) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#0f1a2e]">Cours</h1>
        <p className="text-sm text-slate-500">
          Vous n&apos;êtes assigné à aucune classe.{' '}
          <span className="text-xs text-slate-400">Contactez l&apos;administration.</span>
        </p>
      </div>
    );
  }

  const materials = await getCourseMaterials(classe.id);

  return <CourseGrid materials={materials} />;
}
