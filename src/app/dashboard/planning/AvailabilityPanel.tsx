'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, User, CalendarCheck } from 'lucide-react';
import { WeekAvailabilityGrid } from './WeekAvailabilityGrid';
import type { TeacherForPlanning } from '@/modules/admin/planning-actions';

// ─── Carte d'un professeur ────────────────────────────────────────────────────

function TeacherWeekCard({
  teacher,
  initialWeeks,
}: Readonly<{
  teacher: TeacherForPlanning;
  initialWeeks: string[];
}>) {
  const [expanded, setExpanded] = useState(false);
  const weekCount = initialWeeks.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ac80a0]/20 text-[#ac80a0] text-sm font-bold">
          {teacher.prenom[0]}{teacher.nom[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#061826]">
            {teacher.prenom} {teacher.nom}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {teacher.matieres_enseignees.slice(0, 3).join(' · ') || 'Aucune matière assignée'}
          </p>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {weekCount === 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
              Non configuré
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CalendarCheck className="h-3 w-3" />
              {weekCount} sem.
            </span>
          )}
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <p className="text-xs text-slate-400 mb-4">
            Sélectionnez les semaines où <strong className="text-slate-600">{teacher.prenom} {teacher.nom}</strong> peut enseigner.
            Sans sélection, le moteur considère le prof disponible toute l&apos;année.
          </p>
          <WeekAvailabilityGrid
            teacherId={teacher.id}
            initialWeeks={initialWeeks}
          />
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function AvailabilityPanel({
  teachers,
  weeksByTeacher,
}: Readonly<{
  teachers: TeacherForPlanning[];
  weeksByTeacher: Record<string, string[]>;
}>) {
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <User className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Aucun professeur trouvé</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Créez d&apos;abord des comptes professeurs depuis la page Administration.
        </p>
      </div>
    );
  }

  const configured = teachers.filter((t) => (weeksByTeacher[t.id]?.length ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#061826]">
          {teachers.length} professeur{teachers.length > 1 ? 's' : ''}
        </p>
        <span className="text-xs text-slate-400">
          {configured} configuré{configured > 1 ? 's' : ''} · {teachers.length - configured} sans restriction (disponible toute l&apos;année)
        </span>
      </div>

      <div className="rounded-2xl border border-[#89aae6]/30 bg-[#0471a6]/5 px-4 py-3 text-sm text-[#3685b5]">
        <strong>Conseil :</strong> Les profs sans sélection sont considérés disponibles <em>toute l&apos;année</em>.
        Configurez uniquement ceux qui ont des contraintes (vacataires, intervenants ponctuels, etc.).
      </div>

      <div className="space-y-3">
        {teachers.map((teacher) => (
          <TeacherWeekCard
            key={teacher.id}
            teacher={teacher}
            initialWeeks={weeksByTeacher[teacher.id] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
