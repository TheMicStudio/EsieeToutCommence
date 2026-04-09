import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

/**
 * Parcours : Authentification
 * Couvre : login nominal, login erreur, protection des routes non authentifiées.
 */

test.describe('Authentification', () => {

  // ── Cas nominal ────────────────────────────────────────────────────────────

  test('login étudiant valide → redirige vers /dashboard', async ({ page }) => {
    await loginAs(page, 'student');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login professeur valide → redirige vers /dashboard', async ({ page }) => {
    await loginAs(page, 'teacher');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Cas d'erreur ───────────────────────────────────────────────────────────

  test('login avec mauvais mot de passe → affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'etudiant@hub-ecole.dev');
    await page.fill('#password', 'MauvaisMotDePasse!');
    await page.click('button[type="submit"]:not([aria-hidden])');

    // Le message d'erreur doit apparaître dans la page (Server Action state)
    await expect(page.locator('.text-destructive')).toBeVisible({ timeout: 10_000 });
    // On reste sur la page de login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // ── Protection des routes ──────────────────────────────────────────────────

  test('accès direct à /dashboard sans auth → redirige vers /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

  test('accès direct à /dashboard/pedagogie/emargement sans auth → redirige vers login', async ({ page }) => {
    await page.goto('/dashboard/pedagogie/emargement');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

});
