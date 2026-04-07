import Link from 'next/link';
import type { ProjectWeek } from '../types';

interface ProjectWeekCardProps {
  week: ProjectWeek;
  groupCount?: number;
}

export function ProjectWeekCard({ week, groupCount = 0 }: ProjectWeekCardProps) {
  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const now = new Date();
  const isActive = new Date(week.start_date) <= now && now <= new Date(week.end_date);

  return (
    <Link
      href={`/dashboard/projets/${week.id}`}
      className="block rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{week.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{start} → {end}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isActive && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              En cours
            </span>
          )}
          <span className="text-xs text-muted-foreground">{groupCount} groupe{groupCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  );
}
