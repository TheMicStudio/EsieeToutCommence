'use client';

import { useActionState, useTransition } from 'react';
import { addWeekCourseMaterial, deleteWeekCourseMaterial } from '../actions';
import type { WeekCourseMaterial } from '../types';
import { ExternalLink, FileText, Video, Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TYPE_ICONS = {
  video: Video,
  pdf: FileText,
  lien: ExternalLink,
};

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

interface WeekCourseMaterialsPanelProps {
  weekId: string;
  materials: WeekCourseMaterial[];
  isProf: boolean;
}

export function WeekCourseMaterialsPanel({ weekId, materials, isProf }: WeekCourseMaterialsPanelProps) {
  const [state, action] = useActionState(addWeekCourseMaterial, null);
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();

  function handleDelete(id: string) {
    startDelete(async () => {
      await deleteWeekCourseMaterial(id, weekId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Liste */}
      {materials.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400">Aucun support pour cette semaine.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => {
            const Icon = TYPE_ICONS[m.type];
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-3">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm font-medium text-[#061826] hover:text-[#0471a6] transition-colors truncate"
                >
                  {m.titre}
                </a>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {m.type}
                </span>
                {isProf && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={isDeleting}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form ajout (prof uniquement) */}
      {isProf && (
        <form action={action} className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ajouter un support</p>
          <input type="hidden" name="week_id" value={weekId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <input name="titre" placeholder="Titre du support" required className={inputCls} />
            </div>
            <div>
              <select name="type" required className={inputCls}>
                <option value="">Type…</option>
                <option value="video">Vidéo</option>
                <option value="pdf">PDF</option>
                <option value="lien">Lien</option>
              </select>
            </div>
            <div>
              <input name="url" type="url" placeholder="https://…" required className={inputCls} />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
          {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
