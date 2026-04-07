import type { ProjectGroup } from '../types';
import { JoinGroupButton } from './JoinGroupButton';
import { SubmitLinksForm } from './SubmitLinksForm';
import { GradeGroupForm } from './GradeGroupForm';

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

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{group.group_name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {members.length}/{group.capacite_max} membres
            {spots > 0 ? ` · ${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}` : ' · Complet'}
          </p>
        </div>
        {group.note !== undefined && group.note !== null && (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            {group.note}/20
          </span>
        )}
      </div>

      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <span key={m.student_id} className="rounded-full bg-muted px-2.5 py-1 text-xs">
              {m.prenom} {m.nom}
            </span>
          ))}
        </div>
      )}

      {(group.repo_url || group.slides_url) && (
        <div className="flex gap-3 text-xs">
          {group.repo_url && (
            <a href={group.repo_url} target="_blank" rel="noopener noreferrer"
              className="text-primary underline underline-offset-4">GitHub</a>
          )}
          {group.slides_url && (
            <a href={group.slides_url} target="_blank" rel="noopener noreferrer"
              className="text-primary underline underline-offset-4">Slides</a>
          )}
        </div>
      )}

      {group.feedback_prof && (
        <p className="rounded-lg bg-secondary/10 p-3 text-sm italic text-muted-foreground">
          {group.feedback_prof}
        </p>
      )}

      <div className="space-y-3 border-t pt-3">
        {!isProf && (
          <JoinGroupButton
            groupId={group.id}
            weekId={weekId}
            isMember={isMember}
            isFull={spots <= 0}
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
  );
}
