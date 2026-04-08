'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRetroBoard } from '../actions';
import { RetroBoardColumn } from './RetroBoardColumn';
import { AddPostitForm } from './AddPostitForm';
import { ExportRetroButton } from './ExportRetroButton';
import type { RetroBoard as RetroBoardType, RetroPostit, PostitType } from '../types';
import { Lock, Unlock } from 'lucide-react';

const TYPES: PostitType[] = ['POSITIVE', 'NEGATIVE', 'IDEA'];

interface RetroBoardProps {
  board: RetroBoardType;
  initialPostits: RetroPostit[];
  currentUserId: string;
  currentUserName: string;
  isProf: boolean;
}

export function RetroBoard({ board, initialPostits, currentUserId, currentUserName, isProf }: RetroBoardProps) {
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
          // Ignorer ses propres posts (déjà ajoutés par l'update optimiste)
          if (p.author_id === currentUserId) return;
          setPostits((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [...prev, { ...p, author_name: p.is_anonymous ? 'Anonyme' : 'Nouveau' }];
          });
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <span className="text-sm font-medium text-slate-600">
            {isOpen ? 'Mur ouvert — les étudiants peuvent poster' : 'Mur fermé'}
          </span>
        </div>
        {isProf && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
              isOpen
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-[#89aae6]/40 text-[#0471a6] hover:bg-[#89aae6]/10',
            ].join(' ')}
          >
            {isOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
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

      <AddPostitForm
        boardId={board.id}
        isOpen={isOpen}
        authorName={currentUserName}
        currentUserId={currentUserId}
        onAdd={(p) => setPostits((prev) => [...prev, p as RetroPostit])}
      />

      {isProf && (
        <div className="flex justify-end">
          <ExportRetroButton postits={postits} />
        </div>
      )}
    </div>
  );
}
