'use client';

import { useState, useMemo } from 'react';
import {
  Grid3x3,
  List,
  Filter,
  Plus,
  Video,
  FileText,
  Link as LinkIcon,
  Folders,
  X,
} from 'lucide-react';
import { AddCourseMaterialForm } from './AddCourseMaterialForm';
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
  video: { label: 'Live', cls: 'bg-blue-50 border border-blue-200 text-blue-700' },
  pdf: { label: 'Published', cls: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
  lien: { label: 'Draft', cls: 'bg-white border border-slate-200 text-slate-700' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumbnail({ material, size }: { material: CourseMaterial; size: 'full' | 'compact' }) {
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
      {/* Category badge overlaid top-left */}
      <span className="absolute left-2 top-2 rounded-lg bg-[#0471a6]/90 px-2 py-1 text-[10px] font-bold text-white">
        {abbr}
      </span>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({ material }: { material: CourseMaterial }) {
  const status = STATUS[material.type];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] hover:border-[#0471a6]/30 transition-all duration-200 flex flex-col">
      <Thumbnail material={material} size="full" />

      <p className="mt-3 text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug">
        {material.titre}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500">{formatDate(material.created_at)}</span>
        <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', status.cls].join(' ')}>
          {status.label}
        </span>
      </div>

      <a
        href={material.url === '#' ? undefined : material.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded-xl border border-slate-200 bg-white py-2 text-center text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Manage →
      </a>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ material }: { material: CourseMaterial }) {
  const status = STATUS[material.type];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] transition-all duration-200 flex items-center gap-4">
      <Thumbnail material={material} size="compact" />

      <p className="flex-1 min-w-0 text-[15px] font-semibold text-slate-900 truncate">
        {material.titre}
      </p>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[12px] font-medium text-slate-500 hidden sm:block">
          {formatDate(material.created_at)}
        </span>
        <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', status.cls].join(' ')}>
          {status.label}
        </span>
        <a
          href={material.url === '#' ? undefined : material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Manage →
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
}

export function CourseGrid({
  materials,
  canManage = false,
  classId,
  matieres = [],
}: CourseGridProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('updated');
  const [showForm, setShowForm] = useState(false);

  const displayMaterials = useMemo(() => {
    const source = materials.length === 0 ? FALLBACK_MATERIALS : materials;
    let result = source.filter((m) =>
      m.titre.toLowerCase().includes(filter.toLowerCase()) ||
      m.matiere.toLowerCase().includes(filter.toLowerCase())
    );
    if (sort === 'name') result = result.sort((a, b) => a.titre.localeCompare(b.titre));
    else result = result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return result;
  }, [materials, filter, sort]);

  return (
    <div className="space-y-5">
      {/* ── Title Section ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10">
            <Folders className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f1a2e] leading-tight">Courses by Class</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">Manage and organize your courses efficiently.</p>
          </div>
        </div>
        {canManage && classId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'New Course'}
          </button>
        )}
      </div>

      {/* ── New Course Form ─────────────────────────────────────────────── */}
      {showForm && classId && (
        <AddCourseMaterialForm classId={classId} matieres={matieres} />
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] flex items-center gap-3 flex-wrap">
        {/* Filter */}
        <div className="relative flex-1 min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter courses..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 focus:border-[#0471a6] focus:bg-white transition-all"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 focus:border-[#0471a6] focus:bg-white transition-all"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name (A–Z)</option>
          <option value="created">Date Created</option>
        </select>

        {/* Grid / List toggle */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setMode('grid')}
            title="Grid view"
            className={[
              'flex items-center justify-center rounded-xl p-1.5 transition-colors',
              mode === 'grid'
                ? 'bg-[#0f1a2e] text-white'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMode('list')}
            title="List view"
            className={[
              'flex items-center justify-center rounded-xl p-1.5 transition-colors',
              mode === 'list'
                ? 'bg-[#0f1a2e] text-white'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            <List className="h-4 w-4" />
          </button>
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
            <GridCard key={m.id} material={m} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 transition-all duration-300">
          {displayMaterials.map((m) => (
            <ListRow key={m.id} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}
