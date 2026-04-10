'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGroup, leaveGroup } from '../actions';
import { UserPlus, UserMinus } from 'lucide-react';

interface JoinGroupButtonProps {
  groupId: string;
  weekId: string;
  isMember: boolean;
  isFull: boolean;
}

export function JoinGroupButton({ groupId, weekId, isMember, isFull }: Readonly<JoinGroupButtonProps>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optimisticMember, setOptimisticMember] = useState(isMember);
  const router = useRouter();

  async function handleToggle() {
    const wasMember = optimisticMember;
    setLoading(true);
    setError('');
    setOptimisticMember(!wasMember);

    const result = wasMember
      ? await leaveGroup(groupId, weekId)
      : await joinGroup(groupId, weekId);

    setLoading(false);
    if (result.error) {
      setOptimisticMember(wasMember);
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  let btnContent: React.ReactNode;
  if (optimisticMember) {
    btnContent = <><UserMinus className="h-4 w-4" />{loading ? '…' : 'Quitter le groupe'}</>;
  } else {
    const joinLabel = isFull ? 'Groupe complet' : 'Rejoindre';
    btnContent = <><UserPlus className="h-4 w-4" />{loading ? '…' : joinLabel}</>;
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
        {btnContent}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
