/**
 * Calcule le statut de présence d'un étudiant lors d'un pointage.
 *
 * Règle métier : si plus de 50 % du temps de la session est écoulé
 * au moment du scan → "en_retard", sinon → "present".
 *
 * @param openTime  Heure d'ouverture de la session
 * @param expTime   Heure d'expiration de la session
 * @param now       Heure du scan (injectée pour la testabilité)
 */
export function computeAttendanceStatus(
  openTime: Date,
  expTime: Date,
  now: Date,
): 'present' | 'en_retard' {
  const totalMin = (expTime.getTime() - openTime.getTime()) / 60_000;
  const elapsed  = (now.getTime()  - openTime.getTime()) / 60_000;
  return elapsed > totalMin * 0.5 ? 'en_retard' : 'present';
}
