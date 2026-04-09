'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Grid3x3, List, Search, Tag, CircleDot, ArrowUpDown, ChevronDown,
  CalendarDays, Users, FolderKanban,
} from 'lucide-react';
import Link from 'next/link';
import type { ProjectWeek } from '../types';
import { DeleteWeekButton } from './DeleteWeekButton';

type WeekStatus = 'active' | 'upcoming' | 'past';

function getStatus(week: ProjectWeek): WeekStatus {
  const now = new Date();
  if (new Date(week.start_date) <= now && now <= new Date(week.end_date)) return 'active';
  if (new Date(week.start_date) > now) return 'upcoming';
  return 'past';
}

const STATUS_LABELS: Record<WeekStatus, { label: string; cls: string }> = {
  active:   { label: 'En cours',  cls: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
  upcoming: { label: 'À venir',   cls: 'bg-[#89aae6]/20 border border-[#89aae6]/30 text-[#3685b5]' },
  past:     { label: 'Terminée',  cls: 'bg-slate-50 border border-slate-200 text-slate-500' },
};

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function formatDateFull(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Grid Card ───────────────────────────────────────────────────────────────

function GridCard({ week, groupCount, classLabel, basePath, canDelete }: Readonly<{
  week: ProjectWeek;
  groupCount: number;
  classLabel?: string;
  basePath: string;
  canDelete?: boolean;
}>) {
  const status = getStatus(week);
  const s = STATUS_LABELS[status];
  const grad = gradientFor(week.title);
  const abbr = week.title.slice(0, 3).toUpperCase();

  return (
    <div className="relative rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] hover:border-[#0471a6]/30 transition-all duration-200">
      <Link href={`${basePath}/${week.id}`} className="flex flex-col p-5 block">
        {/* Thumbnail */}
        <div className={`relative h-[72px] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${grad} mb-3`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white/20 tracking-wider">{abbr}</span>
          </div>
          <div className="absolute bottom-2 right-2">
            <FolderKanban className="h-5 w-5 text-white/40" />
          </div>
        </div>

        <p className="text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug">
          {week.title}
        </p>

        <div className="mt-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(week.start_date)} → {formatDateFull(week.end_date)}</span>
          </div>
          <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', s.cls].join(' ')}>
            {s.label}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Users className="h-3.5 w-3.5" />
            <span>{groupCount} groupe{groupCount !== 1 ? 's' : ''}</span>
          </div>
          {classLabel && (
            <span className="rounded-full bg-[#89aae6]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#3685b5] truncate max-w-[120px]">
              {classLabel}
            </span>
          )}
        </div>
      </Link>
      {canDelete && (
        <div className="absolute top-3 right-3">
          <DeleteWeekButton weekId={week.id} weekTitle={week.title} />
        </div>
      )}
    </div>
  );
}

// ─── List Row ────────────────────────────────────────────────────────────────

function ListRow({ week, groupCount, classLabel, basePath, canDelete }: {
  week: ProjectWeek;
  groupCount: number;
  classLabel?: string;
  basePath: string;
  canDelete?: boolean;
}) {
  const status = getStatus(week);
  const s = STATUS_LABELS[status];
  const grad = gradientFor(week.title);
  const abbr = week.title.slice(0, 3).toUpperCase();

  return (
    <div className="relative rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_1px_0_rgba(15,23,42,0.08),0_14px_40px_rgba(15,23,42,0.1)] transition-all duration-200">
      <Link href={`${basePath}/${week.id}`} className="flex items-center gap-4 p-3 block">
        {/* Mini thumbnail */}
        <div className={`relative h-[56px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${grad}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-white/30">{abbr}</span>
          </div>
        </div>

        <p className="flex-1 min-w-0 text-[15px] font-semibold text-slate-900 truncate">
          {week.title}
        </p>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(week.start_date)} → {formatDateFull(week.end_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Users className="h-3.5 w-3.5" />
            <span>{groupCount}</span>
          </div>
          {classLabel && (
            <span className="hidden md:inline-flex rounded-full bg-[#89aae6]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#3685b5]">
              {classLabel}
            </span>
          )}
          <span className={['rounded-xl px-2 py-0.5 text-[11px] font-semibold', s.cls].join(' ')}>
            {s.label}
          </span>
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Ouvrir →
          </span>
        </div>
      </Link>
      {canDelete && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3">
          <DeleteWeekButton weekId={week.id} weekTitle={week.title} />
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export interface WeekWithMeta extends ProjectWeek {
  classId: string;
  classNom: string;
  groupCount: number;
}

interface ProjectWeekGridProps {
  weeks: WeekWithMeta[];
  basePath: string;
  showClassLabel?: boolean;
  headerSlot?: React.ReactNode;
  /** ID de l'utilisateur courant — pour déterminer les semaines qu'il peut supprimer */
  currentUserId?: string;
  /** Si true, admin/coord peuvent supprimer toutes les semaines */
  canDeleteAll?: boolean;
}

export function ProjectWeekGrid({ weeks, basePath, showClassLabel = false, headerSlot, currentUserId, canDeleteAll = false }: ProjectWeekGridProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const uniqueClasses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const w of weeks) seen.set(w.classId, w.classNom);
    return [...seen.entries()].map(([id, nom]) => ({ id, nom }));
  }, [weeks]);

  const displayed = useMemo(() => {
    let result = weeks.filter((w) => {
      const matchSearch = w.title.toLowerCase().includes(search.toLowerCase());
      const matchClass = !classFilter || w.classId === classFilter;
      const matchStatus = !statusFilter || STATUS_LABELS[getStatus(w)].label === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
    if (sort === 'name') result = result.sort((a, b) => a.title.localeCompare(b.title));
    else result = result.sort((a, b) => a.start_date.localeCompare(b.start_date));
    return result;
  }, [weeks, search, classFilter, statusFilter, sort]);

  return (
    <div className="space-y-5">
      {/* Title + action slot */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0471a6]/10">
            <FolderKanban className="h-5 w-5 text-[#0471a6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f1a2e] leading-tight">Semaines projets</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">Accédez aux semaines projets, groupes et soutenances.</p>
          </div>
        </div>
        {headerSlot}
      </div>

      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className="rounded-3xl border border-slate-200/70 bg-white px-5 pt-4 pb-3 shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] space-y-3"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une semaine projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 focus:border-[#0471a6] transition-all"
          />
        </div>

        {/* Filters + Sort + Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">

            {/* Filtre classe (si plusieurs classes) */}
            {uniqueClasses.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'class' ? null : 'class')}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                    classFilter
                      ? 'border-[#0471a6] bg-[#0471a6]/5 text-[#0471a6]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  <Tag className="h-3.5 w-3.5" />
                  {classFilter ? uniqueClasses.find((c) => c.id === classFilter)?.nom : 'Classe'}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {openDropdown === 'class' && (
                  <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
                    <button
                      onClick={() => { setClassFilter(null); setOpenDropdown(null); }}
                      className="block w-full px-4 py-2 text-left text-[13px] text-slate-500 hover:bg-slate-50"
                    >
                      Toutes les classes
                    </button>
                    {uniqueClasses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setClassFilter(c.id); setOpenDropdown(null); }}
                        className={[
                          'block w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50',
                          classFilter === c.id ? 'font-semibold text-[#0471a6]' : 'text-slate-700',
                        ].join(' ')}
                      >
                        {c.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filtre statut */}
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
                  {([null, 'En cours', 'À venir', 'Terminée'] as const).map((s) => (
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

          <div className="flex items-center gap-2">
            {/* Sort */}
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
                    { value: 'date', label: 'Date de début' },
                    { value: 'name', label: 'Nom (A–Z)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value as 'date' | 'name'); setOpenDropdown(null); }}
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
                className={[
                  'flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  mode === 'grid' ? 'bg-[#0f1a2e] text-white' : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMode('list')}
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

      {/* Content */}
      {displayed.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
          <p className="text-[13px] text-slate-400">Aucune semaine projet trouvée.</p>
        </div>
      ) : mode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
          {displayed.map((w) => (
            <GridCard
              key={w.id}
              week={w}
              groupCount={w.groupCount}
              classLabel={showClassLabel ? w.classNom : undefined}
              basePath={basePath}
              canDelete={canDeleteAll || (!!currentUserId && w.cree_par === currentUserId)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 transition-all duration-300">
          {displayed.map((w) => (
            <ListRow
              key={w.id}
              week={w}
              groupCount={w.groupCount}
              classLabel={showClassLabel ? w.classNom : undefined}
              basePath={basePath}
              canDelete={canDeleteAll || (!!currentUserId && w.cree_par === currentUserId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
