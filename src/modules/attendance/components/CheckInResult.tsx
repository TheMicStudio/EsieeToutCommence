'use client';

interface CheckInResultProps {
  result: { success?: boolean; statut?: string; error?: string };
}

export function CheckInResult({ result }: CheckInResultProps) {
  if (result.error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
        <span className="text-4xl">✗</span>
        <p className="text-lg font-semibold text-destructive">{result.error}</p>
      </div>
    );
  }

  const isLate = result.statut === 'en_retard';

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border p-8 text-center ${
      isLate
        ? 'border-secondary/40 bg-secondary/10'
        : 'border-primary/30 bg-primary/10'
    }`}>
      <span className="text-4xl">{isLate ? '⚠' : '✓'}</span>
      <p className={`text-lg font-semibold ${isLate ? 'text-secondary-foreground' : 'text-primary'}`}>
        {isLate ? 'En retard — présence enregistrée' : 'Présence enregistrée !'}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLate
          ? 'Vous êtes marqué en retard pour cette session.'
          : 'Votre présence a bien été comptabilisée.'}
      </p>
    </div>
  );
}
