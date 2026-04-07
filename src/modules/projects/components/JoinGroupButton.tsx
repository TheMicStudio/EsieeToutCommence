'use client';

import { useState } from 'react';
import { joinGroup, leaveGroup } from '../actions';
import { Button } from '@/components/ui/button';

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
      setOptimisticMember(optimisticMember); // rollback
      setError(result.error);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant={optimisticMember ? 'outline' : 'default'}
        disabled={loading || (!optimisticMember && isFull)}
        onClick={handleToggle}
        className="w-full"
      >
        {loading ? '…' : optimisticMember ? 'Quitter le groupe' : 'Rejoindre'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
