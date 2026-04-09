'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateGroupLinks } from '../actions';
import { Check, GitBranch, Link2, Paperclip, Presentation, Upload, X } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

export function SubmitLinksForm({ groupId, initialRepo, initialSlides, initialSlidesFileUrl, initialSlidesFileName }: Readonly<{
  groupId: string;
  initialRepo?: string | null;
  initialSlides?: string | null;
  initialSlidesFileUrl?: string | null;
  initialSlidesFileName?: string | null;
}>) {
  const [repo, setRepo] = useState(initialRepo ?? '');
  const [slidesMode, setSlidesMode] = useState<'link' | 'file'>(
    initialSlidesFileUrl ? 'file' : 'link'
  );
  const [slidesUrl, setSlidesUrl] = useState(initialSlides ?? '');
  const [slidesFileUrl, setSlidesFileUrl] = useState(initialSlidesFileUrl ?? '');
  const [slidesFileName, setSlidesFileName] = useState(initialSlidesFileName ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${groupId}/${Date.now()}.${ext}`;
    const { error: err } = await supabase.storage.from('project-deliverables').upload(path, file, { upsert: true });
    if (err) { setUploadError(`Erreur upload : ${err.message}`); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('project-deliverables').getPublicUrl(path);
    setSlidesFileUrl(publicUrl);
    setSlidesFileName(file.name);
    setUploading(false);
  }

  function removeFile() {
    setSlidesFileUrl('');
    setSlidesFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (repo && !repo.startsWith('https://')) { setError("L'URL GitHub doit commencer par https://"); return; }
    if (slidesMode === 'link' && slidesUrl && !slidesUrl.startsWith('https://')) { setError("L'URL Slides doit commencer par https://"); return; }
    setLoading(true);
    setError('');
    const result = await updateGroupLinks(
      groupId,
      repo,
      slidesMode === 'link' ? slidesUrl : '',
      slidesMode === 'file' ? slidesFileUrl : '',
      slidesMode === 'file' ? slidesFileName : '',
    );
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* GitHub */}
      <div>
        <label htmlFor="sl-repo" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <GitBranch className="h-3.5 w-3.5" /> Dépôt GitHub
        </label>
        <input
          id="sl-repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/…"
          className={inputCls}
        />
      </div>

      {/* Slides — toggle lien / fichier */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Presentation className="h-3.5 w-3.5" /> Slides / Présentation
          </p>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setSlidesMode('link')}
              className={[
                'flex items-center gap-1 px-2.5 py-1 transition-colors',
                slidesMode === 'link' ? 'bg-[#0471a6] text-white' : 'bg-white text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              <Link2 className="h-3 w-3" /> Lien
            </button>
            <button
              type="button"
              onClick={() => setSlidesMode('file')}
              className={[
                'flex items-center gap-1 px-2.5 py-1 transition-colors',
                slidesMode === 'file' ? 'bg-[#0471a6] text-white' : 'bg-white text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              <Upload className="h-3 w-3" /> Fichier
            </button>
          </div>
        </div>

        {slidesMode === 'link' ? (
          <input
            value={slidesUrl}
            onChange={(e) => setSlidesUrl(e.target.value)}
            placeholder="https://docs.google.com/…"
            className={inputCls}
          />
        ) : slidesFileName ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Paperclip className="h-4 w-4 shrink-0 text-[#0471a6]" />
            <span className="flex-1 truncate text-sm text-slate-700">{slidesFileName}</span>
            <button
              type="button"
              onClick={removeFile}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-60 transition-all"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Envoi en cours…' : 'Déposer un fichier (PDF, PPTX, ZIP — max 50 Mo)'}
          </button>
        )}
        {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.zip,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || uploading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        {success
          ? <><Check className="h-4 w-4" /> Enregistré !</>
          : loading ? 'Enregistrement…'
          : 'Déposer les livrables'}
      </button>
    </form>
  );
}
