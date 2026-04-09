'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, AlertTriangle,
  Clock, User, DoorOpen, BookOpen, CalendarDays, LayoutGrid, List,
} from 'lucide-react';
import type { SessionEvent } from '@/modules/admin/planning-actions';

// ─── Config ────────────────────────────────────────────────────────────────────

const DAY_START_H = 7;
const DAY_END_H   = 20;
const TOTAL_MIN   = (DAY_END_H - DAY_START_H) * 60;
const PX_PER_MIN  = 1.2;
const GRID_H      = Math.round(TOTAL_MIN * PX_PER_MIN);

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// Palette couleurs matières — valeurs statiques pour éviter les purges Tailwind
const PALETTE = [
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af' },
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  { bg: '#ccfbf1', text: '#134e4a', border: '#5eead4' },
  { bg: '#ffedd5', text: '#7c2d12', border: '#fdba74' },
];

const CONFLICT_STYLE = { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };

// Tailwind classes statiques pour la vue semaine (doivent rester dans le bundle)
const WEEK_COLORS = [
  { bg: 'bg-blue-100',   border: 'border-blue-300',   hover: 'hover:bg-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-500',   solid: '#3b82f6' },
  { bg: 'bg-purple-100', border: 'border-purple-300', hover: 'hover:bg-purple-200', text: 'text-purple-800', dot: 'bg-purple-500', solid: '#a855f7' },
  { bg: 'bg-emerald-100',border: 'border-emerald-300',hover: 'hover:bg-emerald-200',text: 'text-emerald-800',dot: 'bg-emerald-500',solid: '#10b981' },
  { bg: 'bg-amber-100',  border: 'border-amber-300',  hover: 'hover:bg-amber-200',  text: 'text-amber-800',  dot: 'bg-amber-500',  solid: '#f59e0b' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', hover: 'hover:bg-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500', solid: '#6366f1' },
  { bg: 'bg-teal-100',   border: 'border-teal-300',   hover: 'hover:bg-teal-200',   text: 'text-teal-800',   dot: 'bg-teal-500',   solid: '#14b8a6' },
  { bg: 'bg-orange-100', border: 'border-orange-300', hover: 'hover:bg-orange-200', text: 'text-orange-800', dot: 'bg-orange-500', solid: '#f97316' },
  { bg: 'bg-pink-100',   border: 'border-pink-300',   hover: 'hover:bg-pink-200',   text: 'text-pink-800',   dot: 'bg-pink-500',   solid: '#ec4899' },
];
const CONFLICT_WEEK = { bg: 'bg-rose-100', border: 'border-rose-400', hover: 'hover:bg-rose-200', text: 'text-rose-800', dot: 'bg-rose-500', solid: '#ef4444' };

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h) % PALETTE.length;
}

// Construit un mapping class_id → index couleur (stable, basé sur l'ordre d'apparition)
function buildClassColorMap(sessions: SessionEvent[]): Map<string, number> {
  const map = new Map<string, number>();
  let idx = 0;
  for (const s of sessions) {
    if (!map.has(s.class_id)) {
      map.set(s.class_id, idx % WEEK_COLORS.length);
      idx++;
    }
  }
  return map;
}

// ─── Utilitaires date (tout en UTC) ────────────────────────────────────────────

function toUTCDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function getMonday(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function addDays(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

function minutesFromDayStart(iso: string): number {
  const d = new Date(iso);
  return (d.getUTCHours() - DAY_START_H) * 60 + d.getUTCMinutes();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`;
}

function getSchoolYear(sessions: SessionEvent[]): number {
  const drafts = sessions.filter(s => s.status !== 'CONFLICT_ERROR');
  if (!drafts.length) {
    const today = new Date();
    return today.getUTCMonth() >= 8 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  }
  const first = new Date(drafts.map(s => s.start_timestamp).sort((a, b) => a.localeCompare(b))[0]);
  return first.getUTCMonth() >= 8 ? first.getUTCFullYear() : first.getUTCFullYear() - 1;
}

// ─── SessionTooltip ────────────────────────────────────────────────────────────

function SessionTooltip({ session, onClose }: { session: SessionEvent; onClose: () => void }) {
  const isConflict = session.status === 'CONFLICT_ERROR';
  const duration = Math.round((new Date(session.end_timestamp).getTime() - new Date(session.start_timestamp).getTime()) / 60000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/70 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={['px-5 py-4', isConflict ? 'bg-rose-50 border-b border-rose-200' : 'bg-[#0471a6]/5 border-b border-[#89aae6]/30'].join(' ')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={['text-lg font-bold', isConflict ? 'text-rose-800' : 'text-[#061826]'].join(' ')}>{session.subject_name}</p>
              <p className="text-sm text-slate-500">{session.class_nom}</p>
            </div>
            {isConflict && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100"><AlertTriangle className="h-5 w-5 text-rose-600" /></div>}
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Horaire</p>
                <p className="text-sm font-semibold text-[#061826]">{formatTime(session.start_timestamp)} – {formatTime(session.end_timestamp)}</p>
                <p className="text-xs text-slate-400">{Math.floor(duration/60)}h{duration%60 > 0 ? `${duration%60}min` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Professeur</p>
                <p className="text-sm font-semibold text-[#061826]">{session.teacher_prenom} {session.teacher_nom}</p>
              </div>
            </div>
          </div>
          {session.room_nom && (
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Salle</p>
                <p className="text-sm font-semibold text-[#061826]">{session.room_nom}</p>
              </div>
            </div>
          )}
          {isConflict && session.conflict_reason && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
              <p className="text-xs font-semibold text-rose-700 mb-1">Raison du conflit</p>
              <p className="text-xs text-rose-600">{session.conflict_reason}</p>
            </div>
          )}
        </div>
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Bloc session (vue semaine) ────────────────────────────────────────────────

function SessionBlock({ session, classColorMap, multiClass, onClick }: {
  session: SessionEvent;
  classColorMap: Map<string, number>;
  multiClass: boolean;
  onClick: (s: SessionEvent) => void;
}) {
  const isConflict = session.status === 'CONFLICT_ERROR';
  const colorIdx = classColorMap.get(session.class_id) ?? 0;
  const colors = isConflict ? CONFLICT_WEEK : WEEK_COLORS[colorIdx];
  const topPx    = Math.round(Math.max(0, minutesFromDayStart(session.start_timestamp)) * PX_PER_MIN);
  const durMin   = Math.round((new Date(session.end_timestamp).getTime() - new Date(session.start_timestamp).getTime()) / 60000);
  const heightPx = Math.max(24, Math.round(durMin * PX_PER_MIN) - 2);
  const isShort  = heightPx < 40;

  return (
    <div
      className={[
        'absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-1 cursor-pointer transition-all overflow-hidden',
        colors.bg, colors.border, colors.hover,
        isConflict ? 'border-dashed' : '',
      ].join(' ')}
      style={{ top: topPx, height: heightPx }}
      onClick={() => onClick(session)}
    >
      {isConflict && <AlertTriangle className="absolute top-1 right-1 h-3 w-3 text-rose-500" />}
      <p className={['font-semibold leading-tight truncate', colors.text, isShort ? 'text-[10px]' : 'text-xs'].join(' ')}>{session.subject_name}</p>
      {!isShort && (
        <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
          {formatTime(session.start_timestamp)}–{formatTime(session.end_timestamp)}
          {session.room_nom && ` · ${session.room_nom}`}
        </p>
      )}
      {!isShort && heightPx >= 56 && multiClass && (
        <p className={['text-[10px] font-semibold truncate leading-tight mt-0.5', colors.text].join(' ')}>{session.class_nom}</p>
      )}
      {!isShort && heightPx >= 72 && (
        <p className="text-[10px] text-slate-400 truncate leading-tight">{session.teacher_prenom} {session.teacher_nom}</p>
      )}
    </div>
  );
}

// ─── Liste des matières (navigation rapide) ────────────────────────────────────

function CourseListPanel({ sessions, classColorMap, onNavigate }: {
  sessions: SessionEvent[];
  classColorMap: Map<string, number>;
  onNavigate: (monday: Date) => void;
}) {
  // Grouper par classe → liste de matières
  const byClass = useMemo(() => {
    const classMap = new Map<string, { class_id: string; class_nom: string; subjects: Map<string, SessionEvent[]> }>();
    for (const s of sessions) {
      if (s.status === 'CONFLICT_ERROR') continue;
      if (!classMap.has(s.class_id)) classMap.set(s.class_id, { class_id: s.class_id, class_nom: s.class_nom, subjects: new Map() });
      const cls = classMap.get(s.class_id)!;
      const key = `${s.subject_name}__${s.teacher_id}`;
      if (!cls.subjects.has(key)) cls.subjects.set(key, []);
      cls.subjects.get(key)!.push(s);
    }
    return Array.from(classMap.values()).sort((a, b) => a.class_nom.localeCompare(b.class_nom));
  }, [sessions]);

  if (!byClass.length) return null;

  return (
    <div className="space-y-3">
      {byClass.map((cls) => {
        const colorIdx = classColorMap.get(cls.class_id) ?? 0;
        const wc = WEEK_COLORS[colorIdx];
        const p  = PALETTE[colorIdx];
        return (
          <div key={cls.class_id} className="rounded-2xl border overflow-hidden" style={{ borderColor: p.border }}>
            {/* Header classe */}
            <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: p.bg }}>
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.text }} />
              <span className="text-xs font-bold" style={{ color: p.text }}>{cls.class_nom}</span>
              <span className="ml-auto text-[10px] font-semibold" style={{ color: p.text }}>
                {Array.from(cls.subjects.values()).reduce((acc, ss) => acc + ss.length, 0)} séances
              </span>
            </div>
            {/* Matières */}
            <div className="overflow-x-auto">
              <div className="flex gap-1.5 px-2 py-2" style={{ minWidth: 'max-content' }}>
                {Array.from(cls.subjects.entries()).map(([key, ss]) => {
                  const first = ss.map(s => new Date(s.start_timestamp)).sort((a,b) => a.getTime()-b.getTime())[0];
                  const firstStr = first.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
                  const teacher = `${ss[0].teacher_prenom} ${ss[0].teacher_nom}`;
                  return (
                    <button
                      key={key}
                      onClick={() => onNavigate(getMonday(first))}
                      title={`Aller au premier cours : ${firstStr}`}
                      className={['flex flex-col gap-0.5 rounded-xl border px-2.5 py-2 text-left transition-all', wc.hover, 'hover:shadow-sm'].join(' ')}
                      style={{ borderColor: p.border, backgroundColor: '#fff' }}
                    >
                      <span className={['text-xs font-bold truncate max-w-[130px]', wc.text].join(' ')}>{ss[0].subject_name}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{teacher}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={['text-[10px] font-semibold', wc.text].join(' ')}>{ss.length} séance{ss.length > 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">dès {firstStr}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vue annuelle ─────────────────────────────────────────────────────────────

function AnnualView({ sessions, currentMonday, onWeekClick }: {
  sessions: SessionEvent[];
  currentMonday: Date;
  onWeekClick: (monday: Date) => void;
}) {
  const year = useMemo(() => getSchoolYear(sessions), [sessions]);

  const allMondays = useMemo(() => {
    const mondays: Date[] = [];
    let d = new Date(Date.UTC(year, 8, 1));
    while (d.getUTCDay() !== 1) d = new Date(d.getTime() + 86400000);
    const end = new Date(Date.UTC(year + 1, 6, 31));
    while (d <= end) { mondays.push(new Date(d)); d = new Date(d.getTime() + 7*86400000); }
    return mondays;
  }, [year]);

  const weekMap = useMemo(() => {
    const map = new Map<string, { draft: number; conflict: number; subjects: string[] }>();
    for (const s of sessions) {
      const key = toUTCDateStr(getMonday(new Date(s.start_timestamp)));
      const e = map.get(key) ?? { draft: 0, conflict: 0, subjects: [] };
      if (s.status === 'CONFLICT_ERROR') e.conflict++;
      else { e.draft++; if (!e.subjects.includes(s.subject_name)) e.subjects.push(s.subject_name); }
      map.set(key, e);
    }
    return map;
  }, [sessions]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Date[]>();
    for (const m of allMondays) {
      const key = `${m.getUTCFullYear()}-${m.getUTCMonth()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries()).map(([key, weeks]) => {
      const [y, mo] = key.split('-').map(Number);
      return { label: `${MONTHS_FR[mo]} ${y}`, weeks };
    });
  }, [allMondays]);

  const currentStr = toUTCDateStr(currentMonday);
  const todayStr   = toUTCDateStr(getMonday(new Date()));

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-emerald-400 inline-block" /> Cours planifiés</div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-rose-400 inline-block" /> Conflits uniquement</div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-slate-200 inline-block" /> Aucun cours</div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-[#0471a6] inline-block" /> Semaine sélectionnée</div>
      </div>

      {/* Grille mois */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {monthGroups.map(({ label, weeks }) => {
          const monthTotal = weeks.reduce((acc, m) => {
            const info = weekMap.get(toUTCDateStr(m));
            return acc + (info?.draft ?? 0);
          }, 0);
          return (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                {monthTotal > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{monthTotal} cours</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weeks.map((monday) => {
                  const weekStr = toUTCDateStr(monday);
                  const info = weekMap.get(weekStr);
                  const isCurrent = weekStr === currentStr;
                  const isToday   = weekStr === todayStr;

                  let bgColor = '#f1f5f9';
                  let textColor = '#94a3b8';
                  if (info?.draft && info.conflict) { bgColor = '#10b981'; textColor = '#fff'; }
                  else if (info?.draft) { bgColor = '#10b981'; textColor = '#fff'; }
                  else if (info?.conflict) { bgColor = '#f87171'; textColor = '#fff'; }

                  return (
                    <button
                      key={weekStr}
                      onClick={() => onWeekClick(monday)}
                      title={`Sem. du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}${info ? ` — ${info.draft} cours${info.conflict ? `, ${info.conflict} conflit(s)` : ''}` : ' — Vide'}`}
                      className={[
                        'relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all hover:opacity-80',
                        isCurrent ? 'ring-2 ring-offset-1 ring-[#0471a6]' : '',
                        isToday   ? 'ring-2 ring-offset-1 ring-amber-400' : '',
                      ].join(' ')}
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      {monday.getUTCDate()}
                      {info && (info.draft + info.conflict) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-slate-600 border border-slate-200 shadow-sm">
                          {info.draft + info.conflict}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue mensuelle ────────────────────────────────────────────────────────────

function MonthView({ sessions, initialMonday, onDayClick, showConflicts }: {
  sessions: SessionEvent[];
  initialMonday: Date;
  onDayClick: (monday: Date) => void;
  showConflicts: boolean;
}) {
  const [year,  setYear]  = useState(initialMonday.getUTCFullYear());
  const [month, setMonth] = useState(initialMonday.getUTCMonth());

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }

  const days = useMemo(() => {
    const result: (Date | null)[] = [];
    const first = new Date(Date.UTC(year, month, 1));
    const dow   = first.getUTCDay();
    const pad   = dow === 0 ? 6 : dow - 1;
    for (let i = 0; i < pad; i++) result.push(null);
    const total = new Date(Date.UTC(year, month+1, 0)).getUTCDate();
    for (let d = 1; d <= total; d++) result.push(new Date(Date.UTC(year, month, d)));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const dayMap = useMemo(() => {
    const map = new Map<string, { draft: SessionEvent[]; conflict: SessionEvent[] }>();
    for (const s of sessions) {
      if (!showConflicts && s.status === 'CONFLICT_ERROR') continue;
      const key = s.start_timestamp.slice(0, 10);
      const e = map.get(key) ?? { draft: [], conflict: [] };
      if (s.status === 'CONFLICT_ERROR') e.conflict.push(s);
      else e.draft.push(s);
      map.set(key, e);
    }
    return map;
  }, [sessions, showConflicts]);

  const todayStr = toUTCDateStr(new Date());

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-[#061826]">{MONTHS_FR[month]} {year}</span>
        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendrier */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Jours de semaine */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{d}</div>
          ))}
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {days.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[90px] bg-slate-50/40" />;

            const dayStr   = toUTCDateStr(day);
            const info     = dayMap.get(dayStr);
            const isToday  = dayStr === todayStr;
            const isWE     = day.getUTCDay() === 6 || day.getUTCDay() === 0;
            const hasData  = info && (info.draft.length + info.conflict.length) > 0;

            return (
              <button
                key={dayStr}
                onClick={() => hasData && !isWE && onDayClick(getMonday(day))}
                className={[
                  'min-h-[90px] p-1.5 text-left transition-all',
                  isWE ? 'bg-slate-50/60 cursor-default' : hasData ? 'hover:bg-[#0471a6]/3 cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                <span className={[
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  isToday ? 'bg-[#0471a6] text-white' : isWE ? 'text-slate-300' : 'text-slate-500',
                ].join(' ')}>
                  {day.getUTCDate()}
                </span>

                {info && (
                  <div className="mt-1 space-y-0.5">
                    {info.draft.slice(0, 3).map((s, j) => {
                      const p = PALETTE[hashStr(s.subject_name)];
                      return (
                        <div key={j} className="truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight"
                          style={{ backgroundColor: p.bg, color: p.text }}>
                          {s.subject_name}
                        </div>
                      );
                    })}
                    {info.draft.length > 3 && (
                      <div className="text-[10px] text-slate-400 pl-1">+{info.draft.length - 3} cours</div>
                    )}
                    {info.conflict.length > 0 && (
                      <div className="truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight border border-dashed"
                        style={{ backgroundColor: CONFLICT_STYLE.bg, color: CONFLICT_STYLE.text, borderColor: CONFLICT_STYLE.border }}>
                        ⚠ {info.conflict.length} conflit{info.conflict.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Vue hebdomadaire ─────────────────────────────────────────────────────────

function WeekView({ sessions, currentMonday, showConflicts, showFilters, classColorMap, onSessionClick }: {
  sessions: SessionEvent[];
  currentMonday: Date;
  showConflicts: boolean;
  showFilters: boolean;
  classColorMap: Map<string, number>;
  onSessionClick: (s: SessionEvent) => void;
}) {
  const [filterClass,   setFilterClass]   = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(currentMonday, i)), [currentMonday]);
  const hourMarks = useMemo(() => Array.from({ length: DAY_END_H - DAY_START_H + 1 }, (_, i) => DAY_START_H + i), []);

  const classOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sessions.forEach(s => { if (!seen.has(s.class_id)) seen.set(s.class_id, s.class_nom); });
    return Array.from(seen.entries());
  }, [sessions]);

  const teacherOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sessions.forEach(s => { if (!seen.has(s.teacher_id)) seen.set(s.teacher_id, `${s.teacher_prenom} ${s.teacher_nom}`); });
    return Array.from(seen.entries());
  }, [sessions]);

  const multiClass = classOptions.length > 1;

  const weekSessions = useMemo(() => {
    const start = toUTCDateStr(currentMonday);
    const end   = toUTCDateStr(addDays(currentMonday, 6));
    return sessions.filter(s => {
      const d = s.start_timestamp.slice(0, 10);
      if (d < start || d > end) return false;
      if (!showConflicts && s.status === 'CONFLICT_ERROR') return false;
      if (filterClass !== 'all' && s.class_id !== filterClass) return false;
      if (filterTeacher !== 'all' && s.teacher_id !== filterTeacher) return false;
      return true;
    });
  }, [sessions, currentMonday, showConflicts, filterClass, filterTeacher]);

  const byDay = useMemo(() => {
    const map = new Map<string, SessionEvent[]>();
    weekDays.forEach(d => map.set(toUTCDateStr(d), []));
    weekSessions.forEach(s => { const key = s.start_timestamp.slice(0, 10); map.get(key)?.push(s); });
    return map;
  }, [weekSessions, weekDays]);

  const conflicts = weekSessions.filter(s => s.status === 'CONFLICT_ERROR');

  return (
    <div className="space-y-3">
      {/* Légende classes + filtres */}
      {(multiClass || (showFilters && teacherOptions.length > 1)) && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Chips classes (filtre visuel) */}
          {multiClass && (
            <>
              <button
                onClick={() => setFilterClass('all')}
                className={['rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all', filterClass === 'all' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'].join(' ')}
              >
                Toutes les classes
              </button>
              {classOptions.map(([id, nom]) => {
                const colorIdx = classColorMap.get(id) ?? 0;
                const wc = WEEK_COLORS[colorIdx];
                const p  = PALETTE[colorIdx];
                const isActive = filterClass === id;
                return (
                  <button
                    key={id}
                    onClick={() => setFilterClass(filterClass === id ? 'all' : id)}
                    className={['flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all', isActive ? [wc.bg, wc.border, wc.text].join(' ') : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'].join(' ')}
                  >
                    <span className={['h-2 w-2 rounded-full flex-shrink-0', wc.dot].join(' ')} />
                    {nom}
                  </button>
                );
              })}
            </>
          )}
          {/* Filtre prof */}
          {showFilters && teacherOptions.length > 1 && (
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 ml-auto">
              <option value="all">Tous les profs</option>
              {teacherOptions.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Conflits */}
      {conflicts.length > 0 && showConflicts && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <p className="text-sm font-semibold text-rose-800">{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} cette semaine</p>
          </div>
          <div className="space-y-1">
            {conflicts.map(c => (
              <button key={c.id} onClick={() => onSessionClick(c)}
                className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-100 transition-colors">
                <span className="font-semibold shrink-0">{c.subject_name} ({c.class_nom})</span>
                <span className="text-rose-500 truncate">— {c.conflict_reason?.slice(0, 80)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grille */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>
          <div className="border-r border-slate-100" />
          {weekDays.map(d => {
            const dow = d.getUTCDay();
            const today = new Date();
            const isToday = d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth() && d.getUTCDate() === today.getUTCDate();
            return (
              <div key={toUTCDateStr(d)} className={['py-3 text-center border-r border-slate-100 last:border-r-0', isToday ? 'bg-[#0471a6]/5' : ''].join(' ')}>
                <p className={['text-xs font-semibold uppercase tracking-wide', isToday ? 'text-[#0471a6]' : 'text-slate-400'].join(' ')}>
                  {DAYS_FR[dow - 1]}
                </p>
                <p className={['text-sm font-bold mt-0.5', isToday ? 'text-[#0471a6]' : 'text-[#061826]'].join(' ')}>
                  {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </p>
              </div>
            );
          })}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
          <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>
            <div className="relative border-r border-slate-100" style={{ height: GRID_H }}>
              {hourMarks.map(h => (
                <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2"
                  style={{ top: Math.round((h - DAY_START_H) * 60 * PX_PER_MIN) }}>
                  <span className="text-[10px] text-slate-400 -translate-y-2 leading-none">{h}h</span>
                </div>
              ))}
            </div>
            {weekDays.map(d => {
              const key = toUTCDateStr(d);
              const today = new Date();
              const isToday = d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth() && d.getUTCDate() === today.getUTCDate();
              return (
                <div key={key} className={['relative border-r border-slate-100 last:border-r-0', isToday ? 'bg-[#0471a6]/3' : ''].join(' ')} style={{ height: GRID_H }}>
                  {hourMarks.map(h => <div key={h} className="absolute left-0 right-0 border-t border-slate-100/80" style={{ top: Math.round((h - DAY_START_H) * 60 * PX_PER_MIN) }} />)}
                  {hourMarks.slice(0, -1).map(h => <div key={`${h}-h`} className="absolute left-0 right-0 border-t border-dashed border-slate-100/60" style={{ top: Math.round((h - DAY_START_H) * 60 * PX_PER_MIN + 30 * PX_PER_MIN) }} />)}
                  {(byDay.get(key) ?? []).map(s => <SessionBlock key={s.id} session={s} classColorMap={classColorMap} multiClass={multiClass} onClick={onSessionClick} />)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {weekSessions.filter(s => s.status !== 'CONFLICT_ERROR').length === 0 && !conflicts.length && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BookOpen className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Aucun cours cette semaine</p>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────────

type ViewMode = 'year' | 'month' | 'week';

interface WeekCalendarProps {
  sessions: SessionEvent[];
  showConflicts?: boolean;
  showFilters?: boolean;
}

export function WeekCalendar({ sessions, showConflicts = true, showFilters = false }: WeekCalendarProps) {
  const [viewMode, setViewMode]       = useState<ViewMode>('week');
  const [selectedSession, setSelected] = useState<SessionEvent | null>(null);

  // Mapping stable class_id → index couleur (ordre d'apparition)
  const classColorMap = useMemo(() => buildClassColorMap(sessions), [sessions]);

  // Semaine affichée (partagée entre les vues)
  const [currentMonday, setCurrentMonday] = useState(() => {
    const drafts = sessions.filter(s => s.status !== 'CONFLICT_ERROR');
    if (!drafts.length) return getMonday(new Date());
    const first = drafts.map(s => new Date(s.start_timestamp)).sort((a,b) => a.getTime()-b.getTime())[0];
    return getMonday(first);
  });

  // Stats globales
  const totalDraft    = sessions.filter(s => s.status !== 'CONFLICT_ERROR').length;
  const totalConflict = sessions.filter(s => s.status === 'CONFLICT_ERROR').length;

  const weekSessions = useMemo(() => {
    const start = toUTCDateStr(currentMonday);
    const end   = toUTCDateStr(addDays(currentMonday, 6));
    return sessions.filter(s => {
      const d = s.start_timestamp.slice(0, 10);
      return d >= start && d <= end && (showConflicts || s.status !== 'CONFLICT_ERROR');
    });
  }, [sessions, currentMonday, showConflicts]);

  const weekCoursCount = weekSessions.filter(s => s.status !== 'CONFLICT_ERROR').length;
  const weekLabel = `${currentMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })} – ${addDays(currentMonday, 4).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`;

  function prevWeek() { setCurrentMonday(m => addDays(m, -7)); }
  function nextWeek() { setCurrentMonday(m => addDays(m, 7)); }
  function goToday()  { setCurrentMonday(getMonday(new Date())); }

  const firstSessionMonday = useMemo(() => {
    const drafts = sessions.filter(s => s.status !== 'CONFLICT_ERROR');
    if (!drafts.length) return null;
    const first = drafts.map(s => new Date(s.start_timestamp)).sort((a,b) => a.getTime()-b.getTime())[0];
    return getMonday(first);
  }, [sessions]);

  const nextSessionMonday = useMemo(() => {
    const now = Date.now();
    const upcoming = sessions
      .filter(s => s.status !== 'CONFLICT_ERROR' && new Date(s.start_timestamp).getTime() >= now)
      .map(s => getMonday(new Date(s.start_timestamp)))
      .sort((a,b) => a.getTime()-b.getTime());
    return upcoming[0] ?? null;
  }, [sessions]);

  function handleWeekClick(monday: Date) {
    setCurrentMonday(monday);
    setViewMode('week');
  }

  return (
    <>
      {selectedSession && <SessionTooltip session={selectedSession} onClose={() => setSelected(null)} />}

      <div className="space-y-4">
        {/* Barre supérieure : stats + sélecteur de vue */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Stats globales */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {totalDraft} cours planifiés
            </span>
            {totalConflict > 0 && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                {totalConflict} conflit{totalConflict > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Sélecteur de vue */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 gap-1">
            {([
              { id: 'year',  label: 'Année',  Icon: LayoutGrid },
              { id: 'month', label: 'Mois',   Icon: CalendarDays },
              { id: 'week',  label: 'Semaine', Icon: List },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  viewMode === id ? 'bg-white text-[#0471a6] shadow-sm' : 'text-slate-500 hover:text-[#061826]',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>


        {/* Barre de navigation semaine (visible en vue semaine et mois) */}
        {viewMode === 'week' && (
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToday} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                Aujourd&apos;hui
              </button>
              {(nextSessionMonday ?? firstSessionMonday) && (
                <button onClick={() => handleWeekClick(nextSessionMonday ?? firstSessionMonday!)}
                  className="rounded-xl border border-[#89aae6] bg-[#0471a6]/5 px-3 py-2 text-sm font-semibold text-[#0471a6] hover:bg-[#0471a6]/10 transition-all">
                  {nextSessionMonday ? 'Prochain cours →' : '← Début'}
                </button>
              )}
              <button onClick={nextWeek} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[#061826]">{weekLabel}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {weekCoursCount} cours cette semaine
            </span>
          </div>
        )}

        {/* Contenu selon la vue */}
        {viewMode === 'year' && (
          <AnnualView sessions={sessions} currentMonday={currentMonday} onWeekClick={handleWeekClick} />
        )}
        {viewMode === 'month' && (
          <MonthView
            key={`${currentMonday.getUTCFullYear()}-${currentMonday.getUTCMonth()}`}
            sessions={sessions}
            initialMonday={currentMonday}
            onDayClick={handleWeekClick}
            showConflicts={showConflicts}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            sessions={sessions}
            currentMonday={currentMonday}
            showConflicts={showConflicts}
            showFilters={showFilters}
            classColorMap={classColorMap}
            onSessionClick={setSelected}
          />
        )}
      </div>
    </>
  );
}
