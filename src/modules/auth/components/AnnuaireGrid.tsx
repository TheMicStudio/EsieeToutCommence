'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  List,
  GraduationCap,
  Briefcase,
  BookOpen,
  ShieldCheck,
  ClipboardList,
  Phone,
  PhoneCall,
  Mail,
  Star,
  Check,
} from 'lucide-react';
import type { StudentProfile, TeacherProfile, AdminProfile } from '../types';

type ClassInfo = { id: string; nom: string };
type Tab = 'tous' | 'eleves' | 'profs' | 'coordinateurs' | 'direction' | 'secretariat';
type MemberRole = 'eleve' | 'professeur' | 'coordinateur' | 'direction' | 'secretariat';

interface AnnuaireGridProps {
  eleves: StudentProfile[];
  professeurs: TeacherProfile[];
  coordinateurs?: TeacherProfile[];
  admins?: AdminProfile[];
  staff?: AdminProfile[];
  classes?: ClassInfo[];
}

interface MemberEntry {
  id: string;
  prenom: string;
  nom: string;
  role: MemberRole;
  department: string;
  promo?: string;
  tag?: string;
  email?: string;
  phone?: string;
  phone_fixed?: string;
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
  eleve:        { label: 'Élève',          className: 'bg-cyan-50 border border-cyan-100 text-cyan-700' },
  professeur:   { label: 'Prof',           className: 'bg-indigo-50 border border-indigo-100 text-indigo-700' },
  coordinateur: { label: 'Resp. péda.',    className: 'bg-amber-50 border border-amber-100 text-amber-700' },
  direction:    { label: 'Direction',      className: 'bg-rose-50 border border-rose-100 text-rose-700' },
  secretariat:  { label: 'Secrétariat',   className: 'bg-violet-50 border border-violet-100 text-violet-700' },
};

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'tous',          label: 'Tous',               Icon: List },
  { id: 'eleves',        label: 'Élèves',             Icon: GraduationCap },
  { id: 'profs',         label: 'Profs',              Icon: Briefcase },
  { id: 'coordinateurs', label: 'Resp. pédagogique',  Icon: BookOpen },
  { id: 'secretariat',   label: 'Secrétariat',        Icon: ClipboardList },
  { id: 'direction',     label: 'Direction',          Icon: ShieldCheck },
];

