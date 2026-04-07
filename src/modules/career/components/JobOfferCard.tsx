import { Briefcase, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTRAT_LABELS, type JobOffer } from '../types';

const CONTRAT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  stage: 'secondary',
  alternance: 'default',
  cdi: 'default',
  cdd: 'secondary',
};

interface JobOfferCardProps {
  offer: JobOffer;
}

export function JobOfferCard({ offer }: JobOfferCardProps) {
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{offer.titre}</CardTitle>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{offer.entreprise}</p>
            </div>
          </div>
          <Badge variant={CONTRAT_VARIANT[offer.type_contrat]}>
            {CONTRAT_LABELS[offer.type_contrat]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {offer.localisation && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {offer.localisation}
          </div>
        )}
        {offer.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{offer.description}</p>
        )}
        {offer.lien_candidature && (
          <a href={offer.lien_candidature} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2">
              Postuler <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
