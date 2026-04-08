'use client';

import { useState } from 'react';
import { joinGroup, leaveGroup } from '../actions';
import { UserPlus, UserMinus } from 'lucide-react';

interface JoinGroupButtonProps {
  groupId: string;
  weekId: string;
  isMember: boolean;
  isFull: boolean;
}

export function JoinGroupButton({ groupId, weekId, isMember, isFull }: JoinGroupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optimisticMember, setOptimisticMember] = useState(isMember);

  async function handleToggle() {
    setLoading(true);
    setError('');
    setOptimisticMember(!optimisticMember);

    const result = optimisticMember
      ? await leaveGroup(groupId, weekId)
      : await joinGroup(groupId, weekId);

    setLoading(false);
    if (result.error) {
      setOptimisticMember(optimisticMember);
      setError(result.error);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={loading || (!optimisticMember && isFull)}
        onClick={handleToggle}
        className={[
          'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
          optimisticMember
            ? 'border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            : 'bg-[#0471a6] text-white hover:bg-[#0471a6]/90',
          (loading || (!optimisticMember && isFull)) ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {optimisticMember
          ? <><UserMinus className="h-4 w-4" />{loading ? '…' : 'Quitter le groupe'}</>
          : <><UserPlus className="h-4 w-4" />{loading ? '…' : isFull ? 'Groupe complet' : 'Rejoindre'}</>
        }
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
