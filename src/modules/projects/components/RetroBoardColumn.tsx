import { PostitCard } from './PostitCard';
import type { RetroPostit, PostitType } from '../types';
import { ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';

const COLUMN_STYLES: Record<PostitType, {
  label: string;
  icon: React.ElementType;
  bg: string;
  header: string;
  dot: string;
}> = {
  POSITIVE: {
    label: 'J\'ai aimé',
    icon: ThumbsUp,
    bg: 'bg-emerald-50/60 border-emerald-200/60',
    header: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  NEGATIVE: {
    label: 'Pas aimé',
    icon: ThumbsDown,
    bg: 'bg-red-50/60 border-red-200/60',
    header: 'text-red-600',
    dot: 'bg-red-400',
  },
  IDEA: {
    label: 'Idées',
    icon: Lightbulb,
    bg: 'bg-amber-50/60 border-amber-200/60',
    header: 'text-amber-700',
    dot: 'bg-amber-400',
  },
};

interface RetroBoardColumnProps {
  type: PostitType;
  postits: (RetroPostit & { author_name?: string })[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function RetroBoardColumn({ type, postits, currentUserId, onDelete }: Readonly<RetroBoardColumnProps>) {
  const { label, icon: Icon, bg, header, dot } = COLUMN_STYLES[type];

  return (
    <div className={`flex flex-col rounded-2xl border ${bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-current/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className={`text-sm font-semibold ${header} flex items-center gap-1.5`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        </div>
        <span className="rounded-full bg-white border border-current/10 px-2 py-0.5 text-xs font-bold text-slate-600">
          {postits.length}
        </span>
      </div>

      {/* Post-its */}
      <div className="flex-1 space-y-2 p-3 min-h-[160px]">
        {postits.length === 0 ? (
          <div className="flex h-full items-center justify-center py-6">
            <p className="text-xs text-slate-400">Aucun post-it</p>
          </div>
        ) : (
          postits.map((p) => (
            <PostitCard key={p.id} postit={p} currentUserId={currentUserId} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
