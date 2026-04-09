'use client';

import { useActionState, useEffect, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWeekCourseMaterial, deleteWeekCourseMaterial } from '../actions';
import type { WeekCourseMaterial } from '../types';
import {
  ExternalLink, FileText, Video, Trash2, Plus, Download, File, Eye,
} from 'lucide-react';
import { DocumentPreviewModal, detectPreviewMode } from '@/components/DocumentPreviewModal';
import { timeAgo } from '@/lib/utils/time';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

type IconColor = 'rose' | 'blue' | 'emerald' | 'amber' | 'slate' | 'cyan';

const COLOR_CLS: Record<IconColor, string> = {
  rose:    'bg-rose-50 text-rose-500',
  blue:    'bg-blue-50 text-blue-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-500',
  slate:   'bg-slate-100 text-slate-600',
  cyan:    'bg-cyan-50 text-cyan-600',
};

function getColor(type: string): IconColor {
  if (type === 'pdf')   return 'rose';
  if (type === 'video') return 'cyan';
  if (type === 'lien')  return 'emerald';
  return 'slate';
}

function getIcon(type: string) {
  if (type === 'pdf')   return <FileText size={14} />;
  if (type === 'video') return <Video size={14} />;
  if (type === 'lien')  return <ExternalLink size={14} />;
  return <File size={14} />;
}

interface WeekCourseMaterialsPanelProps {
  weekId: string;
  materials: WeekCourseMaterial[];
  isProf: boolean;
}

export function WeekCourseMaterialsPanel({ weekId, materials, isProf }: Readonly<WeekCourseMaterialsPanelProps>) {
  const [state, action, pending] = useActionState(addWeekCourseMaterial, null);
  const [isDeleting, startDelete] = useTransition();
  const [previewMaterial, setPreviewMaterial] = useState<WeekCourseMaterial | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete(id: string) {
    startDelete(async () => {
      await deleteWeekCourseMaterial(id, weekId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {previewMaterial && (
        <DocumentPreviewModal
          url={previewMaterial.url}
          title={previewMaterial.titre}
          fileType={previewMaterial.type}
          onClose={() => setPreviewMaterial(null)}
        />
      )}

      {/* ── Header row ──────────────────────────────────────────────── */}
      {materials.length > 0 && (
        <p className="text-[12px] font-semibold text-slate-400">
          {materials.length} support{materials.length > 1 ? 's' : ''}
        </p>
      )}

      {/* ── List ────────────────────────────────────────────────────── */}
      {materials.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400">Aucun support pour cette semaine.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {materials.map((m) => {
            const color = getColor(m.type);
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors group"
              >
                {/* Icon */}
                <div className={[
                  'h-8 w-8 shrink-0 grid place-items-center rounded-lg',
                  COLOR_CLS[color],
                ].join(' ')}>
                  {getIcon(m.type)}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">
                    {m.titre}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-medium text-slate-400">{m.type}</span>
                    {m.file_size && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[11px] font-medium text-slate-400">{m.file_size}</span>
                      </>
                    )}
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-medium text-slate-400">{timeAgo(m.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {detectPreviewMode(m.url, null, m.type) !== 'none' && (
                    <button
                      type="button"
                      onClick={() => setPreviewMaterial(m)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Eye size={11} /> Aperçu
                    </button>
                  )}
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {m.type === 'lien' ? <ExternalLink size={11} /> : <Download size={11} />}
                    {m.type === 'lien' ? 'Ouvrir' : 'Télécharger'}
                  </a>
                  {isProf && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      disabled={isDeleting}
                      className="h-7 w-7 grid place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form ajout (prof) ───────────────────────────────────────── */}
      {isProf && (
        <form action={action} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ajouter un support</p>
          <input type="hidden" name="week_id" value={weekId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="titre" placeholder="Titre du support" required className={inputCls} />
            <select name="type" required className={inputCls}>
              <option value="">Type…</option>
              <option value="video">Vidéo</option>
              <option value="pdf">PDF</option>
              <option value="lien">Lien</option>
            </select>
            <input name="url" type="url" placeholder="https://…" required className={inputCls} />
          </div>
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            {pending ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      )}

    </div>
  );
}
