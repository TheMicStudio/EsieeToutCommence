import { ExternalLink, FileText, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CourseMaterial } from '../types';

const TYPE_ICON = {
  video: Video,
  pdf: FileText,
  lien: ExternalLink,
};

const TYPE_LABEL = {
  video: 'Vidéo',
  pdf: 'PDF',
  lien: 'Lien',
};

interface CourseMaterialListProps {
  materials: CourseMaterial[];
}

export function CourseMaterialList({ materials }: CourseMaterialListProps) {
  if (materials.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Aucun support de cours pour l&apos;instant.</p>
      </div>
    );
  }

  // Grouper par matière
  const grouped = materials.reduce<Record<string, CourseMaterial[]>>((acc, m) => {
    if (!acc[m.matiere]) acc[m.matiere] = [];
    acc[m.matiere].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([matiere, items]) => (
        <div key={matiere}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {matiere}
          </h3>
          <div className="space-y-2">
            {items.map((material) => {
              const Icon = TYPE_ICON[material.type];
              return (
                <Card key={material.id} className="transition-shadow hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {material.titre}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {new Date(material.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">{TYPE_LABEL[material.type]}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
