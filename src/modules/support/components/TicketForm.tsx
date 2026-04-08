'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createTicket, searchFaqArticles } from '../actions';
import { TICKET_CATEGORIES } from '@/lib/constants';
import { Paperclip, X, Lightbulb } from 'lucide-react';
import type { FaqArticle } from '../types';

const inputCls = 'flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface TicketFormProps {
  isDelegue?: boolean;
}

export function TicketForm({ isDelegue = false }: TicketFormProps) {
  const [state, action, pending] = useActionState(createTicket, null);
  const [sujet, setSujet] = useState('');
  const [suggestions, setSuggestions] = useState<FaqArticle[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const debouncedSujet = useDebounce(sujet, 300);
  const router = useRouter();

  useEffect(() => {
    if (debouncedSujet.length < 3) { setSuggestions([]); return; }
    searchFaqArticles(debouncedSujet).then(setSuggestions);
  }, [debouncedSujet]);

  useEffect(() => {
    if (state?.success) router.push('/dashboard/support');
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('support-files').upload(path, file);
    if (error) {
      setUploadError(`Erreur : ${error.message}`);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('support-files').getPublicUrl(path);
    setAttachmentUrl(publicUrl);
    setAttachmentName(file.name);
    setUploading(false);
  }

  function removeAttachment() {
    setAttachmentUrl('');
    setAttachmentName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Formulaire principal */}
      <form action={action} className="space-y-5 lg:col-span-2">
        {/* Catégorie pills */}
        <div>
          <p className={labelCls}>Catégorie *</p>
          <div className="flex flex-wrap gap-2">
            {TICKET_CATEGORIES.map((cat) => (
              <label key={cat.value} className="cursor-pointer">
                <input type="radio" name="categorie" value={cat.value} required className="peer sr-only" />
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-all peer-checked:border-[#0471a6] peer-checked:bg-[#0471a6] peer-checked:text-white hover:bg-slate-100 block">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sujet */}
        <div>
          <label htmlFor="sujet" className={labelCls}>Sujet *</label>
          <input
            id="sujet" name="sujet" required
            value={sujet} onChange={(e) => setSujet(e.target.value)}
            placeholder="Décrivez votre problème en quelques mots…"
            className={inputCls}
            maxLength={150}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>Description *</label>
          <textarea
            id="description" name="description" rows={5} required
            placeholder="Expliquez votre problème en détail…"
            className={inputCls + ' resize-none leading-relaxed'}
          />
        </div>

        {/* Pièce jointe */}
        <div>
          <p className={labelCls}>Pièce jointe (optionnelle)</p>
          {attachmentName ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Paperclip className="h-4 w-4 shrink-0 text-[#0471a6]" />
              <span className="flex-1 truncate text-sm text-slate-700">{attachmentName}</span>
              <button
                type="button"
                onClick={removeAttachment}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
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
              <Paperclip className="h-4 w-4" />
              {uploading ? 'Envoi en cours…' : 'Joindre un fichier (PDF, image, Word — max 20 Mo)'}
            </button>
          )}
          {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {/* Champs cachés transmis au server action */}
          <input type="hidden" name="attachment_url" value={attachmentUrl} />
          <input type="hidden" name="attachment_name" value={attachmentName} />
        </div>

        {/* Délégué */}
        {isDelegue && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
            <input type="checkbox" name="au_nom_de_classe" className="mt-0.5 accent-[#0471a6]" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Ouvrir au nom de ma classe</p>
              <p className="text-xs text-slate-500">Ce ticket représente un problème collectif (délégué).</p>
            </div>
          </label>
        )}

        {state?.error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          {pending ? 'Envoi…' : 'Soumettre le ticket'}
        </button>
      </form>

      {/* Suggestions FAQ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Réponses suggérées</p>
        </div>
        {suggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
            Saisissez votre sujet pour voir les suggestions de la FAQ.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((article) => (
              <div key={article.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-[#061826]">{article.question}</p>
                <p className="mt-1.5 line-clamp-3 text-xs text-slate-500 leading-relaxed">{article.reponse}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
