import { describe, it, expect } from 'vitest';
import { computeAttendanceStatus } from '../attendance';

/**
 * Règle métier : si l'étudiant scanne après 50 % du temps de la session écoulé
 * → "en_retard", sinon → "present".
 */
describe('computeAttendanceStatus()', () => {
  // Session de référence : 10h00 → 11h00 (60 min)
  const open = new Date('2026-04-09T10:00:00Z');
  const exp  = new Date('2026-04-09T11:00:00Z');

  // ── Cas nominaux ─────────────────────────────────────────────────────────────

  it('renvoie "present" quand le scan est dans la première moitié (10 min / 60 min)', () => {
    const now = new Date('2026-04-09T10:10:00Z'); // 10 min écoulées
    expect(computeAttendanceStatus(open, exp, now)).toBe('present');
  });

  it('renvoie "present" juste avant la frontière des 50 % (29 min / 60 min)', () => {
    const now = new Date('2026-04-09T10:29:00Z');
    expect(computeAttendanceStatus(open, exp, now)).toBe('present');
  });

  it('renvoie "en_retard" quand le scan est dans la seconde moitié (45 min / 60 min)', () => {
    const now = new Date('2026-04-09T10:45:00Z');
    expect(computeAttendanceStatus(open, exp, now)).toBe('en_retard');
  });

  it('renvoie "en_retard" au dernier instant de la session (60 min / 60 min)', () => {
    const now = new Date('2026-04-09T11:00:00Z');
    expect(computeAttendanceStatus(open, exp, now)).toBe('en_retard');
  });

  // ── Cas d'erreur / limites ────────────────────────────────────────────────────

  it('renvoie "en_retard" exactement à la frontière 50 % + 1 s', () => {
    const now = new Date('2026-04-09T10:30:01Z'); // 30 min 1 s
    expect(computeAttendanceStatus(open, exp, now)).toBe('en_retard');
  });

  it('renvoie "present" exactement à la frontière 50 % (elapsed === totalMin * 0.5)', () => {
    const now = new Date('2026-04-09T10:30:00Z'); // exactement 30 min
    // elapsed (30) > totalMin * 0.5 (30) → false → "present"
    expect(computeAttendanceStatus(open, exp, now)).toBe('present');
  });

  it('fonctionne pour une session courte de 15 min', () => {
    const shortOpen = new Date('2026-04-09T10:00:00Z');
    const shortExp  = new Date('2026-04-09T10:15:00Z');
    const inTime    = new Date('2026-04-09T10:06:00Z'); // 6/15 min < 50 %
    const late      = new Date('2026-04-09T10:09:00Z'); // 9/15 min > 50 %
    expect(computeAttendanceStatus(shortOpen, shortExp, inTime)).toBe('present');
    expect(computeAttendanceStatus(shortOpen, shortExp, late)).toBe('en_retard');
  });
});
