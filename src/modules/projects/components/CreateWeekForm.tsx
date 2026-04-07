'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectWeek } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateWeekFormProps {
  classId: string;
}

export function CreateWeekForm({ classId }: CreateWeekFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const startDate = fd.get('start_date') as string;
    const endDate = fd.get('end_date') as string;

    setLoading(true);
    setError('');
    const result = await createProjectWeek(classId, title, startDate, endDate);
    setLoading(false);

    if (result.error) setError(result.error);
    else if (result.week) router.push(`/dashboard/projets/${result.week.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Nouvelle semaine projet</h2>

      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" placeholder="ex: Semaine Intelligence Artificielle" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Début</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Fin</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Création…' : 'Créer la semaine'}
      </Button>
    </form>
  );
}
