'use client';

import { useState, useTransition } from 'react';
import {
  BookOpen, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, AlertCircle, GraduationCap,
} from 'lucide-react';
import {
  createSubjectRequirement,
  deleteSubjectRequirement,
  type ClassWithCalendar,
  type SubjectRequirement,
  type TeacherForPlanning,
} from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

// ─── Formulaire ajout matière ─────────────────────────────────────────────────

function AddRequirementForm({
  classId,
  teachers,
  onAdded,
}: {
  classId: string;
  teachers: TeacherForPlanning[];
  onAdded: (req: SubjectRequirement) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startAdd] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id ?? '');
  const [sessionType, setSessionType] = useState<'CLASSIC' | 'INTENSIVE_BLOCK' | 'WEEKLY_DAY'>('CLASSIC');

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const matieres = selectedTeacher?.matieres_enseignees ?? [];

  const SESSION_TYPE_LABELS = {
    CLASSIC:         { label: 'Standard', desc: 'Créneaux de N heures répartis sur l\'année' },
    INTENSIVE_BLOCK: { label: 'Bloc intensif', desc: '1-N semaines complètes bloquées' },
    WEEKLY_DAY:      { label: '1 jour/semaine', desc: 'Même jour chaque semaine pendant N semaines' },
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('class_id', classId);
    fd.set('session_type', sessionType);
    startAdd(async () => {
      const res = await createSubjectRequirement(fd);
      if (res.error) { setError(res.error); return; }
      const teacher = teachers.find((t) => t.id === (fd.get('teacher_id') as string));
      const newReq: SubjectRequirement = {
        id: crypto.randomUUID(),
        class_id: classId,
        teacher_id: fd.get('teacher_id') as string,
        subject_name: fd.get('subject_name') as string,
        total_hours_required: parseFloat(fd.get('total_hours_required') as string),
        session_duration_h: parseFloat(fd.get('session_duration_h') as string) || 8,
        teacher_nom: teacher?.nom,
        teacher_prenom: teacher?.prenom,
      };
      onAdded(newReq);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:border-[#89aae6] hover:text-[#3685b5] transition-all"
      >
        <Plus className="h-4 w-4" /> Ajouter une matière
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      {/* Type de session */}
      <div>
        <label className={labelCls}>Type de session</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SESSION_TYPE_LABELS) as (keyof typeof SESSION_TYPE_LABELS)[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSessionType(type)}
              className={[
                'flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all text-xs',
                sessionType === type
                  ? 'border-[#0471a6] bg-[#0471a6]/5 text-[#0471a6]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              <span className="font-semibold">{SESSION_TYPE_LABELS[type].label}</span>
              <span className={sessionType === type ? 'text-[#0471a6]/70' : 'text-slate-400'}>
                {SESSION_TYPE_LABELS[type].desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Professeur</label>
          <select
            name="teacher_id"
            required
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className={inputCls}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.prenom} {t.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Matière</label>
          {matieres.length > 0 ? (
            <select name="subject_name" required className={inputCls}>
              {matieres.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input name="subject_name" placeholder="Ex: Projet intégré" required className={inputCls} />
          )}
        </div>
      </div>

      {/* Champs spécifiques au type */}
      {sessionType === 'CLASSIC' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Volume horaire total (h)</label>
            <input name="total_hours_required" type="number" min={1} max={500} step={0.5} placeholder="Ex: 40" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Durée d&apos;une séance</label>
            <select name="session_duration_h" className={inputCls} defaultValue="2">
              <option value="1">1h</option>
              <option value="1.5">1h30</option>
              <option value="2">2h</option>
              <option value="3">3h</option>
              <option value="4">4h (demi-journée)</option>
            </select>
          </div>
        </div>
      )}

      {sessionType === 'INTENSIVE_BLOCK' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nombre de semaines bloquées</label>
            <select name="duration_weeks" className={inputCls} defaultValue="1">
              {[1,2,3,4].map((w) => (
                <option key={w} value={w}>{w} semaine{w > 1 ? 's' : ''} complète{w > 1 ? 's' : ''}</option>
              ))}
            </select>
            {/* Champs requis mais non utilisés pour ce type */}
            <input type="hidden" name="total_hours_required" value="40" />
            <input type="hidden" name="session_duration_h" value="8" />
          </div>
          <div>
            <label className={labelCls}>Info</label>
            <div className="flex h-10 items-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs text-blue-700">
              Bloque lundi→vendredi, journée complète
            </div>
          </div>
        </div>
      )}

      {sessionType === 'WEEKLY_DAY' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Jour préféré</label>
            <select name="preferred_day" className={inputCls} defaultValue="1">
              {['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map((d, i) => (
                <option key={d} value={i + 1}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nb de semaines</label>
            <input name="weekly_occurrences" type="number" min={1} max={52} placeholder="Ex: 12" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Durée de la séance</label>
            <select name="session_duration_h" className={inputCls} defaultValue="2">
              <option value="1">1h</option>
              <option value="1.5">1h30</option>
              <option value="2">2h</option>
              <option value="3">3h</option>
              <option value="4">4h</option>
            </select>
            <input type="hidden" name="total_hours_required" value="1" />
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button" onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit" disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Ajout…</>
            : <><Plus className="h-4 w-4" /> Ajouter</>}
        </button>
      </div>
    </form>
  );
}

// ─── Carte d'une classe ───────────────────────────────────────────────────────

function ClassRequirementsCard({
  classe,
  teachers,
  initialRequirements,
}: {
  classe: ClassWithCalendar;
  teachers: TeacherForPlanning[];
  initialRequirements: SubjectRequirement[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteSubjectRequirement(id);
    setRequirements((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  const totalHours = requirements.reduce((sum, r) => sum + r.total_hours_required, 0);
  const totalSessions = requirements.reduce(
    (sum, r) => sum + Math.ceil(r.total_hours_required / r.session_duration_h),
    0
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
        <div className="flex items-center gap-2 shrink-0">
          {requirements.length > 0 ? (
            <>
              <span className="rounded-full bg-[#89aae6]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#3685b5]">
                {requirements.length} matière{requirements.length > 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {totalHours}h · ~{totalSessions} séances
              </span>
            </>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
              Non configuré
            </span>
          )}
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          {requirements.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Matière</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Professeur</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Volume</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Séance</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requirements.map((req) => {
                    const sessions = Math.ceil(req.total_hours_required / req.session_duration_h);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
                              <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="font-medium text-[#061826]">{req.subject_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {req.teacher_prenom} {req.teacher_nom}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#0471a6]">{req.total_hours_required}h</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {req.session_duration_h}h
                          <span className="ml-1 text-xs text-slate-400">
                            (~{sessions} fois)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(req.id)}
                            disabled={deletingId === req.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all"
                          >
                            {deletingId === req.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {requirements.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-100 bg-slate-50/60">
                      <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-slate-500">Total</td>
                      <td className="px-4 py-2 text-xs font-bold text-[#0471a6]">{totalHours}h</td>
                      <td className="px-4 py-2 text-xs text-slate-400">~{totalSessions} séances</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          <AddRequirementForm
            classId={classe.id}
            teachers={teachers}
            onAdded={(req) => setRequirements((prev) => [...prev, req])}
          />
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function SubjectRequirementsPanel({
  classes,
  teachers,
  requirementsByClass,
}: {
  classes: ClassWithCalendar[];
  teachers: TeacherForPlanning[];
  requirementsByClass: Record<string, SubjectRequirement[]>;
}) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <BookOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Aucune classe disponible</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Importez d&apos;abord les étudiants via CSV pour configurer les besoins par classe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#061826]">
        {classes.length} classe{classes.length > 1 ? 's' : ''} — définissez les volumes horaires par matière et professeur
      </p>
      {classes.map((classe) => (
        <ClassRequirementsCard
          key={classe.id}
          classe={classe}
          teachers={teachers}
          initialRequirements={requirementsByClass[classe.id] ?? []}
        />
      ))}
    </div>
  );
}
