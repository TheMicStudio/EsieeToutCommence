'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createStaffChannel } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateChannelForm() {
  const [state, action, pending] = useActionState(createStaffChannel, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">Nouveau canal</h3>
      <div className="space-y-2">
        <Label htmlFor="nom">Nom</Label>
        <Input id="nom" name="nom" placeholder="ex: Conseil pédagogique" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Input id="description" name="description" placeholder="À quoi sert ce canal ?" />
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-primary">Canal créé !</p>}
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? 'Création…' : 'Créer le canal'}
      </Button>
    </form>
  );
}
