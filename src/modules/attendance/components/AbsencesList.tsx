'use client';

interface Absent {
  student_id: string;
  nom: string;
  prenom: string;
}

interface AbsencesListProps {
  absents: Absent[];
  sessionId: string;
}

export function AbsencesList({ absents, sessionId }: AbsencesListProps) {
  function exportCsv() {
    const header = 'Prénom,Nom,ID';
    const rows = absents.map((a) => `${a.prenom},${a.nom},${a.student_id}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absences-${sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (absents.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun absent.</p>;
  }

  return (
    <div className="space-y-2">
      {absents.map((a) => (
        <div key={a.student_id} className="flex items-center rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{a.prenom} {a.nom}</span>
        </div>
      ))}
      <button
        type="button"
        onClick={exportCsv}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors"
      >
        Exporter CSV
      </button>
    </div>
  );
}