export function AnnuaireGrid({ eleves, professeurs, coordinateurs = [], admins = [], staff = [], classes = [] }: AnnuaireGridProps) {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const pathname      = usePathname();

  // Filter state — promoFilter lives in URL so the layout sidebar can read it
  const promoFilter = searchParams.get('promo') ?? '';

  const setPromoFilter = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('promo', val); else params.delete('promo');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Local-only state
  const [filterSearch, setFilterSearch] = useState('');
  const [activeTab, setActiveTab]       = useState<Tab>('tous');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('annuaire_favorites');
      return stored ? new Set<string>(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [copiedPhoneId, setCopiedPhoneId]   = useState<string | null>(null);
  const [copiedFixedId, setCopiedFixedId]   = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId]   = useState<string | null>(null);

  const handlePhone = useCallback((number: string, key: string, setter: (v: string | null) => void) => {
    const isTouchDevice = typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      window.location.href = `tel:${number}`;
    } else {
      navigator.clipboard.writeText(number).then(() => {
        setter(key);
        setTimeout(() => setter(null), 2000);
      });
    }
  }, []);

  const handleEmail = useCallback((member: MemberEntry) => {
    if (!member.email) return;
    const isTouchDevice = typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      window.location.href = `mailto:${member.email}`;
    } else {
      navigator.clipboard.writeText(member.email).then(() => {
        setCopiedEmailId(member.id);
        setTimeout(() => setCopiedEmailId(null), 2000);
      });
    }
  }, []);

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
        tag: e.type_parcours === 'alternant' ? 'Alternant' : 'Formation initiale',
        email: e.email,
        phone: e.phone_mobile,
        phone_fixed: e.phone_fixed,
      };
    });

    const profsEntries: MemberEntry[] = professeurs.map((p) => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      role: 'professeur' as MemberRole,
      department: p.matieres_enseignees[0] ?? 'N/A',
      tag: p.matieres_enseignees.length > 0
        ? p.matieres_enseignees.slice(0, 2).join(' · ')
        : undefined,
      email: p.email,
      phone: p.phone_mobile,
      phone_fixed: p.phone_fixed,
    }));

    const coordEntries: MemberEntry[] = coordinateurs.map((p) => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      role: 'coordinateur' as MemberRole,
      department: p.matieres_enseignees[0] ?? 'Pédagogie',
      tag: p.matieres_enseignees.length > 0
        ? p.matieres_enseignees.slice(0, 2).join(' · ')
        : undefined,
      email: p.email,
      phone: p.phone_mobile,
      phone_fixed: p.phone_fixed,
    }));

    const adminEntries: MemberEntry[] = admins.map((a) => ({
      id: a.id,
      prenom: a.prenom,
      nom: a.nom,
      role: 'direction' as MemberRole,
      department: a.fonction ?? 'Direction',
      email: a.email,
      phone: a.phone_mobile,
      phone_fixed: a.phone_fixed,
    }));

    const staffEntries: MemberEntry[] = staff.map((s) => ({
      id: s.id,
      prenom: s.prenom,
      nom: s.nom,
      role: 'secretariat' as MemberRole,
      department: s.fonction ?? 'Secrétariat',
      email: s.email,
      phone: s.phone_mobile,
      phone_fixed: s.phone_fixed,
    }));

    return [...elevesEntries, ...profsEntries, ...coordEntries, ...adminEntries, ...staffEntries];
  }, [eleves, professeurs, coordinateurs, admins, staff, classes]);

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
        (activeTab === 'eleves'        && m.role === 'eleve') ||
        (activeTab === 'profs'         && m.role === 'professeur') ||
        (activeTab === 'coordinateurs' && m.role === 'coordinateur') ||
        (activeTab === 'direction'     && m.role === 'direction') ||
        (activeTab === 'secretariat'   && m.role === 'secretariat');

      const matchPromo = !promoFilter || m.promo === promoFilter;

      return matchSearch && matchTab && matchPromo;
    }).sort((a, b) => {
      const aFav = favorites.has(a.id) ? 0 : 1;
      const bFav = favorites.has(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }, [allMembers, filterSearch, activeTab, promoFilter, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('annuaire_favorites', JSON.stringify([...next])); } catch {}
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
      <div className="flex-1 min-w-0">
        <h1 className="text-[20px] font-bold text-slate-900 leading-tight">Annuaire des Membres</h1>
        <p className="text-[12px] font-medium text-slate-500">
          Connectez-vous avec les élèves, professeurs et responsables de la plateforme.
        </p>
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
            value={promoFilter}
            onChange={(e) => setPromoFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 cursor-pointer"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
          </select>
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
            const palette   = getAvatarPalette(member.id);
            const badge     = ROLE_BADGE[member.role];
            const isFav     = favorites.has(member.id);
            const initials  = getInitials(member.prenom, member.nom);

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card"
              >
                {/* Header : avatar + badge + étoile */}
                <div className="flex items-start justify-between">
                  <div
                    className={[
                      'flex h-14 w-14 items-center justify-center rounded-2xl text-[15px] font-bold ring-2 ring-white',
                      palette.bg, palette.text,
                    ].join(' ')}
                  >
                    {initials}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={['rounded-full px-2.5 py-1 text-[11px] font-bold uppercase', badge.className].join(' ')}>
                      {badge.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(member.id)}
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-xl border transition-colors',
                        isFav
                          ? 'border-amber-100 bg-amber-50 text-amber-500'
                          : 'border-slate-200 bg-white text-slate-300 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-500',
                      ].join(' ')}
                    >
                      <Star className={['h-3.5 w-3.5', isFav ? 'fill-amber-500' : ''].join(' ')} />
                    </button>
                  </div>
                </div>

                {/* Identité */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-slate-900 truncate">
                    {member.prenom} {member.nom}
                  </h3>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-500 truncate">
                    {member.department}
                    {member.tag && <span className="ml-2 text-slate-400">· {member.tag}</span>}
                  </p>
                </div>

                <div className="border-t border-slate-100" />

                {/* Contacts — une ligne par info */}
                <div className="space-y-1.5">
                  {/* Email */}
                  <button
                    type="button"
                    onClick={() => handleEmail(member)}
                    disabled={!member.email}
                    title={member.email ?? 'Email non renseigné'}
                    className={[
                      'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors text-left',
                      member.email
                        ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {copiedEmailId === member.id
                      ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      : <Mail className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">
                      {copiedEmailId === member.id ? 'Copié !' : (member.email ?? 'Email non renseigné')}
                    </span>
                  </button>

                  {/* Mobile */}
                  <button
                    type="button"
                    onClick={() => member.phone && handlePhone(member.phone, member.id + '-mob', setCopiedPhoneId)}
                    disabled={!member.phone}
                    title={member.phone ? `Mobile : ${member.phone}` : 'Mobile non renseigné'}
                    className={[
                      'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors text-left',
                      member.phone
                        ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {copiedPhoneId === member.id + '-mob'
                      ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      : <Phone className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">
                      {copiedPhoneId === member.id + '-mob' ? 'Copié !' : (member.phone ?? 'Mobile non renseigné')}
                    </span>
                  </button>

                  {/* Fixe (conditionnel) */}
                  {member.phone_fixed && (
                    <button
                      type="button"
                      onClick={() => handlePhone(member.phone_fixed!, member.id + '-fix', setCopiedFixedId)}
                      title={`Fixe : ${member.phone_fixed}`}
                      className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      {copiedFixedId === member.id + '-fix'
                        ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        : <PhoneCall className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">
                        {copiedFixedId === member.id + '-fix' ? 'Copié !' : member.phone_fixed}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
