'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Pin, Send, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createNewsPost } from '../actions';
import { CATEGORY_LABELS, type PostCategory } from '../types';

const inputCls = 'flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

interface CreatePostFormProps {
  isAdmin: boolean;
  onSuccess?: () => void;
}

export function CreatePostForm({ isAdmin, onSuccess }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('annonce');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    } else {
      setBannerPreview(null);
    }
  }

  function removeBanner() {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError('Titre et contenu requis'); return; }
    setLoading(true);
    setError('');

    let bannerUrl: string | null = null;

    if (bannerFile) {
      const supabase = createClient();
      const ext = bannerFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('news-banners')
        .upload(path, bannerFile, { upsert: false });
      if (uploadError) {
        setError(`Erreur upload image : ${uploadError.message}`);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('news-banners').getPublicUrl(path);
      bannerUrl = publicUrl;
    }

    const result = await createNewsPost(title.trim(), content.trim(), category, pinned, bannerUrl);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (onSuccess) { onSuccess(); router.refresh(); }
    else router.push('/dashboard/actualites');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Catégorie */}
      <div>
        <p className={labelCls}>Catégorie</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as PostCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                'rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                category === cat
                  ? 'border-[#0471a6] bg-[#0471a6] text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Bannière */}
      <div>
        <p className={labelCls}>Bannière (optionnelle)</p>
        {bannerPreview ? (
          <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerPreview}
              alt="Aperçu bannière"
              className="h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={removeBanner}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all"
          >
            <ImagePlus className="h-5 w-5" />
            Ajouter une image
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleBannerChange}
          className="hidden"
        />
      </div>

      {/* Titre */}
      <div>
        <label htmlFor="post-title" className={labelCls}>Titre</label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Journée portes ouvertes 2026"
          className={inputCls}
          maxLength={120}
        />
      </div>

      {/* Contenu */}
      <div>
        <label htmlFor="post-content" className={labelCls}>Contenu</label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Décrivez l'actualité, l'annonce ou l'événement…"
          rows={6}
          className={inputCls + ' resize-none leading-relaxed'}
        />
      </div>

      {/* Épingler (admin seulement) */}
      {isAdmin && (
        <div className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            onClick={() => setPinned(!pinned)}
            aria-pressed={pinned}
            aria-label="Épingler en haut du fil"
            className={[
              'flex h-5 w-9 items-center rounded-full transition-colors',
              pinned ? 'bg-[#0471a6]' : 'bg-slate-200',
            ].join(' ')}
          >
            <span className={[
              'h-4 w-4 rounded-full bg-white shadow transition-transform',
              pinned ? 'translate-x-4' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
          <span className="flex items-center gap-1.5 text-sm text-slate-600">
            <Pin className="h-3.5 w-3.5 text-[#0471a6]" />
            Épingler en haut du fil
          </span>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Publication…' : 'Publier'}
        </button>
        <button
          type="button"
          onClick={() => onSuccess ? onSuccess() : router.push('/dashboard/actualites')}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
