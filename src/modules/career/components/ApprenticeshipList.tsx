import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { STATUT_LABELS, type ApprenticeshipEntry } from '../types';

const STATUT_VARIANT: Record<ApprenticeshipEntry['statut'], 'default' | 'secondary' | 'destructive'> = {
  soumis: 'secondary',
  en_revision: 'secondary',
  valide: 'default',
  refuse: 'destructive',
};

interface ApprenticeshipListProps {
  entries: ApprenticeshipEntry[];
}

export function ApprenticeshipList({ entries }: Readonly<ApprenticeshipListProps>) {
  if (entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Aucun rendu déposé pour l&apos;instant.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="transition-shadow hover:shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{entry.titre}</p>
                <Badge variant={STATUT_VARIANT[entry.statut]}>
                  {STATUT_LABELS[entry.statut]}
                </Badge>
              </div>
              {entry.description && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{entry.description}</p>
              )}
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>
                  {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
                {entry.note !== undefined && entry.note !== null && (
                  <span className="font-medium text-primary">Note : {entry.note}/20</span>
                )}
              </div>
            </div>
            <a
              href={entry.fichier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Voir
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
