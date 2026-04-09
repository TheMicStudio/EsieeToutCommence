'use client';

import { useState, useTransition } from 'react';
import {
  Zap, CheckCircle2, XCircle, Loader2, Trash2, Send,
  Bot, Sparkles, AlertTriangle, TrendingUp, ChevronDown,
  ChevronRight, Clock, BookOpen, GraduationCap, Plus,
} from 'lucide-react';
import { generatePlanning, publishPlanningRun, deletePlanningRun } from '@/modules/planning/engine';
import { reviewPlanningWithAI, type AIProviderId, type AIProviderInfo, type AIReviewResult } from '@/modules/planning/ai-reviewer';
import type { ClassWithCalendar } from '@/modules/admin/planning-actions';

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
  ai_provider: string | null;
  ai_review: AIReviewResult | null;
  total_sessions: number;
  conflict_count: number;
  created_at: string;
};

// ─── Score qualité IA ─────────────────────────────────────────────────────────

function QualityBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
              : score >= 60 ? 'text-amber-700 bg-amber-100 border-amber-200'
                            : 'text-rose-700 bg-rose-100 border-rose-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      <TrendingUp className="h-3 w-3" />
      {score}/100
    </span>
  );
}

// ─── Résultat AI Review ────────────────────────────────────────────────────────

function AIReviewCard({ review }: { review: AIReviewResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[#89aae6]/40 bg-gradient-to-br from-[#89aae6]/5 to-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#89aae6]/20">
            <Bot className="h-4 w-4 text-[#3685b5]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#061826]">Analyse IA</p>
            <p className="text-xs text-slate-400">{review.provider} · {review.model}</p>
          </div>
        </div>
        <QualityBadge score={review.quality_score} />
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{review.summary}</p>

      {review.issues.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {review.issues.length} problème{review.issues.length > 1 ? 's' : ''} détecté{review.issues.length > 1 ? 's' : ''}
          </p>
          {review.issues.slice(0, expanded ? undefined : 3).map((issue, i) => (
            <div key={i} className={[
              'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs',
              issue.severity === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            ].join(' ')}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{issue.entity}</span>
                {' — '}{issue.detail}
              </div>
            </div>
          ))}
          {review.issues.length > 3 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-[#0471a6] hover:underline"
            >
              {expanded ? <><ChevronDown className="h-3 w-3" /> Réduire</> : <><ChevronRight className="h-3 w-3" /> Voir {review.issues.length - 3} de plus</>}
            </button>
          )}
        </div>
      )}

      {review.suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {review.suggestions.length} suggestion{review.suggestions.length > 1 ? 's' : ''}
          </p>
          {review.suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
              {s.description}
            </div>
          ))}
        </div>
      )}

      {review.conflict_resolutions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Résolutions de conflits suggérées
          </p>
          {review.conflict_resolutions.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <span className="font-semibold">{r.class_nom} / {r.subject_name}</span>
                {' — '}{r.resolution}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Carte d'un run ────────────────────────────────────────────────────────────

function RunCard({
  run,
  providers,
  onPublish,
  onDelete,
  onReviewDone,
}: {
  run: PlanningRun;
  providers: AIProviderInfo[];
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onReviewDone: (id: string, review: AIReviewResult) => void;
}) {
  const [expanded, setExpanded] = useState(run.status === 'DRAFT' && !run.ai_review);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(
    providers.find((p) => p.available)?.id ?? 'claude'
  );
  const [isReviewing, startReview] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  function handleReview() {
    setReviewError(null);
    startReview(async () => {
      const res = await reviewPlanningWithAI(run.id, selectedProvider);
      if (res.error) { setReviewError(res.error); return; }
      if (res.result) onReviewDone(run.id, res.result);
    });
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
          {run.ai_review && <QualityBadge score={(run.ai_review as AIReviewResult).quality_score} />}
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Résultat IA existant */}
          {run.ai_review && <AIReviewCard review={run.ai_review as AIReviewResult} />}

          {/* Actions */}
          {run.status === 'DRAFT' && (
            <div className="space-y-3">
              {/* AI Review */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <p className="text-sm font-semibold text-[#061826]">Analyse IA du planning</p>
                <div className="flex flex-wrap gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      disabled={!p.available}
                      className={[
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                        selectedProvider === p.id && p.available
                          ? 'border-[#0471a6] bg-[#0471a6]/10 text-[#0471a6]'
                          : p.available
                          ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed',
                      ].join(' ')}
                    >
                      <Bot className="h-4 w-4" />
                      {p.name}
                      {!p.available && (
                        <span className="text-[10px] font-normal">(clé manquante)</span>
                      )}
                    </button>
                  ))}
                </div>
                {reviewError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {reviewError}
                  </div>
                )}
                <button
                  onClick={handleReview}
                  disabled={isReviewing || !providers.find((p) => p.id === selectedProvider)?.available}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#89aae6]/30 px-4 py-2.5 text-sm font-semibold text-[#3685b5] hover:bg-[#89aae6]/50 disabled:opacity-50 transition-all"
                >
                  {isReviewing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
                    : <><Bot className="h-4 w-4" /> Analyser avec {providers.find((p) => p.id === selectedProvider)?.name ?? 'IA'}</>}
                </button>
              </div>

              {/* Publier */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isPublishing}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Supprimer
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isPublishing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication…</>
                    : <><Send className="h-4 w-4" /> Publier ce planning</>}
                </button>
              </div>
            </div>
          )}

          {run.status === 'VALIDATED' && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Planning publié — visible par les profs et les élèves.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulaire génération ─────────────────────────────────────────────────────

function GenerateForm({
  classes,
  onGenerated,
}: {
  classes: ClassWithCalendar[];
  onGenerated: (run: PlanningRun) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(classes.map((c) => c.id));
  const [mode, setMode] = useState<'full' | 'gap'>('full');

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
          ai_provider: null,
          ai_review: null,
          total_sessions: result.total_placed,
          conflict_count: result.total_conflicts,
          created_at: new Date().toISOString(),
        };
        onGenerated(fakeRun);
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
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
        <p className="font-semibold text-[#061826]">Nouvelle génération</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <XCircle className="h-5 w-5" />
        </button>
      </div>

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
        <label className={labelCls}>Classes concernées</label>
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
          onClick={() => setOpen(false)}
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
  providers,
}: {
  initialRuns: PlanningRun[];
  classes: ClassWithCalendar[];
  providers: AIProviderInfo[];
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

  function handleReviewDone(id: string, review: AIReviewResult) {
    setRuns((prev) =>
      prev.map((r) => r.id === id ? { ...r, ai_review: review, ai_provider: review.provider } : r)
    );
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
              {validatedRun.ai_review && ` · Score IA : ${validatedRun.ai_review.quality_score}/100`}
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
        <GenerateForm classes={classes} onGenerated={handleGenerated} />
      </div>

      {/* Liste des runs */}
      {runs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Zap className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Aucun planning généré</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Configurez d'abord les disponibilités, les besoins matières et le calendrier, puis lancez la génération.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              providers={providers}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onReviewDone={handleReviewDone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
