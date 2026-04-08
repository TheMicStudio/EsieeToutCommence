import Link from 'next/link';
import { GraduationCap, Users, Briefcase, Settings2, Building2, ShieldCheck } from 'lucide-react';

const ALL_TABS = [
  { id: 'classes',     label: 'Classes',        icon: GraduationCap, permission: 'class.manage' },
  { id: 'users',       label: 'Utilisateurs',   icon: Users,         permission: 'user.manage' },
  { id: 'alternance',  label: 'Alternance',     icon: Briefcase,     permission: 'alternance.validate' },
  { id: 'career',      label: 'Carrière',       icon: Building2,     permission: 'career_event.manage' },
  { id: 'config',      label: 'Configuration',  icon: Settings2,     permission: 'permission.manage' },
  { id: 'permissions', label: 'Permissions',    icon: ShieldCheck,   permission: 'permission.manage' },
] as const;

interface AdminTabsProps {
  activeTab: string;
  visibleTabs: ReadonlyArray<typeof ALL_TABS[number]['id']>;
}

export function AdminTabs({ activeTab, visibleTabs }: AdminTabsProps) {
  const tabs = ALL_TABS.filter((t) => visibleTabs.includes(t.id));

  return (
    <div className="flex gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/dashboard/admin?tab=${tab.id}`}
            className={[
              'flex flex-1 min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              isActive
                ? 'bg-white text-[#0471a6] shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-[#061826] hover:bg-white/60',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
