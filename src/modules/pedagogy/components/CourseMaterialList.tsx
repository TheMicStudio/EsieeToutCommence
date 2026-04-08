'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, ExternalLink, FileText, Trash2, Video } from 'lucide-react';
import { deleteCourseMaterial } from '../actions';
import type { CourseMaterial } from '../types';
import { DocumentPreviewModal, detectPreviewMode } from '@/components/DocumentPreviewModal';

const TYPE_ICON = { video: Video, pdf: FileText, lien: ExternalLink };
const TYPE_LABEL = { video: 'Vidéo', pdf: 'PDF', lien: 'Lien' };
const TYPE_STYLE = {
  video: 'bg-purple-100 text-purple-600',
  pdf: 'bg-rose-100 text-rose-600',
  lien: 'bg-blue-100 text-blue-600',
};
const TYPE_ICON_BG = {
  video: 'bg-purple-100 text-purple-500',
  pdf: 'bg-rose-100 text-rose-500',
  lien: 'bg-[#89aae6]/20 text-[#3685b5]',
};

interface CourseMaterialListProps {
  materials: CourseMaterial[];
  classId: string;
  canDelete?: boolean;
}

interface PreviewTarget {
  url: string;
  title: string;
  type: string;
}

export function CourseMaterialList({ materials: initialMaterials, classId, canDelete = false }: CourseMaterialListProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>(initialMaterials);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    setMaterials(initialMaterials);
  }, [initialMaterials]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`course-materials-${classId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'course_materials', filter: `class_id=eq.${classId}` }, (payload) => {
        const newMaterial = payload.new as CourseMaterial;
        setMaterials((prev) => {
          if (prev.some((m) => m.id === newMaterial.id)) return prev;
          return [newMaterial, ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'course_materials', filter: `class_id=eq.${classId}` }, (payload) => {
        setMaterials((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (materials.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white">
        <span className="text-2xl">📂</span>
        <p className="text-sm text-slate-500">Aucun support de cours pour l&apos;instant.</p>
      </div>
    );
  }

  const grouped = materials.reduce<Record<string, CourseMaterial[]>>((acc, m) => {
    if (!acc[m.matiere]) acc[m.matiere] = [];
    acc[m.matiere].push(m);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-6">
        {Object.entries(grouped).map(([matiere, items]) => (
          <div key={matiere}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {matiere}
            </p>
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
              {items.map((material) => {
                const Icon = TYPE_ICON[material.type];
                const previewMode = detectPreviewMode(material.url, null, material.type);
                const canPreview = previewMode !== 'none';

                return (
                  <div
                    key={material.id}
                    className="group flex items-center gap-4 px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 transition-colors"
                  >
                    <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', TYPE_ICON_BG[material.type]].join(' ')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => canPreview && setPreview({ url: material.url, title: material.titre, type: material.type })}
                        className={[
                          'block truncate text-left text-sm font-semibold text-[#061826] transition-colors',
                          canPreview ? 'hover:text-[#0471a6] cursor-pointer' : 'cursor-default',
                        ].join(' ')}
                      >
                        {material.titre}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(material.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {/* Aperçu rapide (hover) */}
                      {canPreview && (
                        <button
                          type="button"
                          onClick={() => setPreview({ url: material.url, title: material.titre, type: material.type })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-[#0471a6] group-hover:opacity-100"
                          title="Aperçu"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}

                      {/* Ouvrir dans un nouvel onglet */}
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                        title="Ouvrir"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <span className={['shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TYPE_STYLE[material.type]].join(' ')}>
                        {TYPE_LABEL[material.type]}
                      </span>

                      {canDelete && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => startTransition(async () => { await deleteCourseMaterial(material.id); router.refresh(); })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <DocumentPreviewModal
          url={preview.url}
          title={preview.title}
          fileType={preview.type}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
