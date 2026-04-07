import { PostitCard } from './PostitCard';
import type { RetroPostit, PostitType } from '../types';

const COLUMN_STYLES: Record<PostitType, { label: string; color: string }> = {
  POSITIVE: { label: 'J\'ai aimé', color: 'border-primary/30 bg-primary/5' },
  NEGATIVE: { label: 'Pas aimé', color: 'border-destructive/30 bg-destructive/5' },
  IDEA: { label: 'Idées', color: 'border-secondary/30 bg-secondary/5' },
};

interface RetroBoardColumnProps {
  type: PostitType;
  postits: RetroPostit[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function RetroBoardColumn({ type, postits, currentUserId, onDelete }: RetroBoardColumnProps) {
  const { label, color } = COLUMN_STYLES[type];

  return (
    <div className={`rounded-xl border-2 p-4 ${color}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">{postits.length}</span>
      </div>
      <div className="space-y-2">
        {postits.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Aucun post-it</p>
        ) : (
          postits.map((p) => (
            <PostitCard key={p.id} postit={p} currentUserId={currentUserId} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
