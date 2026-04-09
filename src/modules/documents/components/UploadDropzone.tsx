'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadFile } from '../actions';

interface UploadDropzoneProps {
  folderId: string;
  onSuccess?: () => void;
}

export function UploadDropzone({ folderId, onSuccess }: Readonly<UploadDropzoneProps>) {
  const [state, action, pending] = useActionState(uploadFile, null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      setSelectedFile(null);
      setSizeError('');
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileSelect(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setSizeError(`Ce fichier dépasse 50 Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo).`);
      setSelectedFile(null);
    } else {
      setSizeError('');
      setSelectedFile(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="folder_id" value={folderId} />

      {/* Zone drag & drop */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? inputRef.current?.click() : undefined}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragging
            ? 'border-[#0471a6] bg-[#0471a6]/5'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <Upload className="h-8 w-8 text-slate-300" />
        <div>
          <p className="text-sm font-medium text-slate-600">
            Glissez un fichier ici ou{' '}
            <span className="text-[#0471a6]">parcourez</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, XLSX, PPTX, images… jusqu'à 50 Mo</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          name="file"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Fichier sélectionné */}
      {selectedFile && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="truncate text-sm text-slate-700">{selectedFile.name}</span>
          <button
            type="button"
            onClick={() => { setSelectedFile(null); formRef.current?.reset(); }}
            className="ml-2 shrink-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {sizeError && <p className="text-xs text-red-600">{sizeError}</p>}

      {/* Champs optionnels */}
      {selectedFile && (
        <div className="space-y-2">
          <input
            type="text"
            name="description"
            placeholder="Description (optionnel)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
          />
          <input
            type="text"
            name="tags"
            placeholder="Tags séparés par virgule : RH, 2026, Contrat…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
          />
        </div>
      )}

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">Fichier déposé avec succès.</p>}

      {selectedFile && !sizeError && (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-[#0471a6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#035a85] disabled:opacity-60"
        >
          {pending ? 'Envoi en cours…' : 'Déposer le fichier'}
        </button>
      )}
    </form>
  );
}
