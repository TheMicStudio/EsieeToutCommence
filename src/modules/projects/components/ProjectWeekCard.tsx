import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';
import type { ProjectWeek } from '../types';

export function ProjectWeekCard({ week, groupCount = 0 }: { week: ProjectWeek; groupCount?: number }) {
  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const now = new Date();
  const isActive = new Date(week.start_date) <= now && now <= new Date(week.end_date);
  const isPast = now > new Date(week.end_date);

  return (
    <Link
      href={`/dashboard/pedagogie/projets/${week.id}`}
      className="group block rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#0471a6]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#061826] group-hover:text-[#0471a6] transition-colors">
            {week.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{start} → {end}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isActive && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              En cours
            </span>
          )}
          {isPast && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Terminée
            </span>
          )}
          {!isActive && !isPast && (
            <span className="rounded-full bg-[#89aae6]/20 px-2.5 py-0.5 text-[11px] font-medium text-[#3685b5]">
              À venir
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5" />
        <span>{groupCount} groupe{groupCount !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}
