'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Grade } from '../types';

const FALLBACK_GRADES: Grade[] = [
  { id: 'f1', student_id: '', teacher_id: '', class_id: '', matiere: 'Algorithmique', examen: 'Test 1', note: 14, coefficient: 0.5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'f2', student_id: '', teacher_id: '', class_id: '', matiere: 'Algorithmique', examen: 'TP noté', note: 16, coefficient: 1, created_at: '2024-01-20T00:00:00Z' },
  { id: 'f3', student_id: '', teacher_id: '', class_id: '', matiere: 'Algorithmique', examen: 'Exam partiel', note: 17, coefficient: 1.5, created_at: '2024-01-25T00:00:00Z' },
  { id: 'f4', student_id: '', teacher_id: '', class_id: '', matiere: 'Mathématiques', examen: 'Test 1', note: 12, coefficient: 1, created_at: '2024-01-16T00:00:00Z' },
  { id: 'f5', student_id: '', teacher_id: '', class_id: '', matiere: 'Mathématiques', examen: 'DM noté', note: 14, coefficient: 0.5, created_at: '2024-01-22T00:00:00Z' },
  { id: 'f6', student_id: '', teacher_id: '', class_id: '', matiere: 'Développement web', examen: 'TP 1', note: 17, coefficient: 1, created_at: '2024-01-17T00:00:00Z' },
  { id: 'f7', student_id: '', teacher_id: '', class_id: '', matiere: 'Développement web', examen: 'Projet final', note: 16, coefficient: 2, created_at: '2024-01-28T00:00:00Z' },
  { id: 'f8', student_id: '', teacher_id: '', class_id: '', matiere: 'Bases de données', examen: 'QCM', note: 13, coefficient: 1, created_at: '2024-01-18T00:00:00Z' },
  { id: 'f9', student_id: '', teacher_id: '', class_id: '', matiere: 'Bases de données', examen: 'TP SQL', note: 16, coefficient: 1.5, created_at: '2024-01-24T00:00:00Z' },
  { id: 'f10', student_id: '', teacher_id: '', class_id: '', matiere: 'Anglais technique', examen: 'Oral', note: 13, coefficient: 1, created_at: '2024-01-19T00:00:00Z' },
  { id: 'f11', student_id: '', teacher_id: '', class_id: '', matiere: 'Anglais technique', examen: 'Written test', note: 12, coefficient: 1, created_at: '2024-01-26T00:00:00Z' },
  { id: 'f12', student_id: '', teacher_id: '', class_id: '', matiere: 'Projet semaine', examen: 'Présentation', note: 18, coefficient: 2, created_at: '2024-01-30T00:00:00Z' },
];

interface GradeBookProps {
  grades: Grade[];
}

export function GradeBook({ grades }: Readonly<GradeBookProps>) {
  const displayGrades = grades.length > 0 ? grades : FALLBACK_GRADES;

  const grouped = displayGrades.reduce<Record<string, Grade[]>>((acc, g) => {
    if (!acc[g.matiere]) acc[g.matiere] = [];
    acc[g.matiere].push(g);
    return acc;
  }, {});

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.keys(grouped).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>)
  );

  const toggle = (matiere: string) =>
    setOpenSections((prev) => ({ ...prev, [matiere]: !prev[matiere] }));

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([matiere, items]) => {
        const totalCoeff = items.reduce((sum, g) => sum + g.coefficient, 0);
        const moyenne = totalCoeff > 0
          ? items.reduce((sum, g) => sum + g.note * g.coefficient, 0) / totalCoeff
          : 0;
        const isOpen = openSections[matiere] ?? true;

        return (
          <div key={matiere} className="border border-slate-200/50 rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => toggle(matiere)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
            >
              <span className="font-semibold text-[#0f1a2e] text-[15px]">{matiere}</span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#0471a6]">
                  Moyenne : {moyenne.toFixed(2)}/20
                </span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200/50">
                      <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500">
                        Examen
                      </th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500">
                        Note
                      </th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500">
                        Coeff.
                      </th>
                      <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-[13px] font-medium text-[#0f1a2e]">
                          {g.examen}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0471a6]/10 text-[#0471a6]">
                            {g.note}/20
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-[13px] text-slate-500">
                          ×{g.coefficient}
                        </td>
                        <td className="px-6 py-4 text-right text-[12px] text-slate-400">
                          {new Date(g.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
