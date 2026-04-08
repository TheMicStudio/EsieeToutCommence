'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExternalLink, FileText, Trash2, Video } from 'lucide-react';
import { deleteCourseMaterial } from '../actions';
import type { CourseMaterial } from '../types';

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

export function CourseMaterialList({ materials: initialMaterials, classId, canDelete = false }: CourseMaterialListProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>(initialMaterials);
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  // Synchroniser si les props changent (changement de classe côté prof)
  useEffect(() => {
    setMaterials(initialMaterials);
  }, [initialMaterials]);

  // Realtime : écoute INSERT / DELETE sur course_materials pour cette classe
  useEffect(() => {
    const channel = supabase
      .channel(`course-materials-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_materials',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          const newMaterial = payload.new as CourseMaterial;
          setMaterials((prev) => {
            if (prev.some((m) => m.id === newMaterial.id)) return prev;
            // Insérer en tête (plus récent en premier)
            return [newMaterial, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'course_materials',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          setMaterials((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
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
    <div className="space-y-6">
      {Object.entries(grouped).map(([matiere, items]) => (
        <div key={matiere}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {matiere}
          </p>
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
            {items.map((material) => {
              const Icon = TYPE_ICON[material.type];
              return (
                <div
                  key={material.id}
                  className="flex items-center gap-4 px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', TYPE_ICON_BG[material.type]].join(' ')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-semibold text-[#061826] hover:text-[#0471a6] transition-colors"
                    >
                      {material.titre}
                    </a>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(material.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={['shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TYPE_STYLE[material.type]].join(' ')}>
                    {TYPE_LABEL[material.type]}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startTransition(async () => { await deleteCourseMaterial(material.id); })}
                      className="shrink-0 text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
