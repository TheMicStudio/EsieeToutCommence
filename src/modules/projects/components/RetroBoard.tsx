'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
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

export function RetroBoard({ board, initialPostits, currentUserId, currentUserName, isProf }: Readonly<RetroBoardProps>) {
  const [postits, setPostits] = useState<RetroPostit[]>(initialPostits);
  const [isOpen, setIsOpen] = useState(board.is_open);
  const [toggling, setToggling] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`retro-${board.id}`)
      .on('broadcast', { event: 'postit-added' }, ({ payload }) => {
        const p = payload as RetroPostit;
        setPostits((prev) => {
          // Dédoublonnage par ID (le sender a déjà ajouté via handleAdd)
          if (prev.some((x) => x.id === p.id)) return prev;
          return [...prev, p];
        });
      })
      .on('broadcast', { event: 'postit-deleted' }, ({ payload }) => {
        const { id } = payload as { id: string };
        setPostits((prev) => prev.filter((p) => p.id !== id));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [board.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle() {
    setToggling(true);
    const newState = !isOpen;
    await toggleRetroBoard(board.id, newState);
    setIsOpen(newState);
    setToggling(false);
  }

  function handleAdd(postit: RetroPostit) {
    // Mise à jour optimiste locale
    setPostits((prev) => [...prev, postit]);
    // Broadcast aux autres utilisateurs
    channelRef.current?.send({
      type: 'broadcast',
      event: 'postit-added',
      payload: postit,
    });
  }

  function handleDelete(id: string) {
    // Suppression locale immédiate
    setPostits((prev) => prev.filter((p) => p.id !== id));
    // Broadcast aux autres utilisateurs
    channelRef.current?.send({
      type: 'broadcast',
      event: 'postit-deleted',
      payload: { id },
    });
  }

  let toggleLabel: string;
  if (toggling) { toggleLabel = '…'; }
  else if (isOpen) { toggleLabel = 'Fermer le board'; }
  else { toggleLabel = 'Ouvrir le board'; }

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
            {toggleLabel}
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
        onAdd={handleAdd}
      />

    </div>
  );
}
