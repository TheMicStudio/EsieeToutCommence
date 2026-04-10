'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, ChevronRight, LogOut, MessageSquare, Settings, UserRound } from 'lucide-react';
import type { UserProfile } from '@/modules/auth/types';
import { ROLE_LABELS } from '@/modules/auth/types';
import { signOut } from '@/modules/auth/actions';
import Link from 'next/link';
import { SearchBar } from './SearchBar';
import { useState, useRef, useEffect } from 'react';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/pedagogie': 'Pédagogie',
  '/dashboard/carriere': 'Carrière',
  '/dashboard/emargement': 'Émargement',
  '/dashboard/emargement/scan': 'Scanner QR',
  '/dashboard/support': 'Support',
  '/dashboard/support/admin': 'Support Admin',
  '/dashboard/support/nouveau': 'Nouveau ticket',
  '/dashboard/admin': 'Administration',
  '/dashboard/communication': 'Communication',
  '/dashboard/annuaire': 'Annuaire',
  '/dashboard/profile': 'Profil',
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  for (const [path, name] of Object.entries(PAGE_NAMES)) {
    if (path !== '/dashboard' && pathname.startsWith(path + '/')) return name;
  }
  return 'Accueil';
}

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

interface TopNavbarProps {
  userProfile: UserProfile;
}

export function TopNavbar({ userProfile }: Readonly<TopNavbarProps>) {
  const pathname = usePathname();
  const pageName = getPageName(pathname);
  const { profile, role } = userProfile;
  const initials = getInitials(profile.prenom, profile.nom);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="flex items-center gap-2 sm:gap-4 rounded-3xl bg-white px-4 sm:px-5 py-3 shadow-card border border-slate-200/70">
      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-1.5 text-sm min-w-0">
        <span className="hidden sm:inline text-slate-400">Dashboard</span>
        <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-[#061826] truncate">{pageName}</span>
      </div>

      {/* Search — masquée sur mobile */}
      <div className="hidden sm:flex flex-1 min-w-0">
        <SearchBar />
      </div>

      {/* Spacer mobile pour pousser les actions à droite */}
      <div className="flex-1 sm:hidden" />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ac80a0] ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          title="Messages"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-200" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl px-1 cursor-pointer py-1 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#89aae6]/30 text-[#3685b5] text-xs font-bold">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-[#061826]">
              {profile.prenom}
            </span>
            <ChevronDown className={['hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/70 bg-white shadow-lg z-50 overflow-hidden">
              {/* Identity */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#89aae6]/30 text-[#3685b5] text-sm font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#061826] truncate">
                      {profile.prenom} {profile.nom}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-[#0471a6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0471a6]">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1.5 mx-2">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex rounded-xl items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserRound className="h-4 w-4 text-slate-400" />
                  Paramètres du compte
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex rounded-xl items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Préférences
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1.5 mx-2">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer rounded-xl items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
