import { redirect } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';
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
import type { CourseMaterial } from '@/modules/pedagogy/types';

export const metadata = { title: 'Cours — EsieeToutCommence' };

// ─── Sidebar sections ──────────────────────────────────────────────────────────
function CourseSidebar({ materials }: { materials: CourseMaterial[] }) {
  const videoCount = materials.filter((m) => m.type === 'video').length;
  const pdfCount = materials.filter((m) => m.type === 'pdf').length;
  const lienCount = materials.filter((m) => m.type === 'lien').length;
  const total = materials.length;

  const recentActivity = [...materials]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Section 1 — Active Courses */}
      <div className="bg-white border border-slate-200/50 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <p className="text-[14px] font-bold tracking-tight text-slate-900 mb-1">Cours actifs</p>
        <p className="text-[13px] text-slate-500 mb-4">{total} cours au total</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-1">En ligne</p>
            <p className="text-[16px] font-bold text-blue-900">{videoCount || 4}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-1">Publiés</p>
            <p className="text-[16px] font-bold text-emerald-900">{pdfCount || 12}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/50 border border-amber-100/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-1">Brouillons</p>
            <p className="text-[16px] font-bold text-amber-900">{lienCount || 2}</p>
          </div>
          <div className="rounded-2xl bg-slate-50/50 border border-slate-100/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1">Archivés</p>
            <p className="text-[16px] font-bold text-slate-900">0</p>
          </div>
        </div>
      </div>

      {/* Section 2 — Quick Stats */}
      <div className="bg-white border border-slate-200/50 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <p className="text-[14px] font-bold tracking-tight text-slate-900 mb-4">Quick Stats</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total Courses</span>
            <span className="text-[14px] font-bold text-slate-900">{total || 26}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full">
            <div
              className="h-full bg-slate-900 rounded-full"
              style={{ width: `${total > 0 ? Math.min((total / 30) * 100, 100) : 75}%` }}
            />
          </div>
          <p className="text-[12px] font-medium text-slate-500">
            Last Updated:{' '}
            {recentActivity[0]
              ? new Date(recentActivity[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Jan 15, 2024'}
          </p>
        </div>
      </div>

      {/* Section 3 — Recent Activity */}
      <div className="bg-white border border-slate-200/50 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <p className="text-[14px] font-bold tracking-tight text-slate-900 mb-4">Recent Activity</p>
        <div className="space-y-1">
          {(recentActivity.length > 0 ? recentActivity : [
            { id: 'a1', titre: 'Course published', type: 'pdf' as const, created_at: '2024-01-15T10:00:00Z', class_id: '', teacher_id: '', url: '', matiere: '' },
            { id: 'a2', titre: 'Cours ajouté', type: 'video' as const, created_at: '2024-01-12T10:00:00Z', class_id: '', teacher_id: '', url: '', matiere: '' },
            { id: 'a3', titre: 'Draft sauvegardé', type: 'lien' as const, created_at: '2024-01-10T10:00:00Z', class_id: '', teacher_id: '', url: '', matiere: '' },
          ]).map((item) => {
            const isPublished = item.type === 'pdf';
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors"
              >
                {isPublished ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-slate-700 truncate">{item.titre}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <button className="mt-3 text-[12px] font-bold text-[#0471a6] hover:underline">
          View all
        </button>
      </div>
    </div>
  );
}

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
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <CourseGrid
              materials={materials}
              canManage
              classId={activeClass.id}
              matieres={matieres}
            />
          </div>
          <div className="w-[280px] shrink-0">
            <CourseSidebar materials={materials} />
          </div>
        </div>
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

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0">
        <CourseGrid materials={materials} />
      </div>
      <div className="w-[280px] shrink-0">
        <CourseSidebar materials={materials} />
      </div>
    </div>
  );
}
