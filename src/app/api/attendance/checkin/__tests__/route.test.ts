import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { POST } from '../route';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/attendance/checkin', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Session ouverte valide — expire dans 60 min, ouverte il y a 5 min */
function makeSession(overrides?: Partial<Record<string, unknown>>) {
  const now = Date.now();
  return {
    id: 'session-123',
    created_at: new Date(now - 5 * 60_000).toISOString(),
    expiration: new Date(now + 55 * 60_000).toISOString(),
    ...overrides,
  };
}

function makeSupabaseMock(
  user: { id: string } | null,
  session: Record<string, unknown> | null,
  insertError: { code?: string; message?: string } | null = null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: session });
  const insert = vi.fn().mockResolvedValue({ error: insertError });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'attendance_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          maybeSingle,
        };
      }
      if (table === 'attendance_records') {
        return { insert };
      }
      return {};
    }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/attendance/checkin', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ── Validation des entrées ──────────────────────────────────────────────────

  it('renvoie 400 si codeUnique manquant', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, null),
    );
    const res = await POST(makeRequest({ deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/manquantes/i);
  });

  it('renvoie 400 si deviceFingerprint manquant', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, null),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123' }));
    expect(res.status).toBe(400);
  });

  // ── Authentification ────────────────────────────────────────────────────────

  it('renvoie 401 si non authentifié', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock(null, null),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentifi/i);
  });

  // ── Session ─────────────────────────────────────────────────────────────────

  it('renvoie 404 si la session est introuvable ou expirée', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, null),
    );
    const res = await POST(makeRequest({ codeUnique: 'INVALID', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(404);
  });

  // ── Cas nominaux ────────────────────────────────────────────────────────────

  it('renvoie 200 avec statut "present" pour un scan dans les 50 premières %', async () => {
    // Session 60 min, ouverte il y a 5 min → dans la première moitié → present
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, makeSession(), null),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.statut).toBe('present');
  });

  it('renvoie 200 avec statut "en_retard" pour un scan après 50 % du temps', async () => {
    // Session 60 min, ouverte il y a 40 min → après la frontière → en_retard
    const now = Date.now();
    const lateSession = {
      id: 'session-456',
      created_at: new Date(now - 40 * 60_000).toISOString(),
      expiration: new Date(now + 20 * 60_000).toISOString(),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, lateSession, null),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.statut).toBe('en_retard');
  });

  // ── Cas d'erreur métier ─────────────────────────────────────────────────────

  it('renvoie 409 si l\'étudiant a déjà pointé (contrainte unique)', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, makeSession(), { code: '23505', message: 'duplicate' }),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/Déjà pointé/i);
  });

  it('renvoie 500 si l\'insertion échoue pour une raison inconnue', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ id: 'user-1' }, makeSession(), { code: '99999', message: 'unexpected' }),
    );
    const res = await POST(makeRequest({ codeUnique: 'ABC123', deviceFingerprint: 'fp-abc' }));
    expect(res.status).toBe(500);
  });
});
