'use client';

import { useActionState, useEffect, useRef, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWeekCourseMaterial, deleteWeekCourseMaterial } from '../actions';
import type { WeekCourseMaterial } from '../types';
import { ExternalLink, Eye, FileText, Video, Trash2, Plus, Upload, Link2, X } from 'lucide-react';
import { DocumentPreviewModal, detectPreviewMode } from '@/components/DocumentPreviewModal';

const TYPE_ICONS = { video: Video, pdf: FileText, lien: ExternalLink };
const TYPE_LABEL = { video: 'Vidéo', pdf: 'Fichier', lien: 'Lien' };
const TYPE_STYLE = {
  video: 'bg-purple-100 text-purple-600',
  pdf: 'bg-rose-100 text-rose-600',
  lien: 'bg-blue-100 text-blue-600',
};

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all';

interface WeekCourseMaterialsPanelProps {
  weekId: string;
  materials: WeekCourseMaterial[];
  isProf: boolean;
}

interface PreviewTarget { url: string; title: string; type: string; }

export function WeekCourseMaterialsPanel({ weekId, materials, isProf }: WeekCourseMaterialsPanelProps) {
  const [state, action, pending] = useActionState(addWeekCourseMaterial, null);
  const [isDeleting, startDelete] = useTransition();
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [mode, setMode] = useState<'fichier' | 'lien'>('fichier');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setSelectedFile(null);
      setFormKey((k) => k + 1);
      router.refresh();
    }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !fileInputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInputRef.current.files = dt.files;
    setSelectedFile(file);
  }

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
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400">Aucun support pour cette semaine.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/60 bg-white">
          {materials.map((m) => {
            const Icon = TYPE_ICONS[m.type];
            const canPreview = detectPreviewMode(m.url, null, m.type) !== 'none';
            return (
              <div key={m.id} className="group flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50 transition-colors">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <button
                  type="button"
                  onClick={() => canPreview && setPreview({ url: m.url, title: m.titre, type: m.type })}
                  className={['flex-1 truncate text-left text-sm font-medium text-[#061826] transition-colors', canPreview ? 'hover:text-[#0471a6] cursor-pointer' : 'cursor-default'].join(' ')}
                >
                  {m.titre}
                </button>
                {canPreview && (
                  <button
                    type="button"
                    onClick={() => setPreview({ url: m.url, title: m.titre, type: m.type })}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 hover:bg-slate-100 hover:text-[#0471a6] group-hover:opacity-100 transition-all"
                    title="Aperçu"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className={['shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', TYPE_STYLE[m.type]].join(' ')}>
                  {TYPE_LABEL[m.type]}
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

      {/* Formulaire (prof uniquement) */}
      {isProf && (
        <form
          key={formKey}
          action={action}
          encType="multipart/form-data"
          className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 space-y-3"
        >
          <input type="hidden" name="week_id" value={weekId} />

          {/* Titre */}
          <input name="titre" placeholder="Titre du support" required className={inputCls} />

          {/* Toggle mode */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setMode('fichier')}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                mode === 'fichier' ? 'bg-[#0471a6] text-white' : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <Upload className="h-3 w-3" />
              Fichier
            </button>
            <button
              type="button"
              onClick={() => setMode('lien')}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                mode === 'lien' ? 'bg-[#0471a6] text-white' : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <Link2 className="h-3 w-3" />
              Lien
            </button>
          </div>

          {/* Zone fichier */}
          {mode === 'fichier' && (
            <>
              <input type="hidden" name="type" value="pdf" />
              <input
                ref={fileInputRef}
                name="fichier"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#89aae6]/40 bg-white px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-rose-400" />
                  <span className="flex-1 truncate text-sm text-[#061826]">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="shrink-0 text-slate-300 hover:text-slate-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={[
                    'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition-all cursor-pointer',
                    dragging ? 'border-[#89aae6] bg-[#89aae6]/5' : 'border-slate-200 bg-white hover:border-[#89aae6]/50',
                  ].join(' ')}
                >
                  <Upload className="h-5 w-5 text-slate-300" />
                  <p className="text-xs text-slate-500">
                    Glissez ou <span className="text-[#0471a6] font-medium">parcourir</span>
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, Word, PowerPoint — max 20 Mo</p>
                </button>
              )}
            </>
          )}

          {/* Zone lien */}
          {mode === 'lien' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input name="url" type="url" placeholder="https://…" required className={inputCls} />
              </div>
              <select name="type" required className={inputCls}>
                <option value="lien">Lien</option>
                <option value="video">Vidéo</option>
              </select>
            </div>
          )}

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending || (mode === 'fichier' && !selectedFile)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            {pending ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      )}

      {preview && (
        <DocumentPreviewModal
          url={preview.url}
          title={preview.title}
          fileType={preview.type}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
