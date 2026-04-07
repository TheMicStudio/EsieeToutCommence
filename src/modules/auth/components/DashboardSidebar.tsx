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
  Menu,
  MessageSquare,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import { signOut } from '../actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ROLE_LABELS, type UserProfile } from '../types';

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

function getNavItems(role: UserProfile['role']) {
  const base = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/annuaire', label: 'Annuaire', icon: Users },
  ];

  const byRole: Record<UserProfile['role'], typeof base> = {
    eleve: [
      ...base,
      { href: '/dashboard/cours', label: 'Mes cours', icon: BookOpen },
      { href: '/dashboard/carriere', label: 'Carrière', icon: Briefcase },
      { href: '/dashboard/support', label: 'Support', icon: MessageSquare },
    ],
    professeur: [
      ...base,
      { href: '/dashboard/classes', label: 'Mes classes', icon: GraduationCap },
      { href: '/dashboard/emargement', label: 'Émargement', icon: QrCode },
      { href: '/dashboard/communication', label: 'Communication', icon: MessageSquare },
    ],
    admin: [
      ...base,
      { href: '/dashboard/support', label: 'Support', icon: MessageSquare },
      { href: '/dashboard/communication', label: 'Communication', icon: MessageSquare },
    ],
    entreprise: [
      ...base,
      { href: '/dashboard/alternance', label: 'Alternance', icon: Briefcase },
    ],
  };

  return byRole[role];
}

interface DashboardSidebarProps {
  userProfile: UserProfile;
}

export function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile, role } = userProfile;
  const navItems = getNavItems(role);
  const initials = getInitials(profile.prenom, profile.nom);

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">Hub École</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Profil + déconnexion */}
      <div className="p-4 space-y-3">
        <Link
          href="/dashboard/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {profile.prenom} {profile.nom}
            </p>
            <Badge variant="secondary" className="mt-0.5 text-xs">
              {ROLE_LABELS[role]}
            </Badge>
          </div>
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        {navContent}
      </aside>

      {/* Header mobile */}
      <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Hub École</span>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile slide-in */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-card shadow-xl lg:hidden">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
