'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Users2,
  UserPlus,
  Download,
  ArrowUpDown,
  List,
  GraduationCap,
  Briefcase,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Star,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';
import type { StudentProfile, TeacherProfile } from '../types';

type ClassInfo = { id: string; nom: string };
type Tab = 'tous' | 'eleves' | 'profs' | 'assistants' | 'admin';
type Status = 'online' | 'offline' | 'meeting';
type MemberRole = 'eleve' | 'professeur' | 'assistant' | 'admin';

interface AnnuaireGridProps {
  eleves: StudentProfile[];
  professeurs: TeacherProfile[];
  classes?: ClassInfo[];
}

interface MemberEntry {
  id: string;
  prenom: string;
  nom: string;
  role: MemberRole;
  department: string;
  promo?: string;
  description: string;
  email?: string;
}

function getStatus(id: string): Status {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const v = Math.abs(hash) % 3;
  return v === 0 ? 'online' : v === 1 ? 'offline' : 'meeting';
}

function getInitials(prenom: string, nom: string) {
  return `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`;
}

const AVATAR_PALETTES = [
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
];

function getAvatarPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

const ROLE_BADGE: Record<MemberRole, { label: string; className: string }> = {
  eleve:      { label: 'Élève',     className: 'bg-cyan-50 border border-cyan-100 text-cyan-700' },
  professeur: { label: 'Prof',      className: 'bg-indigo-50 border border-indigo-100 text-indigo-700' },
  assistant:  { label: 'Assistant', className: 'bg-amber-50 border border-amber-100 text-amber-700' },
  admin:      { label: 'Admin',     className: 'bg-rose-50 border border-rose-100 text-rose-700' },
};

const STATUS_DOT: Record<Status, string> = {
  online:  'bg-emerald-500',
  offline: 'bg-slate-300',
  meeting: 'bg-amber-500',
};

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'tous',       label: 'Tous',       Icon: List },
  { id: 'eleves',     label: 'Élèves',     Icon: GraduationCap },
  { id: 'profs',      label: 'Profs',      Icon: Briefcase },
  { id: 'assistants', label: 'Assistants', Icon: Sparkles },
  { id: 'admin',      label: 'Admin',      Icon: ShieldCheck },
];

