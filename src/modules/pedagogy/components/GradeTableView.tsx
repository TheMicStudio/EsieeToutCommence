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

function badgeCls(n: number) {
  if (n >= 14) return 'bg-emerald-50 border border-emerald-400 text-emerald-600';
  if (n >= 10) return 'bg-amber-50 border border-amber-400 text-amber-600';
  return 'bg-red-50 border border-red-400 text-red-600';
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
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
        <p className="text-sm text-slate-400">Aucun élève dans cette classe.</p>
      </div>
    );
  }

  if (localGrades.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
        <p className="text-sm text-slate-400">Aucune note pour le moment.</p>
      </div>
    );
  }

  const matieres = [...new Set(localGrades.map((g) => g.matiere))].sort();

  return (
    <div className="space-y-4">
      {matieres.map((matiere) => {
        const matiereGrades = localGrades.filter((g) => g.matiere === matiere);

        const examens = [...new Map(
          matiereGrades.map((g) => [g.examen, { examen: g.examen, coefficient: g.coefficient, date: g.created_at }])
        ).values()].sort((a, b) => a.date.localeCompare(b.date));

        const index = new Map<string, Map<string, Grade>>();
        for (const g of matiereGrades) {
          if (!index.has(g.student_id)) index.set(g.student_id, new Map());
          index.get(g.student_id)!.set(g.examen, g);
        }

        const activeStudents = students.filter((s) => index.has(s.id));

        const examAvgs = examens.map((e) => {
          const notes = activeStudents
            .map((s) => index.get(s.id)?.get(e.examen)?.note)
            .filter((n): n is number => n !== undefined);
          return { examen: e.examen, avg: avg(notes) };
        });

        // Moyenne pondérée de la classe pour cette matière
        const allNotes = matiereGrades;
        const totalCoeff = allNotes.reduce((s, g) => s + g.coefficient, 0);
        const classMoy = totalCoeff > 0
          ? allNotes.reduce((s, g) => s + g.note * g.coefficient, 0) / totalCoeff
          : null;

        return (
          <div key={matiere} className="border border-slate-200/50 rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            {/* Header matière */}
            <div className="border-b border-slate-200/50 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <span className="font-semibold text-[#0f1a2e] text-[15px]">{matiere}</span>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-slate-400">
                  {activeStudents.length} élève{activeStudents.length > 1 ? 's' : ''} · {examens.length} examen{examens.length > 1 ? 's' : ''}
                </span>
                {classMoy !== null && (
                  <span className="text-[13px] font-bold text-[#0471a6]">
                    Moy. classe : {classMoy.toFixed(2)}/20
                  </span>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/50">
                    <th className="sticky left-0 bg-slate-50/50 px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 min-w-[160px]">
                      Élève
                    </th>
                    {examens.map((e) => (
                      <th key={e.examen} className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 min-w-[110px]">
                        <div className="truncate max-w-[110px]">{e.examen}</div>
                        <div className="mt-0.5 text-[10px] font-normal normal-case tracking-normal text-slate-400">coeff {e.coefficient}</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 min-w-[90px]">
                      Moyenne
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeStudents.map((s) => {
                    const studentGrades = examens.map((e) => index.get(s.id)?.get(e.examen));
                    const notedGrades = studentGrades.filter((g): g is Grade => g !== undefined);
                    const moyNum = notedGrades.length > 0
                      ? notedGrades.reduce((sum, g) => sum + g.note * g.coefficient, 0) /
                        notedGrades.reduce((sum, g) => sum + g.coefficient, 0)
                      : null;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="sticky left-0 bg-white px-6 py-3 text-[13px] font-medium text-[#0f1a2e] group-hover:bg-slate-50/50">
                          {s.prenom} {s.nom}
                        </td>
                        {examens.map((e) => {
                          const grade = index.get(s.id)?.get(e.examen);
                          return (
                            <td key={e.examen} className="px-4 py-3 text-center">
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
                                      className="w-16 rounded-lg border border-[#0471a6] bg-white px-2 py-1 text-center text-sm font-bold focus:outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(grade.id);
                                        if (e.key === 'Escape') setEditing(null);
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(grade.id)}
                                      disabled={saving}
                                      className="flex h-5 w-5 items-center justify-center rounded text-emerald-500 hover:text-emerald-700 disabled:opacity-50"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditing(null)}
                                      className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative inline-flex items-center gap-1 group/cell">
                                    <span className={[
                                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold cursor-default',
                                      badgeCls(grade.note),
                                    ].join(' ')}>
                                      {grade.note}/20
                                    </span>
                                    {canDelete && (
                                      <div className="absolute -right-10 opacity-0 group-hover/cell:opacity-100 flex items-center gap-0.5 transition-all">
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
                                <span className="text-slate-200 text-sm">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          {moyNum !== null ? (
                            <span className={[
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold',
                              badgeCls(moyNum),
                            ].join(' ')}>
                              {moyNum.toFixed(1)}/20
                            </span>
                          ) : (
                            <span className="text-slate-200 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer : moyennes de classe par examen */}
                <tfoot>
                  <tr className="border-t border-slate-200/50 bg-slate-50/50">
                    <td className="sticky left-0 bg-slate-50/50 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
                      Moy. classe
                    </td>
                    {examAvgs.map((e) => (
                      <td key={e.examen} className="px-4 py-3 text-center">
                        {e.avg !== null ? (
                          <span className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                            badgeCls(e.avg),
                          ].join(' ')}>
                            {e.avg.toFixed(1)}/20
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
