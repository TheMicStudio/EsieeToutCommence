'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, ChevronRight, MessageSquare, Settings } from 'lucide-react';
import type { UserProfile } from '@/modules/auth/types';
import Link from 'next/link';
import { SearchBar } from './SearchBar';

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

export function TopNavbar({ userProfile }: TopNavbarProps) {
  const pathname = usePathname();
  const pageName = getPageName(pathname);
  const { profile } = userProfile;
  const initials = getInitials(profile.prenom, profile.nom);

  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white px-5 py-3 shadow-card border border-slate-200/70">
      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-1.5 text-sm">
        <span className="text-slate-400">Dashboard</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-[#061826]">{pageName}</span>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ac80a0] ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          title="Messages"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          title="Paramètres"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-200" />

        {/* User */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 rounded-full px-2 py-1 hover:bg-slate-100 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#89aae6]/30 text-[#3685b5] text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-[#061826]">
            {profile.prenom}
          </span>
          <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
