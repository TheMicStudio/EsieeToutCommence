'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  UserRound,
  Users,
  QrCode,
  LifeBuoy,
  Menu,
  X,
  ChevronDown,
  FolderKanban,
} from 'lucide-react';
import { signOut } from '../actions';
import { ROLE_LABELS, type UserProfile } from '../types';

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function getNavSections(role: UserProfile['role']): NavSection[] {
  const byRole: Record<UserProfile['role'], NavSection[]> = {
    eleve: [
      {
        title: 'Principal',
        items: [
          { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
          { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
        ],
      },
      {
        title: 'Pédagogie',
        items: [
          { href: '/dashboard/pedagogie', label: 'Mes cours', icon: BookOpen },
          { href: '/dashboard/projets', label: 'Projets', icon: FolderKanban },
          { href: '/dashboard/emargement', label: 'Émargement', icon: QrCode },
        ],
      },
      {
        title: 'Vie scolaire',
        items: [
          { href: '/dashboard/carriere', label: 'Carrière', icon: Briefcase },
          { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
          { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
        ],
      },
    ],
    professeur: [
      {
        title: 'Principal',
        items: [
          { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
          { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
        ],
      },
      {
        title: 'Pédagogie',
        items: [
          { href: '/dashboard/pedagogie', label: 'Mes classes', icon: GraduationCap },
          { href: '/dashboard/projets', label: 'Projets', icon: FolderKanban },
          { href: '/dashboard/emargement', label: 'Émargement', icon: QrCode },
        ],
      },
      {
        title: 'Communication',
        items: [
          { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
          { href: '/dashboard/communication', label: 'Messagerie staff', icon: MessageSquare },
        ],
      },
    ],
    admin: [
      {
        title: 'Principal',
        items: [
          { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
          { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
        ],
      },
      {
        title: 'Gestion',
        items: [
          { href: '/dashboard/support/admin', label: 'Support', icon: LifeBuoy },
          { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
        ],
      },
      {
        title: 'Communication',
        items: [
          { href: '/dashboard/communication', label: 'Messagerie staff', icon: MessageSquare },
        ],
      },
    ],
    entreprise: [
      {
        title: 'Principal',
        items: [
          { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
          { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
        ],
      },
      {
        title: 'Alternance',
        items: [
          { href: '/dashboard/carriere', label: 'Espace alternance', icon: Briefcase },
          { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
        ],
      },
    ],
    parent: [
      {
        title: 'Principal',
        items: [
          { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
          { href: '/dashboard/enfant', label: 'Mon enfant', icon: UserRound },
        ],
      },
      {
        title: 'Communication',
        items: [
          { href: '/dashboard/parent/messages', label: 'Messages école', icon: MessageSquare },
          { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
        ],
      },
    ],
  };
  return byRole[role];
}

const SECTION_ICON_COLORS = [
  'bg-blue-100 text-blue-500',
  'bg-emerald-100 text-emerald-500',
  'bg-purple-100 text-purple-500',
  'bg-amber-100 text-amber-500',
  'bg-rose-100 text-rose-500',
  'bg-indigo-100 text-indigo-500',
];

const LS_KEY = 'hub-sidebar-collapsed';

interface DashboardSidebarProps {
  userProfile: UserProfile;
}

export function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['Principal', 'Pédagogie', 'Vie scolaire', 'Gestion', 'Communication', 'Alternance'])
  );
  const pathname = usePathname();
  const { profile, role } = userProfile;
  const sections = getNavSections(role);
  const initials = getInitials(profile.prenom, profile.nom);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored !== null) setCollapsed(stored === 'true');
    } catch {}
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, String(next)); } catch {}
      return next;
    });
  }

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  let colorIdx = 0;

  // ── Contenu partagé entre desktop et mobile drawer ───────────────────────
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand + toggle */}
      <div className={[
        'flex items-center py-4 border-b border-slate-100',
        collapsed ? 'justify-center px-3' : 'justify-between px-4 gap-3',
      ].join(' ')}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0471a6]">
            <GraduationCap className="h-[18px] w-[18px] text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]">
              <GraduationCap className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-[#061826] truncate">Hub École</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          title={collapsed ? 'Développer' : 'Réduire'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1">
        {sections.map((section) => {
          const isOpen = openSections.has(section.title);
          return (
            <div key={section.title}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown className={['h-3 w-3 transition-transform', isOpen ? '' : '-rotate-90'].join(' ')} />
                </button>
              )}
              {(isOpen || collapsed) && (
                <div className="px-2 space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const colorClass = SECTION_ICON_COLORS[colorIdx++ % SECTION_ICON_COLORS.length];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={[
                          'flex items-center rounded-xl transition-all duration-150',
                          collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                          active
                            ? 'bg-[#0471a6]/10 text-[#0471a6]'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                        ].join(' ')}
                      >
                        <span className={[
                          'flex shrink-0 items-center justify-center rounded-lg',
                          collapsed ? 'h-5 w-5' : 'h-6 w-6',
                          active ? 'bg-[#0471a6]/15 text-[#0471a6]' : colorClass,
                        ].join(' ')}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                            {item.badge && !active && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ac80a0] text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
              {!collapsed && <div className="mt-1 h-px mx-4 bg-slate-100" />}
            </div>
          );
        })}
      </div>


      {/* Profile + logout */}
      <div className={[
        'border-t border-slate-100 py-3',
        collapsed ? 'flex flex-col items-center gap-2 px-2' : 'flex items-center gap-2 px-3',
      ].join(' ')}>
        {collapsed ? (
          <>
            <Link
              href="/dashboard/profile"
              title={`${profile.prenom} ${profile.nom}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#89aae6]/30 text-[#3685b5] text-xs font-bold hover:bg-[#89aae6]/50 transition-colors"
            >
              {initials}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                title="Se déconnecter"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop : card flottante ─────────────────────────── */}
      <aside
        className={[
          'hidden lg:flex lg:flex-col shrink-0 rounded-3xl bg-white shadow-card border border-slate-200/70 overflow-hidden',
          'transition-[width] duration-200',
          collapsed ? 'w-[60px]' : 'w-[220px]',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile : header bar ──────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 lg:hidden">
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

      {/* ── Mobile : drawer ──────────────────────────────────── */}
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
