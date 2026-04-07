'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLE_LABELS } from '../types';
import type { StudentProfile, TeacherProfile } from '../types';

type AnnuaireEntry =
  | { type: 'eleve'; data: StudentProfile }
  | { type: 'professeur'; data: TeacherProfile };

interface AnnuaireGridProps {
  eleves: StudentProfile[];
  professeurs: TeacherProfile[];
}

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

export function AnnuaireGrid({ eleves, professeurs }: AnnuaireGridProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'eleve' | 'professeur'>('tous');

  const entries: AnnuaireEntry[] = [
    ...eleves.map((e): AnnuaireEntry => ({ type: 'eleve', data: e })),
    ...professeurs.map((p): AnnuaireEntry => ({ type: 'professeur', data: p })),
  ];

  const filtered = entries.filter((entry) => {
    const name = `${entry.data.prenom} ${entry.data.nom}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === 'tous' || entry.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Rechercher un nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {(['tous', 'eleve', 'professeur'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {f === 'tous' ? 'Tous' : ROLE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Aucun résultat trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => {
            const { prenom, nom } = entry.data;
            const initials = getInitials(prenom, nom);
            const subtitle =
              entry.type === 'eleve'
                ? entry.data.type_parcours === 'alternant' ? 'Alternant' : 'Temps plein'
                : entry.data.matieres_enseignees.slice(0, 2).join(', ');

            return (
              <Card key={entry.data.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {prenom} {nom}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {ROLE_LABELS[entry.type]}
                    </Badge>
                    {subtitle && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
