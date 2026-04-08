import type { ProjectGroup } from '../types';
import { JoinGroupButton } from './JoinGroupButton';
import { SubmitLinksForm } from './SubmitLinksForm';
import { GradeGroupForm } from './GradeGroupForm';
import { GitBranch, Presentation, Star } from 'lucide-react';

interface GroupCardProps {
  group: ProjectGroup;
  weekId: string;
  currentUserId: string;
  isProf: boolean;
}

export function GroupCard({ group, weekId, currentUserId, isProf }: GroupCardProps) {
  const members = group.members ?? [];
  const isMember = members.some((m) => m.student_id === currentUserId);
  const spots = group.capacite_max - members.length;
  const isFull = spots <= 0;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div>
          <p className="font-semibold text-[#061826]">{group.group_name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            <span className={isFull ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
              {members.length}/{group.capacite_max}
            </span>
            {' '}membres{isFull ? ' · Complet' : ` · ${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}`}
          </p>
        </div>
        {group.note !== undefined && group.note !== null && (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#0471a6]/10 px-3 py-1.5 shrink-0">
            <Star className="h-3.5 w-3.5 text-[#0471a6]" />
            <span className="text-sm font-bold text-[#0471a6]">{group.note}/20</span>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Membres */}
        {members.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <span
                key={m.student_id}
                className={[
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  m.student_id === currentUserId
                    ? 'bg-[#0471a6]/15 text-[#0471a6]'
                    : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {m.prenom} {m.nom}
              </span>
            ))}
          </div>
        )}

        {/* Livrables */}
        {(group.repo_url || group.slides_url) && (
          <div className="flex gap-3">
            {group.repo_url && (
              <a
                href={group.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
            {group.slides_url && (
              <a
                href={group.slides_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Presentation className="h-3.5 w-3.5" />
                Slides
              </a>
            )}
          </div>
        )}

        {/* Feedback prof */}
        {group.feedback_prof && (
          <div className="rounded-xl bg-[#89aae6]/10 px-4 py-3 text-sm italic text-slate-600">
            &ldquo;{group.feedback_prof}&rdquo;
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          {!isProf && (
            <JoinGroupButton
              groupId={group.id}
              weekId={weekId}
              isMember={isMember}
              isFull={isFull}
            />
          )}
          {isMember && !isProf && (
            <SubmitLinksForm
              groupId={group.id}
              initialRepo={group.repo_url}
              initialSlides={group.slides_url}
            />
          )}
          {isProf && (
            <GradeGroupForm
              groupId={group.id}
              initialNote={group.note}
              initialFeedback={group.feedback_prof}
            />
          )}
        </div>
      </div>
    </div>
  );
}
