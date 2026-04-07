import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Grade } from '../types';

interface GradeBookProps {
  grades: Grade[];
}

function noteBadgeVariant(note: number): 'default' | 'secondary' | 'destructive' {
  if (note >= 14) return 'default';
  if (note >= 10) return 'secondary';
  return 'destructive';
}

export function GradeBook({ grades }: GradeBookProps) {
  if (grades.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Aucune note enregistrée.</p>
      </div>
    );
  }

  // Grouper par matière
  const grouped = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    if (!acc[g.matiere]) acc[g.matiere] = [];
    acc[g.matiere].push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([matiere, items]) => {
        const moyenne =
          items.reduce((sum, g) => sum + g.note * g.coefficient, 0) /
          items.reduce((sum, g) => sum + g.coefficient, 0);

        return (
          <div key={matiere}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{matiere}</h3>
              <span className={`text-sm font-medium ${noteBadgeVariant(moyenne) === 'destructive' ? 'text-destructive' : 'text-primary'}`}>
                Moyenne : {moyenne.toFixed(2)}/20
              </span>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen</TableHead>
                    <TableHead className="text-right">Note</TableHead>
                    <TableHead className="text-right">Coeff.</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.examen}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={noteBadgeVariant(g.note)}>
                          {g.note}/20
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">×{g.coefficient}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(g.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
