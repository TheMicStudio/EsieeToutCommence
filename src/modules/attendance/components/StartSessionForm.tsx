'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAttendanceSession } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TeacherClass {
  id: string;
  nom: string;
  filiere: string;
}

interface StartSessionFormProps {
  classes: TeacherClass[];
}

export function StartSessionForm({ classes }: StartSessionFormProps) {
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await createAttendanceSession(classId, duration);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.session) {
      router.push(`/dashboard/emargement/session/${result.session.id}`);
    }
  }

  if (classes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous n&apos;êtes assigné à aucune classe pour le moment.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Lancer un appel</h2>

      <div className="space-y-2">
        <Label htmlFor="class">Classe</Label>
        <select
          id="class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} — {c.filiere}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Durée de validité du QR Code</Label>
        <div className="flex gap-3">
          {([5, 10] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                duration === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Création…' : 'Lancer l\'appel'}
      </Button>
    </form>
  );
}
