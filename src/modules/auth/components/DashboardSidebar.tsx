'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Newspaper,

  Settings,
  Smartphone,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { signOut } from '../actions';
import { ROLE_LABELS, type UserProfile } from '../types';

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

function getNavItems(role: UserProfile['role']): NavItem[] {
  const byRole: Record<UserProfile['role'], NavItem[]> = {
    eleve: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/pedagogie', label: 'Mes cours', icon: BookOpen },
      { href: '/dashboard/pedagogie/chat', label: 'Chat', icon: MessageSquare, badge: 1 },
      { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
      { href: '/dashboard/carriere', label: 'Carrière', icon: Briefcase },
      { href: '/dashboard/support', label: 'Support', icon: Users },
    ],
    professeur: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/pedagogie', label: 'Mes classes', icon: GraduationCap },
      { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
      { href: '/dashboard/communication', label: 'Communication', icon: MessageSquare },
      { href: '/dashboard/communication/parents', label: 'Messages parents', icon: UserRound },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
    ],
    admin: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/admin', label: 'Administration', icon: Settings },
      { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
      { href: '/dashboard/support/admin', label: 'Support', icon: MessageSquare },
      { href: '/dashboard/communication', label: 'Communication', icon: MessageSquare },
      { href: '/dashboard/communication/parents', label: 'Messages parents', icon: UserRound },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
    ],
    entreprise: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
      { href: '/dashboard/carriere', label: 'Alternance', icon: Briefcase },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
    ],
    parent: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/enfant', label: 'Mon enfant', icon: UserRound },
      { href: '/dashboard/parent/messages', label: 'Messages école', icon: MessageSquare },
      { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
    ],
  };
  return byRole[role];
}

function getFavourites(role: UserProfile['role']): NavItem[] {
  const byRole: Record<UserProfile['role'], NavItem[]> = {
    eleve: [
      { href: '/dashboard/pedagogie', label: 'Mes cours', icon: BookOpen },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Map },
    ],
    professeur: [
      { href: '/dashboard/pedagogie', label: 'Mes classes', icon: GraduationCap },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Map },
    ],
    admin: [
      { href: '/dashboard/admin', label: 'Administration', icon: Settings },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Map },
    ],
    entreprise: [
      { href: '/dashboard/carriere', label: 'Alternance', icon: Briefcase },
      { href: '/dashboard/annuaire', label: 'Annuaire', icon: Map },
    ],
    parent: [
      { href: '/dashboard/enfant', label: 'Mon enfant', icon: UserRound },
      { href: '/dashboard/parent/messages', label: 'Messages', icon: MessageSquare },
    ],
  };
  return byRole[role];
}

const ICON_COLORS = [
  'bg-blue-100 text-blue-500',
  'bg-emerald-100 text-emerald-500',
  'bg-purple-100 text-purple-500',
  'bg-amber-100 text-amber-500',
  'bg-rose-100 text-rose-500',
  'bg-indigo-100 text-indigo-500',
];

interface DashboardSidebarProps {
  userProfile: UserProfile;
}

export function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { profile, role } = userProfile;
  const navItems = getNavItems(role);
  const favourites = getFavourites(role);
  const initials = getInitials(profile.prenom, profile.nom);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-[#061826]">Hub École</p>
          <p className="text-[11px] text-slate-400 leading-tight">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
        {/* FAVOURITES */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Favoris
          </p>
          <div className="space-y-0.5">
            {favourites.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <span className={['flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px]', ICON_COLORS[i % ICON_COLORS.length]].join(' ')}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* MAIN MENU */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Menu principal
          </p>
          <div className="space-y-0.5">
            {navItems.map((item, i) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-[#0471a6] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                      active
                        ? 'bg-white/20'
                        : ICON_COLORS[i % ICON_COLORS.length],
                    ].join(' ')}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && !active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ac80a0] text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#0471a6] to-[#3685b5] p-4 text-white">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <Smartphone className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold leading-tight">Obtenez l&apos;app campus</p>
          <p className="mt-1 text-[11px] text-blue-100 leading-relaxed">
            Accès rapide à vos cours, emploi du temps et notifications.
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#0471a6] hover:bg-blue-50 transition-colors"
          >
            Télécharger
          </button>
        </div>
      </div>

      {/* Profile + logout */}
      <div className="border-t border-slate-200/70 px-3 py-3 flex items-center gap-3">
        <Link
          href="/dashboard/profile"
          onClick={() => setMobileOpen(false)}
          className="flex flex-1 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors min-w-0"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#89aae6]/30 text-[#3685b5] text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">
              {profile.prenom} {profile.nom}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{profile.email ?? ROLE_LABELS[role]}</p>
          </div>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            title="Se déconnecter"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 bg-white border-r border-slate-200/60 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0471a6]">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[#061826]">Hub École</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile slide-in */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:hidden overflow-y-auto">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
