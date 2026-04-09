'use client';

import { Users, Calendar } from 'lucide-react';

interface StudyGroupCardProps {
  title?: string;
  description?: string;
  memberCount?: number;
  capaciteMax?: number;
  nextSession?: string;
  onJoin?: () => void;
  isJoined?: boolean;
  isFull?: boolean;
  actions?: React.ReactNode;
}

export function StudyGroupCard({
  title = 'Groupe',
  description = '',
  memberCount = 0,
  capaciteMax,
  nextSession,
  onJoin,
  isJoined = false,
  isFull = false,
  actions,
}: StudyGroupCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Left section */}
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h3
              className="text-[16px] font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-600">
                {description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-slate-500">
              <span className="inline-flex items-center">
                {memberCount}{capaciteMax ? `/${capaciteMax}` : ''} membres
              </span>
              {nextSession && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  Prochaine session : {nextSession}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center shrink-0">
          {actions ?? (
            <button
              type="button"
              onClick={onJoin}
              disabled={isFull && !isJoined}
              className={[
                'inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-[13px] font-semibold transition-colors w-full md:w-auto',
                isJoined
                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  : isFull
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0471a6] text-white hover:bg-[#0471a6]/90',
              ].join(' ')}
            >
              {isJoined ? 'Rejoint' : isFull ? 'Complet' : 'Rejoindre'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
