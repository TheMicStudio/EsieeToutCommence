'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Trash2, Pencil, Plus,
  Loader2, Check, X, AlertTriangle, GraduationCap,
} from 'lucide-react';
import type { SessionEvent, ClassWithCalendar } from '@/modules/admin/planning-actions';
import {
  deleteManualSession,
  moveManualSession,
  addManualSession,
} from '@/modules/admin/planning-actions';

// ─── Utilitaires date UTC ─────────────────────────────────────────────────────

function toUTCDateStr(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function getMonday(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}
function addDays(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function formatDateFR(iso: string) {
  const d = new Date(iso);
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
// Convertit "YYYY-MM-DD" + "HH:MM" → ISO UTC string
function toISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00+00:00`;
}
// Extrait "YYYY-MM-DD" d'un ISO
function isoToDate(iso: string): string { return iso.slice(0, 10); }
// Extrait "HH:MM" d'un ISO UTC
function isoToTime(iso: string): string { return formatTime(iso); }

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const SESSION_COLORS = [
  '#dbeafe', '#f3e8ff', '#d1fae5', '#fef3c7',
  '#ffe4e6', '#e0e7ff', '#ccfbf1', '#ffedd5',
];
const SESSION_COLORS_TEXT = [
  '#1e40af', '#6b21a8', '#065f46', '#92400e',
  '#9f1239', '#3730a3', '#134e4a', '#7c2d12',
];

function subjectColorIndex(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h) % SESSION_COLORS.length;
}

// ─── Ligne session ────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onDelete,
  onMove,
}: Readonly<{
  session: SessionEvent;
  onDelete: (id: string) => void;
  onMove: (id: string, newStart: string, newEnd: string) => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(isoToDate(session.start_timestamp));
  const [startTime, setStartTime] = useState(isoToTime(session.start_timestamp));
  const [endTime, setEndTime] = useState(isoToTime(session.end_timestamp));
  const [isMoving, startMove] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ci = subjectColorIndex(session.subject_name);
  const bg = SESSION_COLORS[ci];
  const text = SESSION_COLORS_TEXT[ci];

  function handleSaveMove() {
    if (endTime <= startTime) { setError('L\'heure de fin doit être après le début.'); return; }
    setError(null);
    startMove(async () => {
      const res = await moveManualSession(session.id, toISO(date, startTime), toISO(date, endTime));
      if (res.error) { setError(res.error); return; }
      onMove(session.id, toISO(date, startTime), toISO(date, endTime));
      setEditing(false);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteManualSession(session.id);
      if (res.error) return;
      onDelete(session.id);
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="rounded-lg px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: bg, color: text }}
          >
            {session.subject_name}
          </div>
          <span className="text-xs text-slate-500">{session.class_nom}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="edit-date" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Date</label>
            <input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
            />
          </div>
          <div>
            <label htmlFor="edit-startTime" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Début</label>
            <input
              id="edit-startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
            />
          </div>
          <div>
            <label htmlFor="edit-endTime" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fin</label>
            <input
              id="edit-endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
            />
          </div>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveMove}
            disabled={isMoving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0471a6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50"
          >
            {isMoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Enregistrer
          </button>
          <button
            onClick={() => { setEditing(false); setError(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3 w-3" /> Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 hover:border-slate-200 transition-colors">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: text }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#061826] truncate">{session.subject_name}</span>
          <span className="text-xs text-slate-400">{session.class_nom}</span>
          {session.status === 'CONFLICT_ERROR' && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">Conflit</span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {formatTime(session.start_timestamp)} – {formatTime(session.end_timestamp)}
          {session.teacher_nom && ` · ${session.teacher_prenom} ${session.teacher_nom}`}
          {session.room_nom && ` · ${session.room_nom}`}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          title="Déplacer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#0471a6] transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          title="Supprimer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Formulaire ajout session ─────────────────────────────────────────────────

function AddSessionForm({
  runId,
  classes,
  existingSessions,
  onAdded,
  onClose,
}: Readonly<{
  runId: string;
  classes: ClassWithCalendar[];
  existingSessions: SessionEvent[];
  onAdded: (session: SessionEvent) => void;
  onClose: () => void;
}>) {
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [subjectName, setSubjectName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAdding, startAdd] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sujets et profs disponibles pour la classe sélectionnée (depuis les sessions existantes)
  const classOptions = useMemo(() => {
    const seen = new Map<string, { subject_name: string; teacher_id: string; teacher_nom: string; teacher_prenom: string }>();
    for (const s of existingSessions) {
      if (s.class_id !== classId) continue;
      const key = `${s.subject_name}__${s.teacher_id}`;
      if (!seen.has(key)) seen.set(key, s);
    }
    return [...seen.values()];
  }, [existingSessions, classId]);

  const selectedOption = classOptions.find(
    (o) => o.subject_name === subjectName && o.teacher_id === teacherId
  );

  function handleOptionSelect(opt: typeof classOptions[0]) {
    setSubjectName(opt.subject_name);
    setTeacherId(opt.teacher_id);
  }

  function handleAdd() {
    if (!classId || !subjectName || !teacherId || !date || !startTime || !endTime) {
      setError('Tous les champs sont requis.');
      return;
    }
    if (endTime <= startTime) { setError('L\'heure de fin doit être après le début.'); return; }
    setError(null);
    startAdd(async () => {
      const res = await addManualSession(runId, {
        class_id: classId,
        teacher_id: teacherId,
        subject_name: subjectName,
        start_timestamp: toISO(date, startTime),
        end_timestamp: toISO(date, endTime),
      });
      if (res.error) { setError(res.error); return; }
      if (res.session) onAdded(res.session);
      onClose();
    });
  }

  return (
    <div className="rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#061826]">Ajouter une session</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Classe */}
      <div>
        <label htmlFor="add-classId" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Classe</label>
        <select
          id="add-classId"
          value={classId}
          onChange={(e) => { setClassId(e.target.value); setSubjectName(''); setTeacherId(''); }}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* Matière + Prof (depuis les sessions existantes) */}
      <div>
        <label htmlFor="add-subjectName" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
          Matière & Professeur
        </label>
        {classOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {classOptions.map((opt) => (
              <button
                key={`${opt.subject_name}-${opt.teacher_id}`}
                onClick={() => handleOptionSelect(opt)}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                  selectedOption === opt
                    ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                {opt.subject_name}
                <span className="font-normal text-slate-400">· {opt.teacher_prenom} {opt.teacher_nom}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-2">Aucune session existante pour cette classe — saisissez manuellement.</p>
        )}
        {/* Saisie manuelle si pas de correspondance ou nouvelle matière */}
        <div className="grid grid-cols-2 gap-2">
          <input
            id="add-subjectName"
            type="text"
            placeholder="Nom de la matière"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
          />
          <input
            type="text"
            placeholder="ID du professeur"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
          />
        </div>
      </div>

      {/* Date + Horaires */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="add-date" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Date</label>
          <input
            id="add-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
          />
        </div>
        <div>
          <label htmlFor="add-startTime" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Début</label>
          <input
            id="add-startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
          />
        </div>
        <div>
          <label htmlFor="add-endTime" className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fin</label>
          <input
            id="add-endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Ajouter
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ManualSessionEditor({
  runId,
  initialSessions,
  classes,
}: Readonly<{
  runId: string;
  initialSessions: SessionEvent[];
  classes: ClassWithCalendar[];
}>) {
  const [sessions, setSessions] = useState(initialSessions);
  const [currentMonday, setCurrentMonday] = useState(() => {
    // Aller à la 1ère semaine qui a des sessions, sinon semaine courante
    const first = initialSessions
      .filter((s) => s.status !== 'CONFLICT_ERROR')
      .sort((a, b) => a.start_timestamp.localeCompare(b.start_timestamp))[0];
    return first ? getMonday(new Date(first.start_timestamp)) : getMonday(new Date());
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterClassId, setFilterClassId] = useState<string | null>(null);

  const weekEnd = addDays(currentMonday, 6);

  // Sessions de la semaine courante
  const weekSessions = useMemo(() => {
    const mondayStr = toUTCDateStr(currentMonday);
    const sundayStr = toUTCDateStr(weekEnd);
    return sessions
      .filter((s) => {
        const d = s.start_timestamp.slice(0, 10);
        return d >= mondayStr && d <= sundayStr && (filterClassId === null || s.class_id === filterClassId);
      })
      .sort((a, b) => a.start_timestamp.localeCompare(b.start_timestamp));
  }, [sessions, currentMonday, filterClassId]);

  // Grouper par jour
  const byDay = useMemo(() => {
    const map = new Map<string, SessionEvent[]>();
    for (let i = 0; i < 7; i++) {
      const day = addDays(currentMonday, i);
      const dayStr = toUTCDateStr(day);
      map.set(dayStr, weekSessions.filter((s) => s.start_timestamp.slice(0, 10) === dayStr));
    }
    return map;
  }, [weekSessions, currentMonday]);

  // Classes présentes dans les sessions
  const presentClasses = useMemo(() => {
    const ids = new Set(sessions.map((s) => s.class_id));
    return classes.filter((c) => ids.has(c.id));
  }, [sessions, classes]);

  function handleDelete(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }

  function handleMove(sessionId: string, newStart: string, newEnd: string) {
    setSessions((prev) => prev.map((s) =>
      s.id === sessionId ? { ...s, start_timestamp: newStart, end_timestamp: newEnd } : s
    ));
  }

  function handleAdded(session: SessionEvent) {
    setSessions((prev) => [...prev, session]);
  }

  // Semaines qui ont des sessions (en tenant compte du filtre classe)
  const weeksWithSessions = useMemo(() => {
    const mondaySet = new Map<string, { monday: Date; count: number }>();
    for (const s of sessions) {
      if (s.status === 'CONFLICT_ERROR') continue;
      if (filterClassId && s.class_id !== filterClassId) continue;
      const m = getMonday(new Date(s.start_timestamp));
      const key = toUTCDateStr(m);
      if (!mondaySet.has(key)) mondaySet.set(key, { monday: m, count: 0 });
      mondaySet.get(key)!.count++;
    }
    return [...mondaySet.values()].sort((a, b) =>
      a.monday.getTime() - b.monday.getTime()
    );
  }, [sessions, filterClassId]);

  const currentMondayStr = toUTCDateStr(currentMonday);
  const totalWeek = weekSessions.filter((s) => s.status !== 'CONFLICT_ERROR').length;

  // Index courant dans la liste des semaines avec sessions
  const currentWeekIdx = weeksWithSessions.findIndex((w) => toUTCDateStr(w.monday) === currentMondayStr);
  const hasPrev = weeksWithSessions.length > 0 && (
    currentWeekIdx > 0 || (currentWeekIdx === -1 && weeksWithSessions.some((w) => w.monday < currentMonday))
  );
  const hasNext = weeksWithSessions.length > 0 && (
    currentWeekIdx < weeksWithSessions.length - 1 || (currentWeekIdx === -1 && weeksWithSessions.some((w) => w.monday > currentMonday))
  );

  function goToPrevWeek() {
    if (currentWeekIdx > 0) setCurrentMonday(weeksWithSessions[currentWeekIdx - 1].monday);
    else if (currentWeekIdx === -1) {
      const before = weeksWithSessions.filter((w) => w.monday < currentMonday);
      if (before.length) setCurrentMonday(before[before.length - 1].monday);
    }
  }
  function goToNextWeek() {
    if (currentWeekIdx !== -1 && currentWeekIdx < weeksWithSessions.length - 1) {
      setCurrentMonday(weeksWithSessions[currentWeekIdx + 1].monday);
    } else if (currentWeekIdx === -1) {
      const after = weeksWithSessions.filter((w) => w.monday > currentMonday);
      if (after.length) setCurrentMonday(after[0].monday);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtres classe */}
      {presentClasses.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterClassId(null)}
            className={[
              'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
              filterClassId === null
                ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
            ].join(' ')}
          >
            Toutes les classes
          </button>
          {presentClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterClassId(c.id === filterClassId ? null : c.id)}
              className={[
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                filterClassId === c.id
                  ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              ].join(' ')}
            >
              <GraduationCap className="h-3 w-3" />
              {c.nom}
            </button>
          ))}
        </div>
      )}

      {/* Navigation semaine */}
      <div className="flex items-center gap-2">
        {/* Flèche précédente (semaine avec sessions) */}
        <button
          onClick={goToPrevWeek}
          disabled={!hasPrev}
          title="Semaine précédente avec sessions"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>

        {/* Sélecteur direct des semaines avec sessions */}
        <div className="flex-1">
          {weeksWithSessions.length > 0 ? (
            <select
              value={currentMondayStr}
              onChange={(e) => {
                const found = weeksWithSessions.find((w) => toUTCDateStr(w.monday) === e.target.value);
                if (found) setCurrentMonday(found.monday);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#061826] focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40"
            >
              {/* Option courante si elle n'a pas de sessions */}
              {currentWeekIdx === -1 && (
                <option value={currentMondayStr} disabled>
                  Semaine du {currentMonday.getUTCDate()} {MONTHS_FR[currentMonday.getUTCMonth()]} — 0 session
                </option>
              )}
              {weeksWithSessions.map(({ monday, count }) => {
                const str = toUTCDateStr(monday);
                return (
                  <option key={str} value={str}>
                    Sem. {monday.getUTCDate()} {MONTHS_FR[monday.getUTCMonth()]} {monday.getUTCFullYear()} — {count} session{count > 1 ? 's' : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            <p className="text-center text-sm text-slate-400">Aucune session</p>
          )}
        </div>

        {/* Flèche suivante (semaine avec sessions) */}
        <button
          onClick={goToNextWeek}
          disabled={!hasNext}
          title="Semaine suivante avec sessions"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Compteur de la semaine */}
      {totalWeek > 0 && (
        <p className="text-xs text-slate-400">
          {totalWeek} session{totalWeek !== 1 ? 's' : ''} cette semaine
          {filterClassId ? ` · ${presentClasses.find((c) => c.id === filterClassId)?.nom}` : ''}
        </p>
      )}

      {/* Grille par jour */}
      <div className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(currentMonday, i);
          const dayStr = toUTCDateStr(day);
          const daySessions = byDay.get(dayStr) ?? [];
          const isWeekend = i >= 5;

          if (isWeekend && daySessions.length === 0) return null;

          return (
            <div key={dayStr}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={[
                  'text-xs font-semibold uppercase tracking-wide',
                  isWeekend ? 'text-slate-300' : 'text-slate-500',
                ].join(' ')}>
                  {DAYS_FR[i]} {day.getUTCDate()}
                </span>
                {daySessions.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {daySessions.length}
                  </span>
                )}
              </div>
              {daySessions.length > 0 ? (
                <div className="space-y-1.5 pl-2">
                  {daySessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      onDelete={handleDelete}
                      onMove={handleMove}
                    />
                  ))}
                </div>
              ) : !isWeekend ? (
                <p className="pl-2 text-xs text-slate-300 italic">Aucune session</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Formulaire ajout */}
      {showAddForm ? (
        <AddSessionForm
          runId={runId}
          classes={classes.filter((c) => sessions.some((s) => s.class_id === c.id) || classes.length <= 3)}
          existingSessions={sessions}
          onAdded={handleAdded}
          onClose={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-[#0471a6] hover:text-[#0471a6] transition-all w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          Ajouter une session manuellement
        </button>
      )}
    </div>
  );
}
