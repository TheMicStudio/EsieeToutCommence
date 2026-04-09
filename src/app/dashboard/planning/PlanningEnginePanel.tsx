'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Zap, CheckCircle2, XCircle, Loader2, Trash2, Send,
  AlertTriangle, ChevronDown, RefreshCw, PlusCircle, LayoutList,
  ChevronRight, Clock, BookOpen, GraduationCap, Plus,
  Calendar, ExternalLink,
} from 'lucide-react';
import { generatePlanning, publishPlanningRun, deletePlanningRun, retryPlanningConflicts, addClassesToRun } from '@/modules/planning/engine';
import { getSessionsForRun, type ClassWithCalendar, type SessionEvent } from '@/modules/admin/planning-actions';
import { WeekCalendar } from '../emploi-du-temps/WeekCalendar';
import { ManualSessionEditor } from './ManualSessionEditor';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

type PlanningRun = {
  id: string;
  label: string;
  status: 'DRAFT' | 'VALIDATED' | 'ARCHIVED';
  class_ids: string[];
  is_gap_fill: boolean;
  total_sessions: number;
  conflict_count: number;
  created_at: string;
};

// ─── Carte d'un run ────────────────────────────────────────────────────────────

function RunCard({
  run,
  allClasses,
  replacingLabel,
  onPublish,
  onDelete,
  onRetryDone,
  onClassAdded,
  onNewVersion,
}: {
  run: PlanningRun;
  allClasses: ClassWithCalendar[];
  replacingLabel?: string;  // label du run validé que ce draft remplacera
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onRetryDone: (id: string, totalSessions: number, conflictCount: number) => void;
  onClassAdded: (id: string, newClassIds: string[], totalSessions: number, conflictCount: number) => void;
  onNewVersion?: (classIds: string[], fromLabel: string) => void;
}) {
  const [expanded, setExpanded] = useState(run.status === 'DRAFT');
  const [isPublishing, startPublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isRetrying, startRetry] = useTransition();
  const [retryResult, setRetryResult] = useState<{ placed: number; conflicts: number } | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [selectedNewClasses, setSelectedNewClasses] = useState<string[]>([]);
  const [isAddingClass, startAddClass] = useTransition();
  const [addClassResult, setAddClassResult] = useState<{ placed: number; conflicts: number } | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [runSessions, setRunSessions] = useState<SessionEvent[] | null>(null);
  const [isLoadingSessions, startLoadSessions] = useTransition();

  // Classes pas encore dans ce run
  const availableClasses = allClasses.filter((c) => !run.class_ids.includes(c.id));

  const statusColor = {
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    VALIDATED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
  }[run.status];

  const statusLabel = {
    DRAFT: 'Brouillon',
    VALIDATED: 'Publié',
    ARCHIVED: 'Archivé',
  }[run.status];

  function handleToggleSessions() {
    if (!showSessions && runSessions === null) {
      startLoadSessions(async () => {
        const data = await getSessionsForRun(run.id);
        setRunSessions(data);
      });
    }
    setShowSessions((v) => !v);
  }

  function handlePublish() {
    startPublish(async () => {
      await publishPlanningRun(run.id);
      onPublish(run.id);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deletePlanningRun(run.id);
      onDelete(run.id);
    });
  }

  function handleRetry() {
    setRetryResult(null);
    startRetry(async () => {
      const res = await retryPlanningConflicts(run.id);
      setRetryResult({ placed: res.total_placed, conflicts: res.total_conflicts });
      onRetryDone(run.id, res.total_placed, res.total_conflicts);
      if (showSessions) { setRunSessions(null); setShowSessions(false); }
    });
  }

  function handleAddClass() {
    if (selectedNewClasses.length === 0) return;
    setAddClassResult(null);
    startAddClass(async () => {
      const res = await addClassesToRun(run.id, selectedNewClasses);
      setAddClassResult({ placed: res.total_placed, conflicts: res.total_conflicts });
      onClassAdded(run.id, selectedNewClasses, res.total_placed, res.total_conflicts);
      setSelectedNewClasses([]);
      setShowAddClass(false);
      if (showSessions) { setRunSessions(null); setShowSessions(false); }
    });
  }

  return (
    <div className={[
      'rounded-2xl border bg-white overflow-hidden transition-all',
      run.status === 'VALIDATED' ? 'border-emerald-200' : 'border-slate-200',
    ].join(' ')}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]/10">
          <Zap className="h-5 w-5 text-[#0471a6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[#061826] truncate">{run.label}</p>
            {run.is_gap_fill && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Complément
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {new Date(run.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'UTC',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {run.total_sessions} sessions
          </span>
          {run.conflict_count > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
              {run.conflict_count} conflit{run.conflict_count > 1 ? 's' : ''}
            </span>
          )}
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Actions */}
          {run.status === 'DRAFT' && (
            <div className="space-y-3">
              {/* Relancer les conflits */}
              {run.conflict_count > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">
                    {run.conflict_count} conflit{run.conflict_count > 1 ? 's' : ''} — relancez après avoir corrigé la configuration
                  </p>
                  {retryResult && (
                    <p className="text-xs text-slate-600">
                      Résultat : {retryResult.placed} session{retryResult.placed !== 1 ? 's' : ''} placée{retryResult.placed !== 1 ? 's' : ''}
                      {retryResult.conflicts > 0
                        ? `, ${retryResult.conflicts} conflit${retryResult.conflicts > 1 ? 's' : ''} restant${retryResult.conflicts > 1 ? 's' : ''}`
                        : ' · Tous les conflits résolus !'}
                    </p>
                  )}
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying || isDeleting || isPublishing}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-all"
                  >
                    {isRetrying
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Recalcul en cours…</>
                      : <><RefreshCw className="h-4 w-4" /> Relancer les {run.conflict_count} conflit{run.conflict_count > 1 ? 's' : ''}</>}
                  </button>
                </div>
              )}

              {/* Publier / Remplacer */}
              {replacingLabel && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Publier remplacera le planning actif : <span className="font-semibold">{replacingLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isPublishing || isRetrying}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Supprimer
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || isDeleting || isRetrying}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isPublishing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication…</>
                    : replacingLabel
                    ? <><RefreshCw className="h-4 w-4" /> Remplacer le planning actif</>
                    : <><Send className="h-4 w-4" /> Publier ce planning</>}
                </button>
              </div>
            </div>
          )}

          {run.status === 'VALIDATED' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Planning publié — visible par les profs et les élèves.
                </div>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all shrink-0"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Supprimer
                </button>
              </div>
              {onNewVersion && (
                <button
                  onClick={() => onNewVersion(run.class_ids, run.label)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-4 py-2.5 text-sm font-semibold text-[#0471a6] hover:bg-[#0471a6]/10 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  Créer une nouvelle version
                </button>
              )}
            </div>
          )}

          {run.status === 'ARCHIVED' && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">Planning archivé.</p>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all shrink-0"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Supprimer
              </button>
            </div>
          )}

          {/* Raccourcis de configuration rapide */}
          {run.conflict_count > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
                {run.conflict_count} conflit{run.conflict_count > 1 ? 's' : ''} — accès rapide à la configuration
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/dashboard/planning?tab=calendrier"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Calendrier
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
                <a
                  href="/dashboard/planning?tab=dispos"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Disponibilités profs
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
                <a
                  href="/dashboard/planning?tab=matieres"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Matières & horaires
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
                <a
                  href="/dashboard/planning?tab=fermetures"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Fermetures
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              </div>
            </div>
          )}

          {/* Ajouter une classe */}
          {(run.status === 'DRAFT' || run.status === 'VALIDATED') && availableClasses.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              {!showAddClass ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddClass(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-4 py-2 text-sm font-semibold text-[#0471a6] hover:bg-[#0471a6]/10 transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Ajouter une classe à ce planning
                  </button>
                  {addClassResult && (
                    <p className="text-xs text-slate-500">
                      {addClassResult.placed} session{addClassResult.placed !== 1 ? 's' : ''} ajoutée{addClassResult.placed !== 1 ? 's' : ''}
                      {addClassResult.conflicts > 0 ? ` · ${addClassResult.conflicts} conflit${addClassResult.conflicts > 1 ? 's' : ''}` : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#061826]">Ajouter une classe</p>
                    <button onClick={() => { setShowAddClass(false); setSelectedNewClasses([]); }}
                      className="text-slate-400 hover:text-slate-600">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map((c) => {
                      const selected = selectedNewClasses.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedNewClasses((prev) =>
                            selected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )}
                          className={[
                            'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                            selected
                              ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                          ].join(' ')}
                        >
                          <GraduationCap className="h-4 w-4" />
                          {c.nom}
                        </button>
                      );
                    })}
                  </div>
                  {run.status === 'VALIDATED' && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Ce planning est publié — les sessions de la nouvelle classe seront immédiatement visibles.
                    </p>
                  )}
                  <button
                    onClick={handleAddClass}
                    disabled={isAddingClass || selectedNewClasses.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
                  >
                    {isAddingClass
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours…</>
                      : <><Zap className="h-4 w-4" /> Générer pour {selectedNewClasses.length} classe{selectedNewClasses.length > 1 ? 's' : ''}</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sessions : calendrier ou éditeur manuel */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleToggleSessions}
                disabled={isLoadingSessions}
                className="flex items-center gap-2 text-sm font-semibold text-[#0471a6] hover:text-[#0471a6]/80 disabled:opacity-50 transition-colors"
              >
                {isLoadingSessions
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : showSessions
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
                }
                {isLoadingSessions
                  ? 'Chargement…'
                  : showSessions
                  ? 'Masquer les sessions'
                  : `Voir les ${run.total_sessions} sessions`
                }
              </button>

              {showSessions && runSessions && (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                    editMode
                      ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  {editMode ? 'Vue calendrier' : 'Modifier manuellement'}
                </button>
              )}
            </div>

            {showSessions && runSessions && (
              <div className="mt-2">
                {editMode ? (
                  <ManualSessionEditor
                    runId={run.id}
                    initialSessions={runSessions}
                    classes={allClasses.filter((c) => run.class_ids.includes(c.id))}
                  />
                ) : (
                  <WeekCalendar
                    sessions={runSessions}
                    showConflicts={run.conflict_count > 0}
                    showFilters={true}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire génération ─────────────────────────────────────────────────────

function GenerateForm({
  classes,
  onGenerated,
  preset,
  onPresetConsumed,
}: {
  classes: ClassWithCalendar[];
  onGenerated: (run: PlanningRun) => void;
  preset?: { classIds: string[]; fromLabel: string } | null;
  onPresetConsumed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(classes.map((c) => c.id));
  const [mode, setMode] = useState<'full' | 'gap'>('full');

  // Ouvrir automatiquement avec les classes pré-sélectionnées quand un preset arrive
  useEffect(() => {
    if (preset) {
      setSelectedClasses(preset.classIds);
      setMode('full');
      setOpen(true);
    }
  }, [preset]);

  function toggleClass(id: string) {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleGenerate() {
    if (selectedClasses.length === 0) { setError('Sélectionnez au moins une classe.'); return; }
    setError(null);
    const label = `${mode === 'gap' ? 'Complément' : 'Planning'} — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    startGenerate(async () => {
      try {
        const result = await generatePlanning(selectedClasses, label, mode === 'gap');
        // Construire un run fake pour l'affichage immédiat
        const fakeRun: PlanningRun = {
          id: result.run_id,
          label,
          status: 'DRAFT',
          class_ids: selectedClasses,
          is_gap_fill: mode === 'gap',
          total_sessions: result.total_placed,
          conflict_count: result.total_conflicts,
          created_at: new Date().toISOString(),
        };
        onGenerated(fakeRun);
        handleClose();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    onPresetConsumed?.();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all shadow-sm"
      >
        <Zap className="h-4 w-4" />
        Générer un planning
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#061826]">
          {preset ? 'Nouvelle version du planning' : 'Nouvelle génération'}
        </p>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      {preset && (
        <div className="flex items-center gap-2 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-3 py-2.5 text-sm text-[#0471a6]">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>Remplacera <span className="font-semibold">{preset.fromLabel}</span> lors de la publication</span>
        </div>
      )}

      {/* Mode */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: 'full', label: 'Planning complet', desc: 'Génère toutes les sessions de zéro', icon: Zap },
          { id: 'gap', label: 'Compléter les trous', desc: 'Remplit uniquement les heures manquantes', icon: Plus },
        ] as const).map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={[
                'flex flex-col gap-2 rounded-xl border p-3 text-left transition-all',
                mode === m.id
                  ? 'border-[#0471a6] bg-[#0471a6]/5 ring-1 ring-[#0471a6]/30'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300',
              ].join(' ')}
            >
              <Icon className={['h-5 w-5', mode === m.id ? 'text-[#0471a6]' : 'text-slate-400'].join(' ')} />
              <div>
                <p className={['text-sm font-semibold', mode === m.id ? 'text-[#0471a6]' : 'text-[#061826]'].join(' ')}>
                  {m.label}
                </p>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sélection des classes */}
      <div>
        <p className={labelCls}>Classes concernées</p>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {classes.map((cls) => (
            <label key={cls.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={selectedClasses.includes(cls.id)}
                onChange={() => toggleClass(cls.id)}
                className="h-4 w-4 rounded border-slate-300 accent-[#0471a6]"
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-[#061826] truncate">{cls.nom}</span>
                <span className={[
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  cls.calendar_mode === 'FULL_TIME' ? 'bg-emerald-100 text-emerald-700' :
                  cls.calendar_mode === 'FIXED_PATTERN' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700',
                ].join(' ')}>
                  {cls.calendar_mode === 'FULL_TIME' ? 'TP' : cls.calendar_mode === 'FIXED_PATTERN' ? 'Pattern' : 'Manuel'}
                </span>
              </div>
              {/* Raccourcis config */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                <a
                  href="/dashboard/planning?tab=calendrier"
                  title="Configurer le calendrier"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar className="h-3.5 w-3.5" />
                </a>
                <a
                  href="/dashboard/planning?tab=dispos"
                  title="Configurer les disponibilités"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Clock className="h-3.5 w-3.5" />
                </a>
                <a
                  href="/dashboard/planning?tab=matieres"
                  title="Configurer les matières"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </a>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Annuler
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          {isGenerating
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours…</>
            : <><Zap className="h-4 w-4" /> Lancer la génération</>}
        </button>
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function PlanningEnginePanel({
  initialRuns,
  classes,
}: {
  initialRuns: PlanningRun[];
  classes: ClassWithCalendar[];
}) {
  const [runs, setRuns] = useState(initialRuns);

  function handleGenerated(run: PlanningRun) {
    setRuns((prev) => [run, ...prev]);
  }

  function handlePublish(id: string) {
    setRuns((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'VALIDATED' } : r.status === 'VALIDATED' ? { ...r, status: 'ARCHIVED' } : r)
    );
  }

  function handleDelete(id: string) {
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }

  function handleRetryDone(id: string, totalSessions: number, conflictCount: number) {
    setRuns((prev) =>
      prev.map((r) => r.id === id ? { ...r, total_sessions: totalSessions, conflict_count: conflictCount } : r)
    );
  }

  function handleClassAdded(id: string, newClassIds: string[], totalSessions: number, conflictCount: number) {
    setRuns((prev) =>
      prev.map((r) => r.id === id
        ? { ...r, class_ids: [...r.class_ids, ...newClassIds], total_sessions: totalSessions, conflict_count: conflictCount }
        : r
      )
    );
  }

  const [newVersionPreset, setNewVersionPreset] = useState<{ classIds: string[]; fromLabel: string } | null>(null);

  function handleNewVersion(classIds: string[], fromLabel: string) {
    setNewVersionPreset({ classIds, fromLabel });
    // Scroll vers le formulaire
    setTimeout(() => {
      document.getElementById('generate-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  const draftCount    = runs.filter((r) => r.status === 'DRAFT').length;
  const validatedRun  = runs.find((r) => r.status === 'VALIDATED');

  return (
    <div className="space-y-4">
      {/* Statut actuel */}
      {validatedRun && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Planning actif : {validatedRun.label}</p>
            <p className="text-xs text-emerald-700">
              {validatedRun.total_sessions} sessions publiées
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-semibold text-[#061826]">
          {runs.length} run{runs.length > 1 ? 's' : ''}
          {draftCount > 0 && ` · ${draftCount} brouillon${draftCount > 1 ? 's' : ''}`}
        </p>
        <div id="generate-form-anchor">
          <GenerateForm
            classes={classes}
            onGenerated={handleGenerated}
            preset={newVersionPreset}
            onPresetConsumed={() => setNewVersionPreset(null)}
          />
        </div>
      </div>

      {/* Liste des runs */}
      {runs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Zap className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Aucun planning généré</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Configurez d'abord les disponibilités, les besoins matières et le calendrier, puis lancez la génération.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <a href="/dashboard/planning?tab=calendrier" className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
              <Calendar className="h-3.5 w-3.5" /> Calendrier
            </a>
            <a href="/dashboard/planning?tab=dispos" className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
              <Clock className="h-3.5 w-3.5" /> Disponibilités
            </a>
            <a href="/dashboard/planning?tab=matieres" className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
              <BookOpen className="h-3.5 w-3.5" /> Matières
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              allClasses={classes}
              replacingLabel={run.status === 'DRAFT' && validatedRun ? validatedRun.label : undefined}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onRetryDone={handleRetryDone}
              onClassAdded={handleClassAdded}
              onNewVersion={run.status === 'VALIDATED' ? handleNewVersion : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
