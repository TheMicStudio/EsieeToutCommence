'use client';

import { useState, useTransition, useMemo } from 'react';
import { Loader2, CalendarCheck, X } from 'lucide-react';
import { toggleTeacherWeek, setTeacherAllWeeks } from '@/modules/admin/planning-actions';

// ─── Utilitaires ───────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/** Formate une date UTC en YYYY-MM-DD sans décalage de fuseau horaire */
function toDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getSchoolYearMondays(): string[] {
  const today = new Date();
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const mondays: string[] = [];
  // Utiliser UTC pour éviter le décalage de fuseau horaire (minuit local ≠ minuit UTC)
  let d = new Date(Date.UTC(year, 8, 1)); // 1er septembre UTC
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  const end = new Date(Date.UTC(year + 1, 6, 31)); // fin juillet UTC
  while (d <= end) {
    mondays.push(toDateStr(d));
    d = new Date(d);
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return mondays;
}

function groupByMonth(mondays: string[]): { label: string; key: string; weeks: string[] }[] {
  const map = new Map<string, string[]>();
  const order: string[] = [];
  for (const m of mondays) {
    // Forcer UTC pour éviter le décalage de fuseau (YYYY-MM-DD → T00:00:00Z)
    const d = new Date(m + 'T00:00:00Z');
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push(m);
  }
  return order.map((key) => {
    const [year, month] = key.split('-').map(Number);
    return { label: `${MONTHS_FR[month]} ${year}`, key, weeks: map.get(key)! };
  });
}

// ─── Composant ────────────────────────────────────────────────────────────────

interface WeekAvailabilityGridProps {
  teacherId: string;
  initialWeeks: string[]; // liste de YYYY-MM-DD (lundis disponibles)
}

export function WeekAvailabilityGrid({ teacherId, initialWeeks }: Readonly<WeekAvailabilityGridProps>) {
  const [selectedWeeks, setSelectedWeeks] = useState(() => new Set(initialWeeks));
  const [pending, startTransition] = useTransition();

  const allMondays = useMemo(() => getSchoolYearMondays(), []);
  const grouped    = useMemo(() => groupByMonth(allMondays), [allMondays]);
  const count      = selectedWeeks.size;
  const total      = allMondays.length;

  function handleToggle(weekStr: string) {
    const wasSelected = selectedWeeks.has(weekStr);
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (wasSelected) next.delete(weekStr); else next.add(weekStr);
      return next;
    });
    startTransition(async () => {
      await toggleTeacherWeek(teacherId, weekStr);
    });
  }

  function handleSelectAll() {
    setSelectedWeeks(new Set(allMondays));
    startTransition(async () => {
      await setTeacherAllWeeks(teacherId, allMondays);
    });
  }

  function handleClearAll() {
    setSelectedWeeks(new Set());
    startTransition(async () => {
      await setTeacherAllWeeks(teacherId, []);
    });
  }

  const isAllYear = count === total;

  return (
    <div className="space-y-4">
      {/* Barre d'actions rapides */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSelectAll}
          disabled={pending || isAllYear}
          className={[
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
            isAllYear
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default'
              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50',
          ].join(' ')}
        >
          <CalendarCheck className="h-4 w-4" />
          Toute l&apos;année
        </button>

        <button
          onClick={handleClearAll}
          disabled={pending || count === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 transition-all"
        >
          <X className="h-4 w-4" />
          Effacer
        </button>

        <div className="flex items-center gap-2 ml-1">
          <span className={[
            'rounded-full px-3 py-1 text-xs font-bold',
            isAllYear
              ? 'bg-emerald-100 text-emerald-700'
              : count > 0
              ? 'bg-[#0471a6]/10 text-[#0471a6]'
              : 'bg-slate-100 text-slate-400',
          ].join(' ')}>
            {count === 0 ? 'Aucune semaine' : isAllYear ? 'Disponible toute l\'année' : `${count} semaine${count > 1 ? 's' : ''}`}
          </span>
          {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {/* Grille par mois */}
      <div className="space-y-4">
        {grouped.map(({ label, key, weeks }) => {
          const monthSelected = weeks.filter((w) => selectedWeeks.has(w)).length;
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                {monthSelected > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {monthSelected}/{weeks.length}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {weeks.map((weekStr) => {
                  // T00:00:00Z = UTC midnight → getUTC* retourne la bonne date quelle que soit la timezone
                  const d = new Date(weekStr + 'T00:00:00Z');
                  const dayNum = d.getUTCDate();
                  const isSelected = selectedWeeks.has(weekStr);

                  // Semaine actuelle (calculée en UTC)
                  const today = new Date();
                  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                  const dayOfWeek = todayUTC.getUTCDay();
                  const diffDays = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  const thisMondayUTC = new Date(todayUTC);
                  thisMondayUTC.setUTCDate(todayUTC.getUTCDate() + diffDays);
                  const isCurrentWeek = weekStr === toDateStr(thisMondayUTC);

                  return (
                    <button
                      key={weekStr}
                      onClick={() => handleToggle(weekStr)}
                      disabled={pending}
                      title={`Semaine du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`}
                      className={[
                        'relative h-9 min-w-[2.25rem] rounded-xl px-2 text-sm font-semibold transition-all border',
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm hover:bg-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#89aae6] hover:bg-[#0471a6]/5 hover:text-[#0471a6]',
                        isCurrentWeek ? 'ring-2 ring-offset-1 ring-[#0471a6]/50' : '',
                        'disabled:cursor-wait',
                      ].join(' ')}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-emerald-500 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-slate-100 border border-slate-200 inline-block" />
          Indisponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full ring-2 ring-[#0471a6]/50 inline-block bg-slate-100 border border-slate-200" />
          Semaine actuelle
        </span>
        <span className="ml-auto italic">
          Le numéro indique le jour du début de la semaine (lundi)
        </span>
      </div>
    </div>
  );
}
