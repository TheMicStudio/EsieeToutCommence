'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Grid3x3,
  List,
  Plus,
  Video,
  FileText,
  Link as LinkIcon,
  Folders,
  X,
  Search,
  Tag,
  CircleDot,
  ArrowUpDown,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { AddCourseMaterialForm } from './AddCourseMaterialForm';
import { DocumentPreviewModal, detectPreviewMode } from '@/components/DocumentPreviewModal';
import type { CourseMaterial } from '../types';

// ─── Fallback data ──────────────────────────────────────────────────────────
const FALLBACK_MATERIALS: CourseMaterial[] = [
  { id: 'f1', class_id: '', teacher_id: '', matiere: 'Algorithmique', titre: 'Introduction aux algorithmes de tri', type: 'pdf', url: '#', created_at: '2024-01-15T10:00:00Z' },
  { id: 'f2', class_id: '', teacher_id: '', matiere: 'Mathématiques', titre: 'Algèbre linéaire — Matrices et vecteurs', type: 'lien', url: '#', created_at: '2024-01-10T10:00:00Z' },
  { id: 'f3', class_id: '', teacher_id: '', matiere: 'Développement web', titre: 'React & Next.js — Cours complet', type: 'video', url: '#', created_at: '2024-01-12T10:00:00Z' },
  { id: 'f4', class_id: '', teacher_id: '', matiere: 'Bases de données', titre: 'Conception de bases de données relationnelles', type: 'pdf', url: '#', created_at: '2024-01-08T10:00:00Z' },
  { id: 'f5', class_id: '', teacher_id: '', matiere: 'Mathématiques', titre: 'Calcul intégral et différentiel', type: 'lien', url: '#', created_at: '2024-01-09T10:00:00Z' },
  { id: 'f6', class_id: '', teacher_id: '', matiere: 'Algorithmique', titre: 'Programmation dynamique avancée', type: 'video', url: '#', created_at: '2024-01-11T10:00:00Z' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GRADIENTS = [
  'from-violet-500 to-violet-700',
  'from-[#0471a6] to-[#025f8a]',
  'from-cyan-500 to-cyan-600',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-700',
  'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-600',
];

function gradientFor(str: string): string {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return GRADIENTS[h % GRADIENTS.length];
}

const TYPE_ICON = { video: Video, pdf: FileText, lien: LinkIcon };

const STATUS: Record<CourseMaterial['type'], { label: string; cls: string }> = {
  video: { label: 'Ouvert', cls: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
  pdf:   { label: 'Ouvert', cls: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
  lien:  { label: 'Fermé',  cls: 'bg-slate-50 border border-slate-200 text-slate-500' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumbnail({ material, size }: Readonly<{ material: CourseMaterial; size: 'full' | 'compact' }>) {
  const Icon = TYPE_ICON[material.type];
  const grad = gradientFor(material.matiere);
  const abbr = material.matiere.slice(0, 5);

  return (
    <div className={[
      'relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br',
      grad,
      size === 'full' ? 'h-[72px] w-full' : 'h-[56px] w-[72px]',
    ].join(' ')}>
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({ material, onPreview }: Readonly<{ material: CourseMaterial; onPreview: (m: CourseMaterial) => void }>) {
  const status = STATUS[material.type];
  const canPreview = detectPreviewMode(material.url, null, material.type) !== 'none';

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] hover:border-[#0471a6]/30 transition-all duration-200 flex flex-col">
      <button
        onClick={canPreview ? () => onPreview(material) : undefined}
        className={['block w-full text-left focus:outline-none', canPreview ? 'cursor-pointer' : 'cursor-default'].join(' ')}
      >
        <Thumbnail material={material} size="full" />
        <p className="mt-3 text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug">
          {material.titre}
        </p>
      </button>

      <div className="mt-3 flex items-center justify-between mb-4">
        <span className="text-[12px] font-medium text-slate-500">{formatDate(material.created_at)}</span>
        <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', status.cls].join(' ')}>
          {status.label}
        </span>
      </div>

      <div className="mt-auto flex gap-2">
        {canPreview && (
          <button
            onClick={() => onPreview(material)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </button>
        )}
        <a
          href={material.url === '#' ? undefined : material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ouvrir →
        </a>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ material, onPreview }: Readonly<{ material: CourseMaterial; onPreview: (m: CourseMaterial) => void }>) {
  const status = STATUS[material.type];
  const canPreview = detectPreviewMode(material.url, null, material.type) !== 'none';

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] transition-all duration-200 flex items-center gap-4">
      <button onClick={canPreview ? () => onPreview(material) : undefined} className="focus:outline-none">
        <Thumbnail material={material} size="compact" />
      </button>

      <button
        onClick={canPreview ? () => onPreview(material) : undefined}
        className={['flex-1 min-w-0 text-left focus:outline-none', canPreview ? 'cursor-pointer' : 'cursor-default'].join(' ')}
      >
        <p className="text-[15px] font-semibold text-slate-900 truncate">{material.titre}</p>
      </button>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[12px] font-medium text-slate-500 hidden sm:block">
          {formatDate(material.created_at)}
        </span>
        <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', status.cls].join(' ')}>
          {status.label}
        </span>
        {canPreview && (
          <button
            onClick={() => onPreview(material)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </button>
        )}
        <a
          href={material.url === '#' ? undefined : material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ouvrir →
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface CourseGridProps {
  materials: CourseMaterial[];
  canManage?: boolean;
  classId?: string;
  matieres?: string[];
  categoryOptions?: string[];
}

export function CourseGrid({
  materials,
  canManage = false,
  classId,
  matieres = [],
  categoryOptions,
}: CourseGridProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<CourseMaterial | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const source = materials.length === 0 ? FALLBACK_MATERIALS : materials;
  const uniqueMatieres = categoryOptions ?? [...new Set(source.map((m) => m.matiere))].sort((a, b) => a.localeCompare(b));

  const displayMaterials = useMemo(() => {
    let result = source.filter((m) => {
      const matchSearch =
        m.titre.toLowerCase().includes(search.toLowerCase()) ||
        m.matiere.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || m.matiere === categoryFilter;
      const matchStatus = !statusFilter || STATUS[m.type].label === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
    if (sort === 'name') result = result.sort((a, b) => a.titre.localeCompare(b.titre));
    else result = result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return result;
  }, [source, search, sort, categoryFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {previewMaterial && (
        <DocumentPreviewModal
          url={previewMaterial.url}
          title={previewMaterial.titre}
          fileType={previewMaterial.type}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
      {/* ── Title Section ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10">
            <Folders className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f1a2e] leading-tight">Supports de cours</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">Gérez et organisez les supports de cours de votre classe.</p>
          </div>
        </div>
        {canManage && classId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Fermer' : 'Nouveau cours'}
          </button>
        )}
      </div>

      {/* ── New Course Form ─────────────────────────────────────────────── */}
      {showForm && classId && (
        <AddCourseMaterialForm classId={classId} matieres={matieres} />
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        ref={toolbarRef}
        className="rounded-3xl border border-slate-200/70 bg-white px-5 pt-4 pb-3 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] space-y-3"
      >
        {/* Row 1 — Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un support par titre, semaine projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 focus:border-[#0471a6] transition-all"
          />
        </div>

        {/* Row 2 — Pills + Sort + Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: filter pills */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Category pill — Semaine projet */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                  categoryFilter
                    ? 'border-[#0471a6] bg-[#0471a6]/5 text-[#0471a6]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                <Tag className="h-3.5 w-3.5" />
                {categoryFilter ?? 'Semaine projet'}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {openDropdown === 'category' && (
                <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[200px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
                  <button
                    onClick={() => { setCategoryFilter(null); setOpenDropdown(null); }}
                    className="block w-full px-4 py-2 text-left text-[13px] text-slate-500 hover:bg-slate-50"
                  >
                    Toutes les semaines
                  </button>
                  {uniqueMatieres.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setCategoryFilter(m); setOpenDropdown(null); }}
                      className={[
                        'block w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50',
                        categoryFilter === m ? 'font-semibold text-[#0471a6]' : 'text-slate-700',
                      ].join(' ')}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status pill */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                  statusFilter
                    ? 'border-[#0471a6] bg-[#0471a6]/5 text-[#0471a6]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                <CircleDot className="h-3.5 w-3.5" />
                {statusFilter ?? 'Statut'}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {openDropdown === 'status' && (
                <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[160px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
                  {([null, 'Ouvert', 'Fermé'] as const).map((s) => (
                    <button
                      key={s ?? 'all'}
                      onClick={() => { setStatusFilter(s); setOpenDropdown(null); }}
                      className={[
                        'block w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50',
                        statusFilter === s ? 'font-semibold text-[#0471a6]' : 'text-slate-700',
                      ].join(' ')}
                    >
                      {s ?? 'Tous les statuts'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sort + Toggle */}
          <div className="flex items-center gap-2">
            {/* Sort by */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Trier par
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
                  {[
                    { value: 'updated', label: 'Récemment mis à jour' },
                    { value: 'name', label: 'Nom (A–Z)' },
                    { value: 'created', label: 'Date de création' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setOpenDropdown(null); }}
                      className={[
                        'block w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50',
                        sort === opt.value ? 'font-semibold text-[#0471a6]' : 'text-slate-700',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setMode('grid')}
                title="Vue grille"
                className={[
                  'flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  mode === 'grid' ? 'bg-[#0f1a2e] text-white' : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMode('list')}
                title="Vue liste"
                className={[
                  'flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  mode === 'list' ? 'bg-[#0f1a2e] text-white' : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {displayMaterials.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
          <p className="text-[13px] text-slate-400">Aucun cours trouvé.</p>
        </div>
      ) : mode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
          {displayMaterials.map((m) => (
            <GridCard key={m.id} material={m} onPreview={setPreviewMaterial} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 transition-all duration-300">
          {displayMaterials.map((m) => (
            <ListRow key={m.id} material={m} onPreview={setPreviewMaterial} />
          ))}
        </div>
      )}
    </div>
  );
}
