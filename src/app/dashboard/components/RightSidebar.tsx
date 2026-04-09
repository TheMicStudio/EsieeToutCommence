'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  BookOpen, Cpu, Code2, Database, GraduationCap, LifeBuoy, Settings,
  X, MessageCircle, FileText, ScrollText, Notebook, FlaskConical,
  ChevronRight, CalendarPlus, HelpCircle,
  ListChecks, TrendingUp, AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/modules/auth/types';

// ─────────────────────────────────────────────────────────
// Default right sidebar (all pages except annuaire)
// ─────────────────────────────────────────────────────────

interface RightSidebarProps {
  userProfile: UserProfile;
}

type DocItem = {
  label: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  href: string;
};

function getRecentDocs(role: UserProfile['role']): DocItem[] {
  const byRole: Record<UserProfile['role'], DocItem[]> = {
    eleve: [
      { label: 'Algorithmique', sub: 'Cours · il y a 2 j', icon: Cpu, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/pedagogie/cours' },
      { label: 'Dev Web', sub: 'TP · Vendredi', icon: Code2, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/pedagogie/cours' },
      { label: 'Base de données', sub: 'Cours · Lundi', icon: Database, iconBg: 'bg-emerald-100 text-emerald-500', href: '/dashboard/pedagogie/cours' },
      { label: 'Mes notes', sub: 'Notes · ce semestre', icon: BookOpen, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/pedagogie/notes' },
    ],
    professeur: [
      { label: 'Mes classes', sub: 'Pédagogie · actif', icon: GraduationCap, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/pedagogie' },
      { label: 'Cours déposés', sub: 'Supports · 3 fichiers', icon: BookOpen, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/pedagogie/cours' },
      { label: 'Base de données', sub: 'Matière · 2 classes', icon: Database, iconBg: 'bg-emerald-100 text-emerald-500', href: '/dashboard/pedagogie' },
      { label: 'Algorithmes', sub: 'Matière · 1 classe', icon: Cpu, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/pedagogie' },
    ],
    admin: [
      { label: 'Administration', sub: 'Gestion · actif', icon: Settings, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/admin' },
      { label: 'Support', sub: 'Tickets · 3 ouverts', icon: LifeBuoy, iconBg: 'bg-rose-100 text-rose-500', href: '/dashboard/support/admin' },
      { label: 'Classes', sub: 'Admin · actif', icon: GraduationCap, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/admin' },
      { label: 'Annuaire', sub: 'Comptes · actif', icon: Database, iconBg: 'bg-emerald-100 text-emerald-500', href: '/dashboard/annuaire' },
    ],
    coordinateur: [
      { label: 'Mes classes', sub: 'Pédagogie · actif', icon: GraduationCap, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/pedagogie' },
      { label: 'Cours déposés', sub: 'Supports · fichiers', icon: BookOpen, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/pedagogie/cours' },
      { label: 'Administration', sub: 'Gestion · actif', icon: Settings, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/admin' },
      { label: 'Annuaire', sub: 'Comptes · actif', icon: Database, iconBg: 'bg-emerald-100 text-emerald-500', href: '/dashboard/annuaire' },
    ],
    staff: [
      { label: 'Administration', sub: 'Gestion · actif', icon: Settings, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/admin' },
      { label: 'Support', sub: 'Tickets · ouverts', icon: LifeBuoy, iconBg: 'bg-rose-100 text-rose-500', href: '/dashboard/support/admin' },
      { label: 'Annuaire', sub: 'Comptes · actif', icon: Database, iconBg: 'bg-emerald-100 text-emerald-500', href: '/dashboard/annuaire' },
      { label: 'Actualités', sub: 'École · récent', icon: BookOpen, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/actualites' },
    ],
    entreprise: [
      { label: 'Livret apprentissage', sub: 'Alternance · actif', icon: BookOpen, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/carriere/livret' },
      { label: 'Tripartite', sub: 'Document · ce mois', icon: Code2, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/carriere/tripartite' },
    ],
    parent: [
      { label: 'Mon enfant', sub: 'Notes · ce semestre', icon: BookOpen, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/enfant' },
      { label: 'Actualités', sub: 'École · récent', icon: BookOpen, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/actualites' },
    ],
  };
  return byRole[role] ?? [];
}

const CONTACTS = [
  { name: 'Admin', initials: 'AD', color: 'bg-[#0471a6]/15 text-[#0471a6]', role: 'Administration' },
  { name: 'Scolarité', initials: 'SC', color: 'bg-[#ac80a0]/15 text-[#ac80a0]', role: 'Scolarité' },
  { name: 'Support IT', initials: 'IT', color: 'bg-emerald-100 text-emerald-600', role: 'Informatique' },
];

// ─────────────────────────────────────────────────────────
// Notes widget (élève only)
// ─────────────────────────────────────────────────────────

type AverageMat = { matiere: string; moyenne: number; total_coefficients: number };

const FALLBACK_AVERAGES: AverageMat[] = [
  { matiere: 'Algorithmique',    moyenne: 15.5,  total_coefficients: 3   },
  { matiere: 'Mathématiques',    moyenne: 13.2,  total_coefficients: 1.5 },
  { matiere: 'Développement web',moyenne: 16.75, total_coefficients: 3   },
  { matiere: 'Bases de données', moyenne: 14.8,  total_coefficients: 2.5 },
  { matiere: 'Anglais technique',moyenne: 12.9,  total_coefficients: 2   },
];

function GradesWidget({ studentId }: { studentId: string }) {
  const [averages, setAverages] = useState<AverageMat[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('grades')
      .select('matiere, note, coefficient')
      .eq('student_id', studentId)
      .then(({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }
        const grouped: Record<string, { note: number; coefficient: number }[]> = {};
        for (const g of data as { matiere: string; note: number; coefficient: number }[]) {
          if (!grouped[g.matiere]) grouped[g.matiere] = [];
          grouped[g.matiere].push({ note: g.note, coefficient: g.coefficient });
        }
        const computed: AverageMat[] = Object.entries(grouped).map(([matiere, items]) => {
          const totalCoeff = items.reduce((s, i) => s + i.coefficient, 0);
          const moyenne    = totalCoeff > 0
            ? items.reduce((s, i) => s + i.note * i.coefficient, 0) / totalCoeff
            : 0;
          return { matiere, moyenne, total_coefficients: totalCoeff };
        }).sort((a, b) => a.matiere.localeCompare(b.matiere));
        setAverages(computed);
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="h-48 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  const displayAverages = averages.length > 0 ? averages : FALLBACK_AVERAGES;
  const totalCoeff       = displayAverages.reduce((s, a) => s + a.total_coefficients, 0);
  const generaleMoyenne  = totalCoeff > 0
    ? displayAverages.reduce((s, a) => s + a.moyenne * a.total_coefficients, 0) / totalCoeff
    : 0;

  return (
    <div className="space-y-4">
      {/* Moyenne générale */}
      <div className="rounded-3xl bg-white shadow-card border border-slate-200/70 p-4">
        <p
          className="text-[13px] font-semibold text-slate-500 mb-2"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          Moyenne générale
        </p>
        <p
          className="text-[36px] font-bold text-[#0471a6] tracking-tight leading-none"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          {generaleMoyenne.toFixed(2)}
          <span className="text-[16px] font-semibold text-slate-400">/20</span>
        </p>
      </div>

      {/* Par matière */}
      <div className="rounded-3xl bg-white shadow-card border border-slate-200/70 p-4">
        <p
          className="text-[13px] font-semibold text-slate-500 mb-3"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          Par matière
        </p>
        <div className="space-y-4">
          {displayAverages.map((a) => (
            <div key={a.matiere}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-slate-700 truncate pr-2">{a.matiere}</span>
                <span className="text-[13px] font-bold text-[#0471a6] shrink-0">{a.moyenne.toFixed(1)}/20</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full">
                <div
                  className="h-full bg-[#0471a6] rounded-full"
                  style={{ width: `${(a.moyenne / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DefaultSidebar({ userProfile }: { userProfile: UserProfile }) {
  const docs = getRecentDocs(userProfile.role);
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-0">
      {/* Card : Documents récents */}
      <div className="rounded-3xl bg-white shadow-card border border-slate-200/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Documents récents
          </p>
          <Link href="/dashboard/pedagogie" className="text-[11px] font-semibold text-[#0471a6] hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="space-y-2">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.label + doc.href}
                href={doc.href}
                className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-slate-50 transition-colors"
              >
                <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', doc.iconBg].join(' ')}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-800">{doc.label}</p>
                  <p className="truncate text-[11px] text-slate-400">{doc.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Card : Contacts campus */}
      <div className="rounded-3xl bg-white shadow-card border border-slate-200/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Contacts campus
          </p>
          <Link href="/dashboard/annuaire" className="text-[11px] font-semibold text-[#0471a6] hover:underline">
            Tous
          </Link>
        </div>
        <div className="space-y-3">
          {CONTACTS.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', c.color].join(' ')}>
                {c.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800">{c.name}</p>
                <p className="truncate text-[11px] text-slate-400">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Annuaire-specific right sidebar
// ─────────────────────────────────────────────────────────

const RECENT_CONTACTS = [
  { initials: 'IL', name: 'Inès Lefebvre',  role: 'Peer Mentor',      offline: false, bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { initials: 'ER', name: 'Evelyn Reed',    role: 'Computer Science', offline: true,  bg: 'bg-slate-100',  text: 'text-slate-400' },
];

function AnnuaireSidebarContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const deptFilter  = searchParams.get('dept')  ?? '';
  const promoFilter = searchParams.get('promo') ?? '';
  const hasFilters  = !!(deptFilter || promoFilter);

  const [stats, setStats] = useState<{ eleves: number; profs: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }),
    ]).then(([e, p]) => {
      setStats({ eleves: e.count ?? 0, profs: p.count ?? 0 });
    });
  }, []);

  const removeFilter = (key: 'dept' | 'promo') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    router.replace(pathname);
  };

  const total = (stats?.eleves ?? 0) + (stats?.profs ?? 0);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">

      {/* Section 1 : Filtres actifs */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <p className="text-[14px] font-bold text-slate-900 mb-3">Filtres actifs</p>
        {!hasFilters ? (
          <p className="text-[12px] font-medium text-slate-400">Aucun filtre actif.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {promoFilter && (
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {promoFilter}
                  <button type="button" onClick={() => removeFilter('promo')} aria-label="Retirer filtre promo">
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {deptFilter && (
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {deptFilter}
                  <button type="button" onClick={() => removeFilter('dept')} aria-label="Retirer filtre département">
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 text-[12px] font-bold text-[#0471a6] hover:underline"
            >
              Tout effacer
            </button>
          </>
        )}
      </div>

      {/* Section 2 : Résumé des effectifs */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <p className="text-[14px] font-bold text-slate-900 mb-3">Résumé des effectifs</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-500">Total Membres</span>
          <span className="text-[14px] font-bold text-slate-900">
            {stats ? total : '—'}
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: '100%' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-cyan-100/50 bg-cyan-50/50 p-2.5">
            <p className="text-[11px] font-semibold text-cyan-700">Élèves</p>
            <p className="mt-0.5 text-[18px] font-bold text-cyan-900">{stats?.eleves ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-indigo-100/50 bg-indigo-50/50 p-2.5">
            <p className="text-[11px] font-semibold text-indigo-700">Profs</p>
            <p className="mt-0.5 text-[18px] font-bold text-indigo-900">{stats?.profs ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-amber-100/50 bg-amber-50/50 p-2.5">
            <p className="text-[11px] font-semibold text-amber-700">Asst.</p>
            <p className="mt-0.5 text-[18px] font-bold text-amber-900">0</p>
          </div>
          <div className="rounded-2xl border border-rose-100/50 bg-rose-50/50 p-2.5">
            <p className="text-[11px] font-semibold text-rose-700">Admin</p>
            <p className="mt-0.5 text-[18px] font-bold text-rose-900">0</p>
          </div>
        </div>
      </div>

      {/* Section 3 : Contacts récents — flex-1 to fill remaining height */}
      <div className="flex flex-1 flex-col rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <p className="text-[14px] font-bold text-slate-900 mb-3">Contacts récents</p>
        <div className="space-y-3">
          {RECENT_CONTACTS.map((contact) => (
            <div key={contact.name} className="flex items-center gap-3">
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  contact.bg, contact.text,
                  contact.offline ? 'grayscale' : '',
                ].join(' ')}
              >
                {contact.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-900 truncate">{contact.name}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{contact.role}</p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-slate-100 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Voir tout
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Emargement-specific right sidebar
// ─────────────────────────────────────────────────────────

const RECENT_CALLS = [
  { classe: 'BTS SIO SLAM 2', time: "Aujourd'hui 09:00", presents: 24, statut: 'success' },
  { classe: 'BTS SIO SLAM 2', time: 'Hier 14:00',        presents: 22, statut: 'info'    },
  { classe: 'BTS SIO SLAM 2', time: 'Hier 08:30',        presents: 25, statut: 'success' },
  { classe: 'BTS SIO SLAM 2', time: 'lun. 30 mars',      presents: 23, statut: 'info'    },
];

function EmargementSidebarContent() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">

      {/* Section 1 — Appels Récents */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Appels Récents
          </p>
          <button type="button" className="text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            Voir tout
          </button>
        </div>
        <div className="space-y-2">
          {RECENT_CALLS.map((call, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <p className="text-[13px] font-semibold text-slate-900">{call.classe}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{call.time}</p>
              <div className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {call.presents} présents
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Statistiques du Jour */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Statistiques du Jour
          </p>
          <button type="button" className="text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            Détails
          </button>
        </div>
        <div className="space-y-3">
          {/* Total appels */}
          <div className="rounded-xl border border-slate-200/50 bg-[#f8fafc]/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[#0471a6]" aria-hidden="true" />
              <p className="text-[12px] font-medium text-slate-500">Total Appels</p>
            </div>
            <p className="text-[18px] font-semibold text-slate-900">12</p>
          </div>
          {/* Présence moyenne */}
          <div className="rounded-xl border border-slate-200/50 bg-[#f8fafc]/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#0471a6]" aria-hidden="true" />
              <p className="text-[12px] font-medium text-slate-500">Présence Moy.</p>
            </div>
            <p className="text-[18px] font-semibold text-slate-900">94%</p>
          </div>
          {/* En retard */}
          <div className="rounded-xl border border-slate-200/50 bg-[#f8fafc]/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#0471a6]" aria-hidden="true" />
              <p className="text-[12px] font-medium text-slate-500">En Retard</p>
            </div>
            <p className="text-[18px] font-semibold text-slate-900">1</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Projets-specific right sidebar
// ─────────────────────────────────────────────────────────

const RECENT_DOCS = [
  { icon: FileText,   iconBg: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',      title: 'Algorithms HW 1 Solutions',       meta: 'Mis à jour il y a 2h' },
  { icon: ScrollText, iconBg: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',      title: 'AI Ethics Research Paper Proposal', meta: 'Rendu vendredi' },
  { icon: Notebook,   iconBg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', title: 'DevOps Workshop Notes',          meta: 'Sauvegardé hier' },
  { icon: FlaskConical, iconBg: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200', title: 'Data Structures Lab Guide',   meta: 'Version 1.3' },
];

const CAMPUS_CONTACTS = [
  { initials: 'EA', bg: 'bg-blue-100 text-blue-700',   name: 'Prof. Ethan Anderson', role: 'Professeur — Informatique', ActionIcon: MessageCircle },
  { initials: 'IL', bg: 'bg-indigo-100 text-indigo-700', name: 'Inès Lefebvre',       role: 'Étudiante — Study Group Lead', ActionIcon: CalendarPlus },
  { initials: 'MD', bg: 'bg-amber-100 text-amber-700',  name: 'Marcus Dubois',        role: 'Assistant — ML Track',        ActionIcon: HelpCircle },
];

function ProjetsSidebarContent() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">

      {/* Documents récents */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <p
            className="text-[14px] font-semibold text-slate-900"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Documents récents
          </p>
          <button type="button" className="text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            Voir tout
          </button>
        </div>
        <div className="space-y-2">
          {RECENT_DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', doc.iconBg].join(' ')}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{doc.title}</p>
                  <p className="text-[12px] font-medium text-slate-500">{doc.meta}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Contacts & encadrants */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p
            className="text-[14px] font-semibold text-slate-900"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Contacts & encadrants
          </p>
          <button type="button" className="text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            Voir tout
          </button>
        </div>
        <div className="space-y-2">
          {CAMPUS_CONTACTS.map((c) => {
            const ActionIcon = c.ActionIcon;
            return (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[12px] font-bold', c.bg].join(' ')}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{c.name}</p>
                  <p className="truncate text-[12px] font-medium text-slate-500">{c.role}</p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ActionIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────

export function RightSidebar({ userProfile }: RightSidebarProps) {
  const pathname      = usePathname();
  const isAnnuaire    = pathname === '/dashboard/annuaire';
  const isNotes       = pathname === '/dashboard/pedagogie/notes';
  const isProjets     = pathname.startsWith('/dashboard/pedagogie/projets/') ||
                        pathname.startsWith('/dashboard/projets/');
  const isEmargement  = pathname === '/dashboard/pedagogie/emargement';
  const isEmargementSession = pathname.startsWith('/dashboard/emargement/session/');

  const noWrapper = isAnnuaire || isNotes || isProjets || isEmargement || isEmargementSession;

  return (
    <aside className={[
      'hidden xl:flex xl:flex-col w-[220px] shrink-0',
      noWrapper ? '' : 'rounded-3xl bg-white shadow-card border border-slate-200/70 overflow-hidden p-4',
    ].join(' ')}>
      {isAnnuaire ? (
        <Suspense fallback={<div className="flex-1 animate-pulse rounded-2xl bg-slate-100" />}>
          <AnnuaireSidebarContent />
        </Suspense>
      ) : isNotes && userProfile.role === 'eleve' ? (
        <GradesWidget studentId={userProfile.profile.id} />
      ) : isProjets || isEmargementSession ? (
        <ProjetsSidebarContent />
      ) : isEmargement ? (
        <EmargementSidebarContent />
      ) : (
        <DefaultSidebar userProfile={userProfile} />
      )}
    </aside>
  );
}
