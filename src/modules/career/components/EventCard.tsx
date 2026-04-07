'use client';

import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { registerToEvent, unregisterFromEvent } from '../actions';
import type { CareerEvent } from '../types';

interface EventCardProps {
  event: CareerEvent;
  isRegistered: boolean;
  isEleve: boolean;
}

export function EventCard({ event, isRegistered, isEleve }: EventCardProps) {
  const dateDebut = new Date(event.date_debut);
  const isPast = dateDebut < new Date();

  async function handleToggle() {
    if (isRegistered) {
      await unregisterFromEvent(event.id);
    } else {
      await registerToEvent(event.id);
    }
  }

  return (
    <Card className={isPast ? 'opacity-60' : 'transition-all hover:border-primary/40 hover:shadow-sm'}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{event.titre}</CardTitle>
          {isPast && <Badge variant="secondary">Passé</Badge>}
          {isRegistered && !isPast && <Badge>Inscrit</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {dateDebut.toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
          {event.lieu && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.lieu}
            </div>
          )}
        </div>

        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}

        {isEleve && !isPast && (
          <form action={handleToggle}>
            <Button
              type="submit"
              size="sm"
              variant={isRegistered ? 'outline' : 'default'}
            >
              {isRegistered ? 'Se désinscrire' : 'S\'inscrire'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
