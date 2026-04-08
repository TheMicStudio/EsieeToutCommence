'use client';

import { useRef, useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { deleteGrade, updateGrade } from '../actions';
import type { Grade } from '../types';

interface Student { id: string; nom: string; prenom: string }

interface GradeTableViewProps {
  grades: Grade[];
  students: Student[];
  canDelete?: boolean;
}

function noteColor(n: number) {
  if (n >= 14) return 'text-emerald-600 bg-emerald-50';
  if (n >= 10) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function avg(notes: number[]) {
  if (notes.length === 0) return null;
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}

export function GradeTableView({ grades, students, canDelete = false }: GradeTableViewProps) {
  const [localGrades, setLocalGrades] = useState(grades);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  async function handleDelete(gradeId: string) {
    setDeleting(gradeId);
    await deleteGrade(gradeId);
    setLocalGrades((prev) => prev.filter((g) => g.id !== gradeId));
    setDeleting(null);
  }

  async function handleSaveEdit(gradeId: string) {
    const val = parseFloat(editRef.current?.value ?? '');
    if (isNaN(val) || val < 0 || val > 20) return;
    setSaving(true);
    await updateGrade(gradeId, val);
    setLocalGrades((prev) => prev.map((g) => g.id === gradeId ? { ...g, note: val } : g));
    setSaving(false);
    setEditing(null);
  }

  if (students.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
        <p className="text-sm text-slate-400">Aucun élève dans cette classe.</p>
      </div>
    );
  }

  if (localGrades.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
        <p className="text-sm text-slate-400">Aucune note pour le moment.</p>
      </div>
    );
  }

  // Grouper par matière
  const matieres = [...new Set(localGrades.map((g) => g.matiere))].sort();

  return (
    <div className="space-y-6">
      {matieres.map((matiere) => {
        const matiereGrades = localGrades.filter((g) => g.matiere === matiere);
        // Examens uniques pour cette matière (triés par date)
        const examens = [...new Map(
          matiereGrades.map((g) => [g.examen, { examen: g.examen, coefficient: g.coefficient, date: g.created_at }])
        ).values()].sort((a, b) => a.date.localeCompare(b.date));

        // Index: student_id → examen → grade
        const index = new Map<string, Map<string, Grade>>();
        for (const g of matiereGrades) {
          if (!index.has(g.student_id)) index.set(g.student_id, new Map());
          index.get(g.student_id)!.set(g.examen, g);
        }

        // Étudiants ayant au moins une note dans cette matière
        const activeStudents = students.filter((s) => index.has(s.id));

        // Moyenne de classe par examen
        const examAvgs = examens.map((e) => {
          const notes = activeStudents
            .map((s) => index.get(s.id)?.get(e.examen)?.note)
            .filter((n): n is number => n !== undefined);
          return { examen: e.examen, avg: avg(notes) };
        });

        return (
          <div key={matiere} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            {/* Header matière */}
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between">
              <p className="font-semibold text-[#061826]">{matiere}</p>
              <span className="text-xs text-slate-400">{activeStudents.length} élève{activeStudents.length > 1 ? 's' : ''} · {examens.length} examen{examens.length > 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="sticky left-0 bg-white px-4 py-2.5 text-left text-xs font-semibold text-slate-400 min-w-[140px]">Élève</th>
                    {examens.map((e) => (
                      <th key={e.examen} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400 min-w-[100px]">
                        <div className="truncate max-w-[100px]">{e.examen}</div>
                        <div className="mt-0.5 text-[10px] font-normal text-slate-300">coeff {e.coefficient}</div>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400 min-w-[80px]">Moyenne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeStudents.map((s) => {
                    const studentGrades = examens.map((e) => index.get(s.id)?.get(e.examen));
                    const notedGrades = studentGrades.filter((g): g is Grade => g !== undefined);
                    // Moyenne pondérée
                    const moyNum = notedGrades.length > 0
                      ? notedGrades.reduce((sum, g) => sum + g.note * g.coefficient, 0) /
                        notedGrades.reduce((sum, g) => sum + g.coefficient, 0)
                      : null;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="sticky left-0 bg-white px-4 py-2.5 font-medium text-[#061826] group-hover:bg-slate-50/60">
                          {s.prenom} {s.nom}
                        </td>
                        {examens.map((e) => {
                          const grade = index.get(s.id)?.get(e.examen);
                          return (
                            <td key={e.examen} className="px-3 py-2 text-center">
                              {grade ? (
                                editing === grade.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      ref={editRef}
                                      type="number"
                                      min={0}
                                      max={20}
                                      step={0.5}
                                      defaultValue={grade.note}
                                      className="w-16 rounded-lg border border-[#89aae6] bg-white px-2 py-1 text-center text-sm font-bold focus:outline-none"
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(grade.id); if (e.key === 'Escape') setEditing(null); }}
                                      autoFocus
                                    />
                                    <button type="button" onClick={() => handleSaveEdit(grade.id)} disabled={saving} className="flex h-5 w-5 items-center justify-center rounded text-emerald-500 hover:text-emerald-700 disabled:opacity-50">
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button type="button" onClick={() => setEditing(null)} className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative inline-flex items-center gap-1 group/cell">
                                    <span className={['rounded-lg px-2.5 py-1 text-sm font-bold cursor-default', noteColor(grade.note)].join(' ')}>
                                      {grade.note}
                                    </span>
                                    {canDelete && (
                                      <div className="absolute -right-9 opacity-0 group-hover/cell:opacity-100 flex items-center gap-0.5 transition-all">
                                        <button
                                          type="button"
                                          onClick={() => setEditing(grade.id)}
                                          className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-[#0471a6]"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(grade.id)}
                                          disabled={deleting === grade.id}
                                          className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-red-400 disabled:opacity-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span className="text-slate-200">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          {moyNum !== null ? (
                            <span className={['rounded-lg px-2.5 py-1 text-sm font-bold', noteColor(moyNum)].join(' ')}>
                              {moyNum.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer : moyennes de classe */}
                <tfoot>
                  <tr className="border-t border-slate-100 bg-slate-50/60">
                    <td className="sticky left-0 bg-slate-50/60 px-4 py-2.5 text-xs font-semibold text-slate-400">Moy. classe</td>
                    {examAvgs.map((e) => (
                      <td key={e.examen} className="px-3 py-2 text-center">
                        {e.avg !== null ? (
                          <span className={['rounded-lg px-2 py-0.5 text-xs font-semibold', noteColor(e.avg)].join(' ')}>
                            {e.avg.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
