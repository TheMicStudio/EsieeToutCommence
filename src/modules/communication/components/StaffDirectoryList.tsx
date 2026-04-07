'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { StaffContact } from '../types';

interface StaffDirectoryListProps {
  contacts: StaffContact[];
}

export function StaffDirectoryList({ contacts }: StaffDirectoryListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'professeur' | 'admin'>('tous');

  const filtered = contacts.filter((c) => {
    const name = `${c.prenom} ${c.nom}`.toLowerCase();
    return (filter === 'tous' || c.role === filter) && name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <div className="flex gap-2">
          {(['tous', 'professeur', 'admin'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {f === 'tous' ? 'Tous' : f === 'professeur' ? 'Professeurs' : 'Administration'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">
                  {contact.prenom[0]}{contact.nom[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{contact.prenom} {contact.nom}</p>
                <Badge variant="secondary" className="mt-0.5 text-xs">
                  {contact.role === 'professeur' ? 'Professeur' : 'Administration'}
                </Badge>
                {contact.matieres_enseignees && contact.matieres_enseignees.length > 0 && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {contact.matieres_enseignees.slice(0, 2).join(', ')}
                  </p>
                )}
                {contact.fonction && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{contact.fonction}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat.</p>
      )}
    </div>
  );
}
