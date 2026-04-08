'use client';

import Link from 'next/link';
import { BookOpen, Cpu, Code2, Database, GraduationCap, LifeBuoy, Settings } from 'lucide-react';
import type { UserProfile } from '@/modules/auth/types';

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
    entreprise: [
      { label: 'Livret apprentissage', sub: 'Alternance · actif', icon: BookOpen, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/carriere/livret' },
      { label: 'Tripartite', sub: 'Document · ce mois', icon: Code2, iconBg: 'bg-purple-100 text-purple-500', href: '/dashboard/carriere/tripartite' },
    ],
    parent: [
      { label: 'Mon enfant', sub: 'Notes · ce semestre', icon: BookOpen, iconBg: 'bg-blue-100 text-blue-500', href: '/dashboard/enfant' },
      { label: 'Actualités', sub: 'École · récent', icon: BookOpen, iconBg: 'bg-amber-100 text-amber-500', href: '/dashboard/actualites' },
    ],
  };
  return byRole[role];
}

const CONTACTS = [
  { name: 'Admin', initials: 'AD', color: 'bg-[#0471a6]/15 text-[#0471a6]', role: 'Administration' },
  { name: 'Scolarité', initials: 'SC', color: 'bg-[#ac80a0]/15 text-[#ac80a0]', role: 'Scolarité' },
  { name: 'Support IT', initials: 'IT', color: 'bg-emerald-100 text-emerald-600', role: 'Informatique' },
];

export function RightSidebar({ userProfile }: RightSidebarProps) {
  const docs = getRecentDocs(userProfile.role);

  return (
    <div className="hidden xl:flex xl:flex-col w-[220px] shrink-0 gap-4">
      {/* Card : Documents récents */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Documents récents
          </p>
          <Link
            href="/dashboard/pedagogie"
            className="text-[11px] font-semibold text-[#0471a6] hover:underline"
          >
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
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Contacts campus
          </p>
          <Link
            href="/dashboard/annuaire"
            className="text-[11px] font-semibold text-[#0471a6] hover:underline"
          >
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
