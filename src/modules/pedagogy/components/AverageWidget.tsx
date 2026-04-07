import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AverageByMatiere } from '../types';

interface AverageWidgetProps {
  averages: AverageByMatiere[];
}

function getProgressColor(moyenne: number): string {
  if (moyenne >= 14) return 'text-primary';
  if (moyenne >= 10) return 'text-secondary-foreground';
  return 'text-destructive';
}

export function AverageWidget({ averages }: AverageWidgetProps) {
  if (averages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune note pour l&apos;instant.
        </CardContent>
      </Card>
    );
  }

  const generaleMoyenne =
    averages.reduce((sum, a) => sum + a.moyenne * a.total_coefficients, 0) /
    averages.reduce((sum, a) => sum + a.total_coefficients, 0);

  return (
    <div className="space-y-4">
      {/* Moyenne générale */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Moyenne générale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${getProgressColor(generaleMoyenne)}`}>
            {generaleMoyenne.toFixed(2)}
            <span className="ml-1 text-base font-normal text-muted-foreground">/20</span>
          </p>
        </CardContent>
      </Card>

      {/* Par matière */}
      <div className="space-y-3">
        {averages.map((a) => (
          <div key={a.matiere} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{a.matiere}</span>
              <span className={`font-semibold ${getProgressColor(a.moyenne)}`}>
                {a.moyenne.toFixed(2)}/20
              </span>
            </div>
            <Progress value={(a.moyenne / 20) * 100} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
