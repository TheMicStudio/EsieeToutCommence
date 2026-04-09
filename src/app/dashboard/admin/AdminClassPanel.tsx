'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createClass,
  deleteClass,
  assignStudentToClass,
  removeStudentFromClass,
} from '@/modules/admin/actions';
import type { ClassRow, StudentRow } from '@/modules/admin/actions';
import {
  GraduationCap, Plus, Trash2, UserPlus, X,
  ChevronDown, ChevronRight, AlertCircle, Search, Users,
} from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

const PARCOURS_LABELS: Record<string, string> = {
  temps_plein: 'Temps plein',
  alternant: 'Alternant',
};

// ─── Formulaire création classe ───────────────────────────────────────────────

function CreateClassForm() {
  const [state, action, pending] = useActionState(createClass, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
      >
        <Plus className="h-4 w-4" />
        Nouvelle classe
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-[#061826]">Créer une classe</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={action} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="nom" className={labelCls}>Nom</label>
          <input
            id="nom"
            name="nom"
            placeholder="Ex: BTS SIO SLAM"
            required
            className={inputCls}
          />
        </div>
        <div className="w-36">
          <label htmlFor="annee" className={labelCls}>Promotion</label>
          <input
            id="annee"
            name="annee"
            type="number"
            placeholder="2025"
            required
            min={2020}
            max={2035}
            className={inputCls}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            <Plus className="h-4 w-4" />
            {pending ? 'Création…' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        </div>
        {state?.error && (
          <p className="w-full rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}
      </form>
    </div>
  );
}

// ─── Section élèves d'une classe ──────────────────────────────────────────────

function StudentsSection({
  cls,
  students,
}: Readonly<{
  cls: ClassRow;
  students: StudentRow[];
}>) {
  const [, startTransition] = useTransition();
  const [assignState, assignAction] = useActionState(assignStudentToClass, null);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (assignState?.success) router.refresh();
  }, [assignState?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  const classStudents = students.filter((s) => s.class_id === cls.id);
  const unassigned = students.filter((s) => !s.class_id || s.class_id !== cls.id);

  const filteredUnassigned = unassigned.filter((s) => {
    const q = search.toLowerCase();
    return !q || `${s.prenom} ${s.nom}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <p className={labelCls + ' !mb-0'}>Élèves ({classStudents.length})</p>
      </div>

      {classStudents.length > 0 && (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/60 bg-white overflow-hidden">
          {classStudents.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-[#061826]">{s.prenom} {s.nom}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {PARCOURS_LABELS[s.type_parcours] ?? s.type_parcours}
                </span>
                <button
                  onClick={() => startTransition(async () => { await removeStudentFromClass(s.id); router.refresh(); })}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                  title="Retirer de la classe"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <form action={assignAction} className="space-y-2">
          <input type="hidden" name="class_id" value={cls.id} />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un élève à affecter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:bg-white transition-all"
            />
          </div>

          {filteredUnassigned.length > 0 ? (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200/60 bg-white divide-y divide-slate-100">
              {filteredUnassigned.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-[#0471a6]/5 transition-colors group"
                >
                  <input type="radio" name="student_id" value={s.id} className="accent-[#0471a6]" required />
                  <span className="flex-1 text-sm text-slate-700 group-hover:text-[#061826]">
                    {s.prenom} {s.nom}
                  </span>
                  {s.class_nom && (
                    <span className="text-[11px] text-slate-400">actuellement: {s.class_nom}</span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            search ? <p className="text-xs text-slate-400 px-1">Aucun élève trouvé pour &quot;{search}&quot;</p> : null
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-3 py-1.5 text-xs font-semibold text-[#0471a6] hover:bg-[#0471a6]/10 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Affecter l&apos;élève sélectionné
          </button>
          {assignState?.error && (
            <p className="text-xs text-red-500">{assignState.error}</p>
          )}
        </form>
      )}

      {unassigned.length === 0 && classStudents.length === 0 && (
        <p className="text-xs text-slate-400">Aucun élève disponible.</p>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface Props {
  classes: ClassRow[];
  students: StudentRow[];
}

export function AdminClassPanel({ classes, students }: Readonly<Props>) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const router = useRouter();

  function handleDeleteClass(classId: string) {
    if (confirmDelete !== classId) {
      setConfirmDelete(classId);
      return;
    }
    setConfirmDelete(null);
    startTransition(async () => { await deleteClass(classId); router.refresh(); });
  }

  const unclassedStudents = students.filter((s) => !s.class_id);

  const filteredClasses = classes.filter((c) => {
    const q = classSearch.toLowerCase();
    return !q || c.nom.toLowerCase().includes(q) || String(c.annee).includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Stats + Créer */}
      <div className="flex flex-wrap items-start gap-4">
        {/* Stats rapides */}
        <div className="flex gap-3">
          {[
            { value: classes.length, label: 'Classes', color: 'text-[#0471a6]', bg: 'bg-[#0471a6]/8' },
            { value: students.length, label: 'Élèves', color: 'text-purple-600', bg: 'bg-purple-50' },
            { value: classes.reduce((s, c) => s + c.teacher_count, 0), label: 'Enseignants', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className={['rounded-2xl border border-slate-200/60 px-4 py-3 text-center min-w-[80px]', s.bg].join(' ')}>
              <p className={['text-2xl font-bold', s.color].join(' ')}>{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto">
          <CreateClassForm />
        </div>
      </div>

      {/* Alerte élèves sans classe */}
      {unclassedStudents.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">
              {unclassedStudents.length} élève{unclassedStudents.length > 1 ? 's' : ''} sans classe
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {unclassedStudents.map((s) => `${s.prenom} ${s.nom}`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Recherche classes */}
      {classes.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer les classes…"
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all"
          />
        </div>
      )}

      {/* Liste des classes */}
      {classes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">Aucune classe créée.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden"
            >
              {/* En-tête classe */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpanded(expanded === cls.id ? null : cls.id)}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]/10">
                    <GraduationCap className="h-4.5 w-4.5 text-[#0471a6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#061826] truncate">{cls.nom}</p>
                    <p className="text-xs text-slate-400">
                      Promo {cls.annee}
                      <span className="mx-1.5">·</span>
                      <span className="text-blue-500">{cls.member_count} élève{cls.member_count === 1 ? '' : 's'}</span>
                      <span className="mx-1.5">·</span>
                      <span className="text-purple-500">{cls.teacher_count} enseignant{cls.teacher_count === 1 ? '' : 's'}</span>
                    </p>
                  </div>
                  {expanded === cls.id
                    ? <ChevronDown className="ml-auto h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="ml-auto h-4 w-4 text-slate-400 shrink-0" />
                  }
                </button>

                {/* Suppression */}
                <div className="flex items-center gap-2 shrink-0">
                  {confirmDelete === cls.id ? (
                    <>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-slate-400 hover:underline"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Détail classe */}
              {expanded === cls.id && (
                <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 space-y-4">
                  <StudentsSection cls={cls} students={students} />
                  <div className="rounded-xl border border-[#89aae6]/30 bg-[#89aae6]/5 px-4 py-3 text-xs text-[#3685b5]">
                    Les affectations enseignants se configurent dans{' '}
                    <strong>Planning → Matières</strong>.
                    Le nombre d&apos;enseignants affiché ci-dessus se met à jour automatiquement.
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredClasses.length === 0 && classSearch && (
            <p className="text-center text-sm text-slate-400 py-6">
              Aucune classe trouvée pour &quot;{classSearch}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
