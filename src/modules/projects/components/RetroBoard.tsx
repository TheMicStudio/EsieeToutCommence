'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRetroBoard } from '../actions';
import { RetroBoardColumn } from './RetroBoardColumn';
import { AddPostitForm } from './AddPostitForm';
import type { RetroBoard as RetroBoardType, RetroPostit, PostitType } from '../types';

const TYPES: PostitType[] = ['POSITIVE', 'NEGATIVE', 'IDEA'];

interface RetroBoardProps {
  board: RetroBoardType;
  initialPostits: RetroPostit[];
  currentUserId: string;
  isProf: boolean;
}

export function RetroBoard({ board, initialPostits, currentUserId, isProf }: RetroBoardProps) {
  const [postits, setPostits] = useState<RetroPostit[]>(initialPostits);
  const [isOpen, setIsOpen] = useState(board.is_open);
  const [toggling, setToggling] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`retro-${board.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'retro_postits',
        filter: `board_id=eq.${board.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as RetroPostit;
          setPostits((prev) => [...prev, { ...p, author_name: p.is_anonymous ? 'Anonyme' : 'Nouveau' }]);
        } else if (payload.eventType === 'DELETE') {
          setPostits((prev) => prev.filter((p) => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setPostits((prev) => prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [board.id, supabase]);

  async function handleToggle() {
    setToggling(true);
    const newState = !isOpen;
    await toggleRetroBoard(board.id, newState);
    setIsOpen(newState);
    setToggling(false);
  }

  function handleDelete(id: string) {
    setPostits((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isOpen ? 'bg-primary' : 'bg-muted-foreground'}`} />
          <span className="text-sm font-medium text-muted-foreground">
            {isOpen ? 'Mur ouvert' : 'Mur fermé'}
          </span>
        </div>
        {isProf && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              isOpen
                ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                : 'border-primary/30 text-primary hover:bg-primary/10'
            }`}
          >
            {toggling ? '…' : isOpen ? 'Fermer le board' : 'Ouvrir le board'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((type) => (
          <RetroBoardColumn
            key={type}
            type={type}
            postits={postits.filter((p) => p.type === type)}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <AddPostitForm boardId={board.id} isOpen={isOpen} onAdd={(p) => setPostits((prev) => [...prev, p as RetroPostit])} />
    </div>
  );
}
