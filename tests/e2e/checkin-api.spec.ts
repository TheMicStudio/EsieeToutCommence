import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers/auth';

/**
 * Parcours : Route POST /api/attendance/checkin
 *
 * Teste la route API de pointage de bout en bout, en combinant
 * navigation (pour obtenir les cookies de session) et appels API directs.
 *
 * Scénarios couverts :
 *  - 401 sans authentification
 *  - 400 avec corps incomplet
 *  - 404 avec un QR code invalide (session inexistante)
 */

const CHECKIN_URL = '/api/attendance/checkin';

test.describe('POST /api/attendance/checkin', () => {

  // ── Sans authentification ──────────────────────────────────────────────────

  test('requête sans session → 401 Non authentifié', async ({ request }) => {
    const res = await request.post(CHECKIN_URL, {
      data: { codeUnique: 'TEST-QR', deviceFingerprint: 'fp-test' },
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentifi/i);
  });

  // ── Validation des entrées ─────────────────────────────────────────────────

  test('body incomplet (codeUnique manquant) → 400', async ({ page, request }) => {
    // On récupère les cookies de session via le navigateur
    await loginAs(page, 'student');
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await request.post(CHECKIN_URL, {
      headers: { Cookie: cookieHeader },
      data: { deviceFingerprint: 'fp-test' }, // codeUnique absent
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/manquantes/i);
  });

  test('body incomplet (deviceFingerprint manquant) → 400', async ({ page, request }) => {
    await loginAs(page, 'student');
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await request.post(CHECKIN_URL, {
      headers: { Cookie: cookieHeader },
      data: { codeUnique: 'TEST-QR' }, // deviceFingerprint absent
    });
    expect(res.status()).toBe(400);
  });

  // ── Session introuvable ────────────────────────────────────────────────────

  test('QR code invalide (session inexistante) → 404', async ({ page, request }) => {
    await loginAs(page, 'student');
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await request.post(CHECKIN_URL, {
      headers: { Cookie: cookieHeader },
      data: {
        codeUnique: 'QR-INEXISTANT-00000000',
        deviceFingerprint: 'fp-test-123',
      },
    });
    expect(res.status()).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/expir|introuvable/i);
  });

});
