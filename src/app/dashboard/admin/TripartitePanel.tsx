'use client';

import { useActionState, useEffect, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTripartiteChat, deleteTripartiteChat } from '@/modules/admin/users-actions';
import type { AlternantRow, UserRow } from '@/modules/admin/users-actions';
import { MessageSquare, Trash2, CheckCircle, AlertCircle, Users, Pencil, X, GraduationCap } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

interface Props {
  alternants: AlternantRow[];
  admins: UserRow[];
  entreprises: UserRow[];
}

function ConfigForm({
  alternant,
  admins,
  entreprises,
  onSuccess,
  onCancel,
}: {
  alternant: AlternantRow;
  admins: UserRow[];
  entreprises: UserRow[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(createTripartiteChat, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) { router.refresh(); onSuccess?.(); }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state?.success) return null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="student_id" value={alternant.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Référent administratif</label>
          <select
            name="referent_id"
            required
            className={inputCls}
            defaultValue={alternant.referent_id ?? ''}
          >
            <option value="" disabled>— Choisir —</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prenom} {a.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Maître d&apos;apprentissage</label>
          <select
            name="maitre_id"
            required
            className={inputCls}
            defaultValue={alternant.maitre_id ?? ''}
          >
            <option value="" disabled>— Choisir —</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom}{e.extra ? ` (${e.extra})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          {pending ? 'Enregistrement…' : alternant.chat_id ? 'Reconfigurer' : 'Configurer'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

function AlternantCard({
  alt,
  admins,
  entreprises,
}: {
  alt: AlternantRow;
  admins: UserRow[];
  entreprises: UserRow[];
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(!alt.chat_id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  return (
    <div className={[
      'rounded-2xl border bg-white shadow-sm overflow-hidden',
      alt.chat_id ? 'border-emerald-200/60' : 'border-amber-200/60',
    ].join(' ')}>
      {/* En-tête */}
      <div className={[
        'flex items-center justify-between px-5 py-4',
        alt.chat_id ? 'bg-emerald-50/50' : 'bg-amber-50/50',
      ].join(' ')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            alt.chat_id ? 'bg-emerald-100' : 'bg-amber-100',
          ].join(' ')}>
            <MessageSquare className={`h-4 w-4 ${alt.chat_id ? 'text-emerald-600' : 'text-amber-500'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#061826]">{alt.prenom} {alt.nom}</p>
            {alt.chat_id && (alt.referent_nom || alt.maitre_nom) && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Référent : <strong>{alt.referent_nom ?? '—'}</strong>
                <span className="mx-1.5">·</span>
                Maître : <strong>{alt.maitre_nom ?? '—'}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {alt.chat_id ? (
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              Configuré
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3 w-3" />
              À configurer
            </span>
          )}

          {alt.chat_id && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-[#0471a6] hover:border-[#0471a6]/30 transition-colors"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {alt.chat_id && editing && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {alt.chat_id && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    startTransition(async () => { await deleteTripartiteChat(alt.chat_id!); router.refresh(); });
                  }}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-300 hover:text-red-400 hover:border-red-200 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      {editing && (
        <div className="border-t border-slate-100 px-5 py-4">
          <ConfigForm
            alternant={alt}
            admins={admins}
            entreprises={entreprises}
            onSuccess={() => setEditing(false)}
            onCancel={alt.chat_id ? () => setEditing(false) : undefined}
          />
        </div>
      )}
    </div>
  );
}

export function TripartitePanel({ alternants, admins, entreprises }: Props) {
  const [classeFilter, setClasseFilter] = useState('');

  if (alternants.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
        <Users className="mx-auto h-8 w-8 text-slate-200 mb-3" />
        <p className="text-sm font-medium text-slate-500">Aucun élève en alternance</p>
        <p className="text-xs text-slate-400 mt-1">
          Inscrivez des élèves avec le parcours &quot;Alternant&quot; pour configurer leur suivi tripartite.
        </p>
      </div>
    );
  }

  // Classes uniques parmi les alternants
  const classes = [...new Map(
    alternants
      .filter((a) => a.classe_id)
      .map((a) => [a.classe_id, { id: a.classe_id!, nom: a.classe_nom ?? a.classe_id! }])
  ).values()].sort((a, b) => a.nom.localeCompare(b.nom));

  const filtered = classeFilter
    ? alternants.filter((a) => a.classe_id === classeFilter)
    : alternants;

  const configured = filtered.filter((a) => a.chat_id).length;
  const total = filtered.length;

  return (
    <div className="space-y-5">
      {/* Filtre par classe + stats */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setClasseFilter('')}
            className={[
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap',
              !classeFilter
                ? 'bg-[#0471a6] text-white shadow-sm'
                : 'text-slate-500 hover:text-[#061826] hover:bg-slate-50',
            ].join(' ')}
          >
            <Users className="h-3.5 w-3.5" />
            Tous ({alternants.length})
          </button>
          {classes.map((c) => {
            const count = alternants.filter((a) => a.classe_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setClasseFilter(c.id)}
                className={[
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap',
                  classeFilter === c.id
                    ? 'bg-[#0471a6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-[#061826] hover:bg-slate-50',
                ].join(' ')}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                {c.nom} ({count})
              </button>
            );
          })}
          {alternants.some((a) => !a.classe_id) && (
            <button
              onClick={() => setClasseFilter('__none__')}
              className={[
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap',
                classeFilter === '__none__'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              Sans classe ({alternants.filter((a) => !a.classe_id).length})
            </button>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-2 text-center">
            <span className="text-lg font-bold text-emerald-600">{configured}</span>
            <span className="ml-1 text-xs text-slate-500">/ {total} configurés</span>
          </div>
          {total - configured > 0 && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-2 text-center">
              <span className="text-lg font-bold text-amber-600">{total - configured}</span>
              <span className="ml-1 text-xs text-slate-500">en attente</span>
            </div>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered
          .filter((a) => classeFilter === '__none__' ? !a.classe_id : true)
          .map((alt) => (
            <AlternantCard key={alt.id} alt={alt} admins={admins} entreprises={entreprises} />
          ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center">
            <p className="text-sm text-slate-400">Aucun alternant dans cette classe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
