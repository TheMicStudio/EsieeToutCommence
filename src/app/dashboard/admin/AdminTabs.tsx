import Link from 'next/link';
import { GraduationCap, Users, Briefcase, Settings2, Building2 } from 'lucide-react';

const TABS = [
  { id: 'classes', label: 'Classes', icon: GraduationCap },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'alternance', label: 'Alternance', icon: Briefcase },
  { id: 'career', label: 'Carrière', icon: Building2 },
  { id: 'config', label: 'Configuration', icon: Settings2 },
] as const;

export function AdminTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 overflow-x-auto">
      {TABS.map((tab) => {
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
