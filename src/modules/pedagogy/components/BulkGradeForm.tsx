'use client';

import { useState } from 'react';
import { Check, Users, FolderKanban } from 'lucide-react';
import { addBulkGrades } from '../actions';

interface Student { id: string; nom: string; prenom: string }
interface Group { id: string; group_name: string; members: { student_id: string }[] }
interface ProjectWeek { id: string; title: string; groups: Group[] }

interface BulkGradeFormProps {
  classId: string;
  students: Student[];
  matieres: string[];
  projectWeeks?: ProjectWeek[];
}

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

type Mode = 'classe' | 'groupe';

export function BulkGradeForm({ classId, students, matieres, projectWeeks = [] }: BulkGradeFormProps) {
  const [matiere, setMatiere] = useState(matieres[0] ?? '');
  const [customMatiere, setCustomMatiere] = useState('');
  const [examen, setExamen] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [mode, setMode] = useState<Mode>('classe');
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const effectiveMatiere = customMatiere.trim() || matiere;

  // Élèves visibles selon le mode
  const selectedWeek = projectWeeks.find((w) => w.id === selectedWeekId);
  const selectedGroup = selectedWeek?.groups.find((g) => g.id === selectedGroupId);
  const memberIds = new Set(selectedGroup?.members.map((m) => m.student_id) ?? []);
  const visibleStudents = mode === 'groupe' && selectedGroup
    ? students.filter((s) => memberIds.has(s.id))
    : students;

  function handleNoteChange(studentId: string, val: string) {
    setNotes((prev) => ({ ...prev, [studentId]: val }));
  }

  function handleSelectAll(val: string) {
    const next: Record<string, string> = {};
    for (const s of visibleStudents) next[s.id] = val;
    setNotes((prev) => ({ ...prev, ...next }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!effectiveMatiere) { setError('Choisissez une matière.'); return; }
    if (!examen.trim()) { setError('Saisissez un intitulé d\'examen.'); return; }

    const coeff = parseFloat(coefficient) || 1;
    const grades = visibleStudents
      .map((s) => ({ studentId: s.id, note: parseFloat(notes[s.id] ?? '') }))
      .filter((g) => !isNaN(g.note) && g.note >= 0 && g.note <= 20);

    if (grades.length === 0) { setError('Saisissez au moins une note valide (0–20).'); return; }

    setLoading(true);
    const result = await addBulkGrades(classId, effectiveMatiere, examen.trim(), coeff, grades);
    setLoading(false);

    if (result.error) { setError(result.error); return; }
    setSuccess(`${result.count} note${(result.count ?? 0) > 1 ? 's' : ''} enregistrée${(result.count ?? 0) > 1 ? 's' : ''} !`);
    setNotes({});
    setExamen('');
    setTimeout(() => setSuccess(''), 4000);
  }

  const noteValue = (id: string) => notes[id] ?? '';
  const noteNum = (id: string) => parseFloat(notes[id] ?? '');
  const noteColor = (id: string) => {
    const n = noteNum(id);
    if (isNaN(n)) return 'text-slate-300';
    if (n >= 14) return 'text-emerald-600';
    if (n >= 10) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Infos du devoir */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Matière</label>
          {matieres.length > 0 ? (
            <select value={matiere} onChange={(e) => setMatiere(e.target.value)} className={inputCls}>
              {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="">Autre…</option>
            </select>
          ) : null}
          {(matiere === '' || matieres.length === 0) && (
            <input
              type="text"
              value={customMatiere}
              onChange={(e) => setCustomMatiere(e.target.value)}
              placeholder="Nom de la matière"
              className={inputCls + (matieres.length > 0 ? ' mt-2' : '')}
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Intitulé de l&apos;examen</label>
          <input
            type="text"
            value={examen}
            onChange={(e) => setExamen(e.target.value)}
            placeholder="Ex : Contrôle ch.3, TP noté…"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Coefficient</label>
          <input
            type="number"
            value={coefficient}
            onChange={(e) => setCoefficient(e.target.value)}
            min="0.5" max="10" step="0.5"
            className={inputCls}
          />
        </div>
      </div>

      {/* Mode : toute la classe ou groupe */}
      <div>
        <p className={labelCls}>Élèves concernés</p>
        <div className="flex gap-2">
          {([
            { v: 'classe', label: 'Toute la classe', icon: Users },
            { v: 'groupe', label: 'Groupe projet', icon: FolderKanban },
          ] as const).map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              className={[
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                mode === v
                  ? 'border-[#0471a6] bg-[#0471a6] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {mode === 'groupe' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Semaine projet</label>
              <select
                value={selectedWeekId}
                onChange={(e) => { setSelectedWeekId(e.target.value); setSelectedGroupId(''); }}
                className={inputCls}
              >
                <option value="">Choisir une semaine…</option>
                {projectWeeks.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
            {selectedWeek && (
              <div>
                <label className={labelCls}>Groupe</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    const g = selectedWeek.groups.find((g) => g.id === e.target.value);
                    if (g) setExamen((prev) => prev || g.group_name);
                  }}
                  className={inputCls}
                >
                  <option value="">Choisir un groupe…</option>
                  {selectedWeek.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name} ({g.members.length} membres)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tableau des notes */}
      {(mode === 'classe' || (mode === 'groupe' && selectedGroup)) && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className={labelCls + ' mb-0'}>{visibleStudents.length} élève{visibleStudents.length > 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              {[0, 5, 10, 12, 14, 16, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSelectAll(String(v))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setNotes({})}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Effacer
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Élève</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-400 w-32">Note /20</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-400 w-20">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[#061826]">
                      {s.prenom} {s.nom}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        min="0" max="20" step="0.5"
                        value={noteValue(s.id)}
                        onChange={(e) => handleNoteChange(s.id, e.target.value)}
                        placeholder="—"
                        className={[
                          'w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all',
                          noteColor(s.id),
                        ].join(' ')}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={noteValue(s.id) === 'absent'}
                        onChange={(e) => handleNoteChange(s.id, e.target.checked ? 'absent' : '')}
                        className="h-4 w-4 rounded accent-slate-400"
                        title="Absent (ne compte pas)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Laisser vide = non noté. Cocher "Absent" = absent justifié (pas de note enregistrée).
          </p>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />{success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <Check className="h-4 w-4" />
        {loading ? 'Enregistrement…' : 'Valider les notes'}
      </button>
    </form>
  );
}
