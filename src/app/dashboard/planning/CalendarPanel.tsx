'use client';

import { useState, useTransition } from 'react';
import {
  GraduationCap, ChevronDown, ChevronRight, Loader2,
  AlertCircle, CalendarDays, Zap, Settings, CheckCircle2,
  Building2, School,
} from 'lucide-react';
import {
  updateCalendarMode,
  upsertCalendarWeek,
  type ClassWithCalendar,
  type CalendarWeek,
} from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

const MODE_CONFIG = {
  FULL_TIME: {
    label: 'Temps plein',
    desc: "Toujours à l'école — le moteur planifie librement toutes les semaines",
    icon: School,
    color: 'border-emerald-200 bg-emerald-50',
    activeColor: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/50',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  FIXED_PATTERN: {
    label: 'Rythme fixe (alternance)',
    desc: 'Pattern répétitif calculé automatiquement (ex: 1S école / 3S entreprise)',
    icon: Zap,
    color: 'border-blue-200 bg-blue-50',
    activeColor: 'border-blue-400 bg-blue-50 ring-2 ring-blue-300/50',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  MANUAL: {
    label: 'Manuel (semaine par semaine)',
    desc: "L'admin définit chaque semaine si la classe est à l'école ou en entreprise",
    icon: Settings,
    color: 'border-amber-200 bg-amber-50',
    activeColor: 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/50',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
} as const;

// ─── Génère les lundis de l'année scolaire (sept → juil) ──────────────────────
function getSchoolYearMondays(refYear = new Date().getFullYear()): string[] {
  const mondays: string[] = [];
  // Démarrage en septembre de l'année de référence
  let d = new Date(refYear, 8, 1); // 1er septembre
  // Trouver le premier lundi
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  // Fin juillet suivant
  const end = new Date(refYear + 1, 6, 31);
  while (d <= end) {
    mondays.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  const end = new Date(d);
  end.setDate(end.getDate() + 4);
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ─── Formulaire mode FIXED_PATTERN ────────────────────────────────────────────

function FixedPatternForm({
  classe,
  onSave,
}: Readonly<{
  classe: ClassWithCalendar;
  onSave: () => void;
}>) {
  const [pending, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('calendar_mode', 'FIXED_PATTERN');
    startSave(async () => {
      const res = await updateCalendarMode(classe.id, fd);
      if (res.error) { setError(res.error); return; }
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSave(); }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl bg-white border border-slate-200 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pattern_school_weeks" className={labelCls}>Semaines école</label>
          <input
            id="pattern_school_weeks"
            name="pattern_school_weeks"
            type="number" min={1} max={20}
            defaultValue={classe.pattern_school_weeks ?? 1}
            required className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="pattern_company_weeks" className={labelCls}>Semaines entreprise</label>
          <input
            id="pattern_company_weeks"
            name="pattern_company_weeks"
            type="number" min={1} max={20}
            defaultValue={classe.pattern_company_weeks ?? 3}
            required className={inputCls}
          />
        </div>
      </div>
      <div>
        <label htmlFor="pattern_reference_date" className={labelCls}>Lundi de référence (première semaine école)</label>
        <input
          id="pattern_reference_date"
          name="pattern_reference_date"
          type="date"
          defaultValue={classe.pattern_reference_date ?? ''}
          required className={inputCls}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <button
        type="submit" disabled={pending || success}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        {success ? <><CheckCircle2 className="h-4 w-4" /> Enregistré</> :
         pending  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> :
                    'Enregistrer le pattern'}
      </button>
    </form>
  );
}

// ─── Grille semaine par semaine (MANUAL) ──────────────────────────────────────

function ManualCalendarGrid({
  classe,
  initialWeeks,
}: Readonly<{
  classe: ClassWithCalendar;
  initialWeeks: CalendarWeek[];
}>) {
  const [weeks, setWeeks] = useState<Record<string, 'SCHOOL' | 'COMPANY'>>(() => {
    const map: Record<string, 'SCHOOL' | 'COMPANY'> = {};
    for (const w of initialWeeks) map[w.week_start] = w.location;
    return map;
  });
  const [toggling, setToggling] = useState<string | null>(null);

  const mondays = getSchoolYearMondays();

  async function toggleWeek(monday: string) {
    setToggling(monday);
    const current = weeks[monday];
    const next: 'SCHOOL' | 'COMPANY' = current === 'SCHOOL' ? 'COMPANY' : 'SCHOOL';
    // Optimistic update
    setWeeks((prev) => ({ ...prev, [monday]: next }));
    const res = await upsertCalendarWeek(classe.id, monday, next);
    if (res.error) {
      // Rollback
      setWeeks((prev) => ({ ...prev, [monday]: current ?? 'SCHOOL' }));
    }
    setToggling(null);
  }

  const schoolCount   = Object.values(weeks).filter((v) => v === 'SCHOOL').length;
  const companyCount  = Object.values(weeks).filter((v) => v === 'COMPANY').length;
  const undefinedCount = mondays.length - Object.keys(weeks).length;

  return (
    <div className="mt-3 space-y-3">
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" />
          École ({schoolCount} sem.)
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-3 w-3 rounded-sm bg-blue-400" />
          Entreprise ({companyCount} sem.)
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-3 w-3 rounded-sm bg-slate-200" />
          Non défini ({undefinedCount} sem.)
        </span>
        <span className="ml-auto text-slate-400">Cliquez sur une semaine pour basculer</span>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
        {mondays.map((monday) => {
          const loc = weeks[monday];
          const isToggling = toggling === monday;
          return (
            <button
              key={monday}
              onClick={() => toggleWeek(monday)}
              disabled={isToggling}
              className={[
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all',
                loc === 'SCHOOL'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : loc === 'COMPANY'
                  ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100',
                'disabled:opacity-60',
              ].join(' ')}
            >
              {isToggling ? (
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              ) : loc === 'SCHOOL' ? (
                <School className="h-3 w-3 shrink-0 text-emerald-600" />
              ) : loc === 'COMPANY' ? (
                <Building2 className="h-3 w-3 shrink-0 text-blue-600" />
              ) : (
                <span className="h-3 w-3 shrink-0 rounded-full border border-slate-300" />
              )}
              <span className="truncate">{formatWeekLabel(monday).split('→')[0].trim()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Carte d'une classe ───────────────────────────────────────────────────────

function ClassCalendarCard({
  classe,
  initialWeeks,
}: Readonly<{
  classe: ClassWithCalendar;
  initialWeeks: CalendarWeek[];
}>) {
  const [expanded, setExpanded]   = useState(false);
  const [mode, setMode]           = useState(classe.calendar_mode);
  const [saving, startSave]       = useTransition();
  const [error, setError]         = useState<string | null>(null);

  async function applySimpleMode(newMode: 'FULL_TIME' | 'MANUAL') {
    setError(null);
    const fd = new FormData();
    fd.set('calendar_mode', newMode);
    startSave(async () => {
      const res = await updateCalendarMode(classe.id, fd);
      if (res.error) { setError(res.error); return; }
      setMode(newMode);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#89aae6]/20">
          <GraduationCap className="h-5 w-5 text-[#3685b5]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#061826] truncate">{classe.nom}</p>
          <p className="text-xs text-slate-400">Promotion {classe.annee}</p>
        </div>
        <span className={[
          'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
          mode === 'FULL_TIME'     ? 'bg-emerald-100 text-emerald-700' :
          mode === 'FIXED_PATTERN' ? 'bg-blue-100 text-blue-700' :
                                     'bg-amber-100 text-amber-700',
        ].join(' ')}>
          {MODE_CONFIG[mode].label}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Sélection du mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(MODE_CONFIG) as (keyof typeof MODE_CONFIG)[]).map((m) => {
              const cfg = MODE_CONFIG[m];
              const Icon = cfg.icon;
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    if (m !== 'FIXED_PATTERN') applySimpleMode(m as 'FULL_TIME' | 'MANUAL');
                  }}
                  disabled={saving}
                  className={[
                    'flex flex-col gap-2 rounded-xl border p-3 text-left transition-all',
                    isActive ? cfg.activeColor : cfg.color,
                    'hover:ring-1 hover:ring-slate-300 disabled:opacity-60',
                  ].join(' ')}
                >
                  <div className={['flex h-8 w-8 items-center justify-center rounded-lg', cfg.iconBg].join(' ')}>
                    <Icon className={['h-4 w-4', cfg.iconColor].join(' ')} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#061826]">{cfg.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{cfg.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Config spécifique au mode */}
          {saving && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {mode === 'FIXED_PATTERN' && (
            <FixedPatternForm classe={{ ...classe, calendar_mode: mode }} onSave={() => {}} />
          )}

          {mode === 'MANUAL' && (
            <ManualCalendarGrid classe={classe} initialWeeks={initialWeeks} />
          )}

          {mode === 'FULL_TIME' && !saving && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Toutes les semaines hors fermetures sont éligibles au planning.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function CalendarPanel({
  classes,
  weeksByClass,
}: Readonly<{
  classes: ClassWithCalendar[];
  weeksByClass: Record<string, CalendarWeek[]>;
}>) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <CalendarDays className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Aucune classe importée</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Importez d&apos;abord les étudiants via CSV pour que les classes apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((classe) => (
        <ClassCalendarCard
          key={classe.id}
          classe={classe}
          initialWeeks={weeksByClass[classe.id] ?? []}
        />
      ))}
    </div>
  );
}
