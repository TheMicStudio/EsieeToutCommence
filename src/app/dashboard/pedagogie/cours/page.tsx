import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import { getAllAccessibleWeekMaterials } from '@/modules/projects/actions';
import { CourseGrid } from '@/modules/pedagogy/components/CourseGrid';
import type { CourseMaterial } from '@/modules/pedagogy/types';

export const metadata = { title: 'Cours — EsieeToutCommence' };

export default async function CoursPage() {
  const perms = await getRequestPermissions();
  if (!perms.has('course_material.read')) redirect('/dashboard');

  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const accessibleMaterials = await getAllAccessibleWeekMaterials();

  // Semaines projet uniques (dans l'ordre d'apparition des données)
  const weekOptions = [...new Set(
    accessibleMaterials.map((m) => m.week_title).filter(Boolean)
  )];

  // Mapper vers CourseMaterial pour réutiliser CourseGrid
  const materials: CourseMaterial[] = accessibleMaterials.map((m) => ({
    id: m.id,
    class_id: m.class_id,
    teacher_id: m.uploaded_by,
    matiere: m.week_title || m.class_nom || 'Projet',
    titre: m.titre,
    type: m.type,
    url: m.url,
    created_at: m.created_at,
  }));

  return <CourseGrid materials={materials} categoryOptions={weekOptions} />;
}
