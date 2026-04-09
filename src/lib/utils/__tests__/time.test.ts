import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { timeAgo } from '../time';

describe('timeAgo()', () => {
  // Référence fixe : 2026-04-09 10:00:00 UTC
  const NOW = new Date('2026-04-09T10:00:00.000Z').getTime();

  beforeEach(() => { vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  // ── Cas nominaux ─────────────────────────────────────────────────────────────

  it('renvoie "il y a 0min" pour un instant tout juste passé', () => {
    const iso = new Date(NOW - 30_000).toISOString(); // 30 s
    expect(timeAgo(iso)).toBe('il y a 0min');
  });

  it('renvoie les minutes pour moins de 60 min', () => {
    const iso = new Date(NOW - 5 * 60_000).toISOString(); // 5 min
    expect(timeAgo(iso)).toBe('il y a 5min');
  });

  it('renvoie les heures pour 1 h à moins de 24 h', () => {
    const iso = new Date(NOW - 3 * 3_600_000).toISOString(); // 3 h
    expect(timeAgo(iso)).toBe('il y a 3h');
  });

  it('renvoie les jours pour 1 j à moins de 7 j', () => {
    const iso = new Date(NOW - 4 * 86_400_000).toISOString(); // 4 j
    expect(timeAgo(iso)).toBe('il y a 4j');
  });

  it('renvoie une date formatée pour 7 j ou plus', () => {
    const iso = new Date(NOW - 10 * 86_400_000).toISOString(); // 10 j
    const result = timeAgo(iso);
    // Format "d mois" en fr-FR, ex : "30 mars" ou "2 avr." (point possible)
    expect(result).toMatch(/^\d{1,2} \w+\.?$/);
  });

  // ── Cas limites ───────────────────────────────────────────────────────────────

  it('bascule en heures exactement à 60 min', () => {
    const iso = new Date(NOW - 60 * 60_000).toISOString();
    expect(timeAgo(iso)).toBe('il y a 1h');
  });

  it('bascule en jours exactement à 24 h', () => {
    const iso = new Date(NOW - 24 * 3_600_000).toISOString();
    expect(timeAgo(iso)).toBe('il y a 1j');
  });

  it('bascule en date formatée exactement à 7 j', () => {
    const iso = new Date(NOW - 7 * 86_400_000).toISOString();
    const result = timeAgo(iso);
    // Format "d mois" en fr-FR, ex : "30 mars" ou "2 avr." (point sur abrév.)
    expect(result).toMatch(/^\d{1,2} [\w.]+$/);
  });
});