export function AnnuaireGrid({ eleves, professeurs, classes = [] }: AnnuaireGridProps) {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const pathname      = usePathname();

  // Filter state — deptFilter & promoFilter live in URL so the layout sidebar can read them
  const deptFilter  = searchParams.get('dept')  ?? '';
  const promoFilter = searchParams.get('promo') ?? '';

  const setDeptFilter = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('dept', val); else params.delete('dept');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const setPromoFilter = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('promo', val); else params.delete('promo');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Local-only state
  const [filterSearch, setFilterSearch] = useState('');
  const [activeTab, setActiveTab]       = useState<Tab>('tous');
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());

  const allMembers = useMemo<MemberEntry[]>(() => {
    const elevesEntries: MemberEntry[] = eleves.map((e) => {
      const classeNom = e.class_id ? classes.find((c) => c.id === e.class_id)?.nom : undefined;
      return {
        id: e.id,
        prenom: e.prenom,
        nom: e.nom,
        role: 'eleve',
        department: classeNom ?? 'N/A',
        promo: classeNom,
        description:
          e.type_parcours === 'alternant'
            ? `Étudiant alternant${classeNom ? ' en ' + classeNom : ''}. Combine formation et entreprise.`
            : `Étudiant${classeNom ? ' en ' + classeNom : ''}. Inscrit à temps plein sur la plateforme.`,
        email: e.email,
      };
    });

    const profsEntries: MemberEntry[] = professeurs.map((p) => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      role: 'professeur',
      department: p.matieres_enseignees[0] ?? 'N/A',
      description:
        p.matieres_enseignees.length > 0
          ? `Enseigne ${p.matieres_enseignees.slice(0, 2).join(' et ')}. Disponible pour accompagnement.`
          : 'Professeur sur la plateforme.',
      email: p.email,
    }));

    return [...elevesEntries, ...profsEntries];
  }, [eleves, professeurs, classes]);

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
      const matchSearch =
        !filterSearch ||
        fullName.includes(filterSearch.toLowerCase()) ||
        (m.email?.toLowerCase().includes(filterSearch.toLowerCase())) ||
        m.department.toLowerCase().includes(filterSearch.toLowerCase());

      const matchTab =
        activeTab === 'tous' ||
        (activeTab === 'eleves'     && m.role === 'eleve') ||
        (activeTab === 'profs'      && m.role === 'professeur') ||
        (activeTab === 'assistants' && m.role === 'assistant') ||
        (activeTab === 'admin'      && m.role === 'admin');

      const matchDept  = !deptFilter  || m.department === deptFilter;
      const matchPromo = !promoFilter || m.promo === promoFilter;

      return matchSearch && matchTab && matchDept && matchPromo;
    });
  }, [allMembers, filterSearch, activeTab, deptFilter, promoFilter]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilterSearch('');
    const params = new URLSearchParams();
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4 pb-4">

      {/* TITLE SECTION */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-slate-900 leading-tight">Annuaire des Membres</h1>
          <p className="text-[12px] font-medium text-slate-500">
            Connectez-vous avec les élèves, professeurs et assistants de la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2 text-[12px] font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Inviter membres
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-1 min-w-[160px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 focus-within:border-[#0471a6]/40 focus-within:ring-2 focus-within:ring-[#0471a6]/10 transition-all">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer les membres..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 cursor-pointer"
          >
            <option value="">Tous les départements</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Data Science">Data Science</option>
          </select>
          <select
            value={promoFilter}
            onChange={(e) => setPromoFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 cursor-pointer"
          >
            <option value="">Toutes les promotions</option>
            <option value="Promo 24">Promo 24</option>
            <option value="Promo 25">Promo 25</option>
            <option value="Promo 26">Promo 26</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Tri
          </button>
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-bold transition-all',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* MEMBERS GRID */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white">
          <Search className="h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">Aucun résultat trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => {
            const status    = getStatus(member.id);
            const palette   = getAvatarPalette(member.id);
            const badge     = ROLE_BADGE[member.role];
            const isFav     = favorites.has(member.id);
            const initials  = getInitials(member.prenom, member.nom);
            const isOffline = status === 'offline';

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div
                      className={[
                        'flex h-14 w-14 items-center justify-center rounded-2xl text-[15px] font-bold ring-2 ring-white',
                        palette.bg, palette.text,
                        isOffline ? 'grayscale' : '',
                      ].join(' ')}
                    >
                      {initials}
                    </div>
                    <span
                      className={[
                        'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white',
                        STATUS_DOT[status],
                      ].join(' ')}
                    />
                  </div>
                  <span className={['rounded-full px-2.5 py-1 text-[11px] font-bold uppercase', badge.className].join(' ')}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-slate-900">
                    {member.prenom} {member.nom}
                  </h3>
                  <div className="mt-1 flex gap-2 text-[12px] font-medium text-slate-500">
                    <span>{member.department}</span>
                    {member.promo && member.promo !== member.department && (
                      <span>· {member.promo}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium text-slate-600 line-clamp-2">
                    {member.description}
                  </p>
                </div>

                <div className="border-t border-slate-50" />

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Message
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(member.id)}
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                      isFav
                        ? 'border-amber-100 bg-amber-50 text-amber-500'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-500',
                    ].join(' ')}
                  >
                    <Star className={['h-4 w-4', isFav ? 'fill-amber-500' : ''].join(' ')} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER HINT */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800">Astuce Directory</p>
            <p className="text-[12px] font-medium text-slate-500">
              Utilisez les filtres pour trouver rapidement des profils spécifiques.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          Besoin d&apos;aide ?
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
