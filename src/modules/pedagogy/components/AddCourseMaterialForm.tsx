'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, Link2, FileText, X, Video, ExternalLink } from 'lucide-react';
import { addCourseMaterial } from '../actions';

interface AddCourseMaterialFormProps {
  classId: string;
  matieres: string[];
}

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400';

export function AddCourseMaterialForm({ classId, matieres }: AddCourseMaterialFormProps) {
  const [state, action, pending] = useActionState(addCourseMaterial, null);
  const [mode, setMode] = useState<'fichier' | 'lien'>('fichier');
  const [linkType, setLinkType] = useState<'video' | 'lien'>('lien');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      setSelectedFile(null);
      setFormKey((k) => k + 1);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  return (
    <form
      key={formKey}
      action={action}
      encType="multipart/form-data"
      className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-5"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Ajouter un support</p>
      <input type="hidden" name="class_id" value={classId} />

      {/* Titre + Matière */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`titre-${formKey}`} className={labelCls}>Titre</label>
          <input
            id={`titre-${formKey}`}
            name="titre"
            placeholder="ex : Introduction aux réseaux"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={`matiere-${formKey}`} className={labelCls}>Matière</label>
          <select id={`matiere-${formKey}`} name="matiere" required className={inputCls}>
            <option value="">Sélectionner…</option>
            {matieres.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Toggle mode */}
      <div>
        <p className={labelCls}>Source</p>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode('fichier')}
            className={[
              'inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
              mode === 'fichier'
                ? 'bg-white text-[#061826] shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            <Upload className="h-3.5 w-3.5" />
            Fichier
          </button>
          <button
            type="button"
            onClick={() => setMode('lien')}
            className={[
              'inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
              mode === 'lien'
                ? 'bg-white text-[#061826] shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            <Link2 className="h-3.5 w-3.5" />
            Lien externe
          </button>
        </div>
      </div>

      {/* Zone fichier */}
      {mode === 'fichier' && (
        <>
          <input type="hidden" name="type" value="pdf" />
          <input
            ref={fileInputRef}
            id="fichier"
            name="fichier"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="sr-only"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#89aae6]/40 bg-[#89aae6]/5 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <FileText className="h-4 w-4 text-rose-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#061826]">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
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
                'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all cursor-pointer',
                dragging
                  ? 'border-[#89aae6] bg-[#89aae6]/5'
                  : 'border-slate-200 bg-slate-50 hover:border-[#89aae6]/60 hover:bg-slate-100/60',
              ].join(' ')}
            >
              <Upload className="h-6 w-6 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                Glissez un fichier ou <span className="text-[#0471a6]">parcourir</span>
              </p>
              <p className="text-xs text-slate-400">PDF, Word, PowerPoint — max 20 Mo</p>
            </button>
          )}
        </>
      )}

      {/* Zone lien */}
      {mode === 'lien' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor={`url-${formKey}`} className={labelCls}>URL</label>
            <input
              id={`url-${formKey}`}
              name="url"
              type="url"
              placeholder="https://…"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor={`linktype-${formKey}`} className={labelCls}>Type</label>
            <select
              id={`linktype-${formKey}`}
              name="type"
              required
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as 'video' | 'lien')}
              className={inputCls}
            >
              <option value="lien">Lien externe</option>
              <option value="video">Vidéo</option>
            </select>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || (mode === 'fichier' && !selectedFile)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <Plus className="h-4 w-4" />
        {pending ? 'Ajout en cours…' : 'Ajouter le support'}
      </button>
    </form>
  );
}
