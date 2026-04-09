import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRequestPermissions } from '@/lib/permissions';
import {
  getAllClasses,
  getClassGrades,
  getClassStudents,
  getMyClass,
  getMyGrades,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
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
  const perms = await getRequestPermissions();
  // eleve = grade.read_own, prof/coordinateur = grade.read_class ou grade.manage
  if (!perms.has('grade.read_own') && !perms.has('grade.read_class') && !perms.has('grade.manage')) {
    redirect('/dashboard');
  }
  const { classe: classeParam, tab = 'saisie' } = await searchParams;
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  // ── Vue élève ─────────────────────────────────────────────────────────────
  if (userProfile.role === 'eleve') {
    const classe = await getMyClass();
    const grades = await getMyGrades();

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
        <GradeBook grades={grades} />
      </div>
    );
  }

  // ── Vue professeur / coordinateur / admin ────────────────────────────────
  const isCoord = userProfile.role === 'coordinateur' || userProfile.role === 'admin';
  if (userProfile.role !== 'professeur' && !isCoord) return null;

  const teacherClasses = isCoord ? await getAllClasses() : await getMyTeacherClasses();
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

  // Stats classe pour la sidebar droite
  const matieresWithGrades = [...new Set(grades.map((g) => g.matiere))].sort();
  const classMoyByMatiere = matieresWithGrades.map((m) => {
    const items = grades.filter((g) => g.matiere === m);
    const totalCoeff = items.reduce((s, g) => s + g.coefficient, 0);
    return {
      matiere: m,
      moyenne: totalCoeff > 0
        ? items.reduce((s, g) => s + g.note * g.coefficient, 0) / totalCoeff
        : 0,
      total_coefficients: totalCoeff,
    };
  });
  const generalClassAvg = classMoyByMatiere.length > 0
    ? classMoyByMatiere.reduce((s, m) => s + m.moyenne * m.total_coefficients, 0) /
      classMoyByMatiere.reduce((s, m) => s + m.total_coefficients, 0)
    : null;

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
          <h1 className="text-2xl font-bold text-[#0f1a2e]">Notes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeClass.nom} — Promo {activeClass.annee} · {students.length} élève{students.length > 1 ? 's' : ''}
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

      {/* Layout : centre + sidebar droite */}
      <div className="flex gap-6 items-start">
        {/* Centre */}
        <div className="flex-1 min-w-0">
          {tab === 'saisie' && (
            <div className="border border-slate-200/50 rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
                Nouveau devoir
              </p>
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

        {/* Sidebar droite 280px */}
        <div className="w-[280px] shrink-0 space-y-4">
          {/* Classe info */}
          <div className="bg-white border border-slate-200/50 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <p className="text-[14px] font-bold text-[#0f1a2e] mb-4">Informations</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Classe</span>
                <span className="text-[13px] font-semibold text-[#0f1a2e]">{activeClass.nom}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Promo</span>
                <span className="text-[13px] font-semibold text-[#0f1a2e]">{activeClass.annee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Élèves</span>
                <span className="text-[13px] font-bold text-[#0471a6]">{students.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Notes saisies</span>
                <span className="text-[13px] font-bold text-[#0471a6]">{grades.length}</span>
              </div>
              {generalClassAvg !== null && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 mb-1">Moyenne générale classe</p>
                  <p className="text-[28px] font-bold text-[#0471a6] tracking-tight leading-none">
                    {generalClassAvg.toFixed(2)}/20
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Moyennes par matière */}
          {classMoyByMatiere.length > 0 && (
            <div className="bg-white border border-slate-200/50 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
              <p className="text-[14px] font-bold text-[#0f1a2e] mb-4">Moyennes par matière</p>
              <div className="space-y-3">
                {classMoyByMatiere.map((m) => (
                  <div
                    key={m.matiere}
                    className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#0f1a2e] truncate pr-2">{m.matiere}</span>
                      <span className="text-[13px] font-bold text-[#0471a6] shrink-0">{m.moyenne.toFixed(2)}/20</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full">
                      <div
                        className="h-full bg-[#0471a6] rounded-full"
                        style={{ width: `${(m.moyenne / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
