'use client';

import type { AttendanceReport } from '../types';
import { AbsencesList } from './AbsencesList';

interface AttendanceReportProps {
  report: AttendanceReport;
}

export function AttendanceReport({ report }: AttendanceReportProps) {
  const { session, presents, absents, taux_presence } = report;

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-primary/10 p-4 text-center">
          <p className="text-3xl font-bold text-primary">{presents.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Présents</p>
        </div>
        <div className="rounded-xl border bg-destructive/10 p-4 text-center">
          <p className="text-3xl font-bold text-destructive">{absents.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Absents</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{taux_presence}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Taux de présence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Présents */}
        <section>
          <h3 className="mb-3 font-semibold">Présents ({presents.length})</h3>
          {presents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun élève présent.</p>
          ) : (
            <div className="space-y-2">
              {presents.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                  <span className="text-sm font-medium">
                    {r.prenom} {r.nom}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.statut_presence === 'en_retard'
                        ? 'bg-secondary/20 text-secondary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {r.statut_presence === 'en_retard' ? 'En retard' : 'Présent'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.heure_pointage).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Absents */}
        <section>
          <h3 className="mb-3 font-semibold">Absents ({absents.length})</h3>
          <AbsencesList absents={absents} sessionId={session.id} />
        </section>
      </div>
    </div>
  );
}
