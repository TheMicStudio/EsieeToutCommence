'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, Link } from 'lucide-react';
import { addCourseMaterial } from '../actions';

interface AddCourseMaterialFormProps {
  classId: string;
  matieres: string[];
}

export function AddCourseMaterialForm({ classId, matieres }: AddCourseMaterialFormProps) {
  const [state, action, pending] = useActionState(addCourseMaterial, null);
  const [type, setType] = useState('');
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  // Refresh RSC + reset formulaire après succès
  useEffect(() => {
    if (state?.success) {
      router.refresh();
      setType('');
      setFormKey((k) => k + 1);
    }
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectClass = 'flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
  const inputClass = 'flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  return (
    <form key={formKey} action={action} encType="multipart/form-data" className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Ajouter un support
      </p>
      <input type="hidden" name="class_id" value={classId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="titre" className={labelClass}>Titre</label>
          <input id="titre" name="titre" placeholder="Introduction aux réseaux" required className={inputClass} />
        </div>

        <div>
          <label htmlFor="matiere" className={labelClass}>Matière</label>
          <select id="matiere" name="matiere" required className={selectClass}>
            <option value="">Sélectionner…</option>
            {matieres.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>Type</label>
          <select
            id="type"
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            <option value="">Sélectionner…</option>
            <option value="pdf">PDF / Document</option>
            <option value="video">Vidéo (URL)</option>
            <option value="lien">Lien externe</option>
          </select>
        </div>

        {/* Champ URL ou Upload selon le type */}
        <div>
          {type === 'pdf' ? (
            <>
              <label htmlFor="fichier" className={labelClass}>
                <span className="flex items-center gap-1.5"><Upload className="h-3 w-3" /> Fichier (PDF, DOCX)</span>
              </label>
              <input
                id="fichier"
                name="fichier"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 file:border-0 file:bg-transparent file:text-xs file:font-medium focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400">Max 20 Mo — PDF, Word, PowerPoint</p>
            </>
          ) : type === 'video' || type === 'lien' ? (
            <>
              <label htmlFor="url" className={labelClass}>
                <span className="flex items-center gap-1.5"><Link className="h-3 w-3" /> URL</span>
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://…"
                required
                className={inputClass}
              />
            </>
          ) : (
            <div className="flex h-9 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3">
              <p className="text-xs text-slate-400">Sélectionnez d&apos;abord un type</p>
            </div>
          )}
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Support ajouté avec succès.</p>
      )}

      <button
        type="submit"
        disabled={pending || !type}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
      >
        <Plus className="h-4 w-4" />
        {pending ? 'Ajout en cours…' : 'Ajouter'}
      </button>
    </form>
  );
}
