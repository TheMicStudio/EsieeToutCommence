'use client';

import { useState } from 'react';
import { gradeGroup } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GradeGroupFormProps {
  groupId: string;
  initialNote?: number;
  initialFeedback?: string;
}

export function GradeGroupForm({ groupId, initialNote, initialFeedback }: GradeGroupFormProps) {
  const [note, setNote] = useState(String(initialNote ?? ''));
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(note);
    if (isNaN(n) || n < 0 || n > 20) { setError('Note entre 0 et 20'); return; }
    setLoading(true);
    setError('');
    const result = await gradeGroup(groupId, n, feedback);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notation</h4>
      <div className="flex gap-3">
        <div className="w-24 space-y-1.5">
          <Label htmlFor={`note-${groupId}`} className="text-xs">Note /20</Label>
          <Input
            id={`note-${groupId}`}
            type="number"
            min={0} max={20} step={0.5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`fb-${groupId}`} className="text-xs">Feedback</Label>
          <textarea
            id={`fb-${groupId}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Points forts, axes d'amélioration…"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-primary">Note enregistrée !</p>}
      <Button type="submit" size="sm" disabled={loading} className="w-full">
        {loading ? 'Enregistrement…' : 'Enregistrer la note'}
      </Button>
    </form>
  );
}
