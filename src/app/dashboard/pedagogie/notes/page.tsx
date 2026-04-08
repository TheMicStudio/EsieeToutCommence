import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import {
  computeAverage,
  getClassGrades,
  getClassStudents,
  getMyClass,
  getMyGrades,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { AverageWidget } from '@/modules/pedagogy/components/AverageWidget';
import { GradeBook } from '@/modules/pedagogy/components/GradeBook';
import { BulkGradeForm } from '@/modules/pedagogy/components/BulkGradeForm';
import { GradeTableView } from '@/modules/pedagogy/components/GradeTableView';
import { getProjectWeeks, getGroups } from '@/modules/projects/actions';
import { getSubjects } from '@/modules/admin/config-actions';

export const metadata = { title: 'Notes — EsieeToutCommence' };

interface NotesPageProps {
  searchParams: Promise<{ classe?: string; tab?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { classe: classeParam, tab = 'saisie' } = await searchParams;
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  // ── Vue élève ─────────────────────────────────────────────────────────────
  if (userProfile.role === 'eleve') {
    const classe = await getMyClass();
    const grades = await getMyGrades();
    const averages = classe ? await computeAverage(userProfile.profile.id, classe.id) : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pedagogie"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#061826]">Mes notes</h1>
            {classe && <p className="mt-1 text-sm text-slate-500">{classe.nom} — Promo {classe.annee}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GradeBook grades={grades} />
          </div>
          <div>
            <AverageWidget averages={averages} />
          </div>
        </div>
      </div>
    );
  }

  // ── Vue professeur ────────────────────────────────────────────────────────
  if (userProfile.role !== 'professeur') return null;

  const teacherClasses = await getMyTeacherClasses();
  if (teacherClasses.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#061826]">Notes</h1>
        <p className="text-sm text-slate-500">Aucune classe assignée. Contactez l&apos;administration.</p>
      </div>
    );
  }

  const activeClass = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0];

  // Données en parallèle
  const [students, grades, subjectsData, projectWeeksList] = await Promise.all([
    getClassStudents(activeClass.id),
    getClassGrades(activeClass.id),
    getSubjects(),
    getProjectWeeks(activeClass.id),
  ]);

  const matieres = subjectsData.map((s) => s.nom);

  // Charger les groupes de chaque semaine projet
  const projectWeeks = await Promise.all(
    projectWeeksList.map(async (week) => {
      const groups = await getGroups(week.id);
      return {
        id: week.id,
        title: week.title,
        groups: groups.map((g) => ({
          id: g.id,
          group_name: g.group_name,
          members: (g.members ?? []).map((m) => ({ student_id: m.student_id })),
        })),
      };
    })
  );

  const tabs = [
    { key: 'saisie', label: 'Saisir des notes' },
    { key: 'tableau', label: 'Tableau des notes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/pedagogie/classe/${activeClass.id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Notes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeClass.nom} · {students.length} élève{students.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/pedagogie/notes?classe=${activeClass.id}&tab=${t.key}`}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              tab === t.key
                ? 'bg-[#0471a6] text-white'
                : 'text-slate-500 hover:bg-slate-100',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Contenu */}
      {tab === 'saisie' && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Nouveau devoir</p>
          <BulkGradeForm
            classId={activeClass.id}
            students={students}
            matieres={matieres}
            projectWeeks={projectWeeks}
          />
        </div>
      )}

      {tab === 'tableau' && (
        <GradeTableView
          grades={grades}
          students={students}
          canDelete
        />
      )}
    </div>
  );
}
