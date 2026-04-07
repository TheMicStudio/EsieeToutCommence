'use client';

import { useActionState, useEffect, useState } from 'react';
import { createTicket, searchFaqArticles } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FaqArticle } from '../types';

interface TicketFormProps {
  isDelegue?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function TicketForm({ isDelegue = false }: TicketFormProps) {
  const [state, action, pending] = useActionState(createTicket, null);
  const [sujet, setSujet] = useState('');
  const [suggestions, setSuggestions] = useState<FaqArticle[]>([]);
  const debouncedSujet = useDebounce(sujet, 300);

  useEffect(() => {
    if (debouncedSujet.length < 3) { setSuggestions([]); return; }
    searchFaqArticles(debouncedSujet).then(setSuggestions);
  }, [debouncedSujet]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Formulaire */}
      <form action={action} className="space-y-4 lg:col-span-2">
        <div className="space-y-2">
          <Label htmlFor="sujet">Sujet</Label>
          <Input
            id="sujet" name="sujet" value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Décrivez votre problème en quelques mots…" required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categorie">Catégorie</Label>
          <select id="categorie" name="categorie" required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sélectionner…</option>
            <option value="pedagogie">Pédagogie</option>
            <option value="batiment">Bâtiment</option>
            <option value="informatique">Informatique</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description détaillée</Label>
          <textarea id="description" name="description" rows={5} required
            placeholder="Expliquez votre problème en détail…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {isDelegue && (
          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted">
            <input type="checkbox" name="au_nom_de_classe" className="accent-primary" />
            <div>
              <p className="text-sm font-medium">Ouvrir au nom de ma classe</p>
              <p className="text-xs text-muted-foreground">En tant que délégué, ce ticket représente un problème collectif.</p>
            </div>
          </label>
        )}

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Envoi en cours…' : 'Soumettre le ticket'}
        </Button>
      </form>

      {/* Suggestions FAQ */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Réponses suggérées
        </h3>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Commencez à saisir votre sujet pour voir les suggestions de la FAQ.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((article) => (
              <div key={article.id} className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-medium">{article.question}</p>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{article.reponse}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
