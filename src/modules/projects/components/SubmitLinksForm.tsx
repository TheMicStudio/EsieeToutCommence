'use client';

import { useState } from 'react';
import { updateGroupLinks } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubmitLinksFormProps {
  groupId: string;
  initialRepo?: string;
  initialSlides?: string;
}

export function SubmitLinksForm({ groupId, initialRepo, initialSlides }: SubmitLinksFormProps) {
  const [repo, setRepo] = useState(initialRepo ?? '');
  const [slides, setSlides] = useState(initialSlides ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (repo && !repo.startsWith('https://')) { setError('L\'URL GitHub doit commencer par https://'); return; }
    if (slides && !slides.startsWith('https://')) { setError('L\'URL Slides doit commencer par https://'); return; }

    setLoading(true);
    setError('');
    const result = await updateGroupLinks(groupId, repo, slides);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Livrables</h4>
      <div className="space-y-1.5">
        <Label htmlFor={`repo-${groupId}`} className="text-xs">GitHub</Label>
        <Input
          id={`repo-${groupId}`}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/..."
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`slides-${groupId}`} className="text-xs">Slides</Label>
        <Input
          id={`slides-${groupId}`}
          value={slides}
          onChange={(e) => setSlides(e.target.value)}
          placeholder="https://docs.google.com/..."
          className="text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-primary">Liens enregistrés !</p>}
      <Button type="submit" size="sm" disabled={loading} variant="outline" className="w-full">
        {loading ? 'Enregistrement…' : 'Déposer les livrables'}
      </Button>
    </form>
  );
}
