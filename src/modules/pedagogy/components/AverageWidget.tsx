import { Award } from 'lucide-react';
import type { AverageByMatiere } from '../types';

const FALLBACK_AVERAGES: AverageByMatiere[] = [
  { matiere: 'Algorithmique', moyenne: 15.5, total_coefficients: 3 },
  { matiere: 'Mathématiques', moyenne: 13.2, total_coefficients: 1.5 },
  { matiere: 'Développement web', moyenne: 16.75, total_coefficients: 3 },
  { matiere: 'Bases de données', moyenne: 14.8, total_coefficients: 2.5 },
  { matiere: 'Anglais technique', moyenne: 12.9, total_coefficients: 2 },
  { matiere: 'Projet semaine', moyenne: 18.0, total_coefficients: 2 },
];

interface AverageWidgetProps {
  averages: AverageByMatiere[];
}

export function AverageWidget({ averages }: AverageWidgetProps) {
  const displayAverages = averages.length > 0 ? averages : FALLBACK_AVERAGES;

  const totalCoeff = displayAverages.reduce((sum, a) => sum + a.total_coefficients, 0);
  const generaleMoyenne = totalCoeff > 0
    ? displayAverages.reduce((sum, a) => sum + a.moyenne * a.total_coefficients, 0) / totalCoeff
    : 0;

  return (
    <div className="space-y-4">
      {/* Section 1 — Moyenne générale */}
      <div className="relative bg-white border border-slate-200/50 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
        <Award className="absolute top-4 right-4 h-10 w-10 text-[#0471a6] opacity-20" />
        <p className="text-[14px] font-bold text-[#0f1a2e]">Moyenne générale</p>
        <p className="mt-3 text-[42px] font-bold text-[#0471a6] tracking-tight leading-none">
          {generaleMoyenne.toFixed(2)}/20
        </p>
        <p className="mt-2 text-[12px] text-slate-500">Moyenne pondérée</p>
      </div>

      {/* Section 2 — Notes par matière */}
      <div className="bg-white border border-slate-200/50 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <p className="text-[14px] font-bold text-[#0f1a2e] mb-4">Notes par matière</p>
        <div className="space-y-3">
          {displayAverages.map((a) => (
            <div
              key={a.matiere}
              className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#0f1a2e]">{a.matiere}</span>
                <span className="text-[13px] font-bold text-[#0471a6]">
                  {a.moyenne.toFixed(2)}/20
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full">
                <div
                  className="h-full bg-[#0471a6] rounded-full"
                  style={{ width: `${(a.moyenne / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
