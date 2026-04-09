import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

/**
 * Parcours : Contrôle d'accès par rôle
 *
 * Vérifie que les permissions côté serveur (requirePermission / getRequestPermissions)
 * bloquent bien les accès non autorisés, sans possibilité de contournement côté client.
 *
 * Règles testées :
 *  - 'attendance.manage' requis pour la page émargement professeur
 *  - 'attendance.read_own' requis pour la page scan étudiant
 */

test.describe('Contrôle d\'accès — rôle Élève', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student');
  });

  test('étudiant connecté → accède à /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    // La page doit charger du contenu (pas une page vide ou d'erreur)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
  });

  test('étudiant → /dashboard/emargement/scan accessible (attendance.read_own)', async ({ page }) => {
    await page.goto('/dashboard/emargement/scan');
    await expect(page).toHaveURL(/\/emargement\/scan/);
    await expect(page.getByText('Pointer ma présence')).toBeVisible();
  });

  test('étudiant → /dashboard/pedagogie/emargement interdit → redirigé vers /dashboard', async ({ page }) => {
    await page.goto('/dashboard/pedagogie/emargement');
    // requirePermission('attendance.manage') redirige les non-profs vers /dashboard
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });

});

test.describe('Contrôle d\'accès — rôle Professeur', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'teacher');
  });

  test('professeur → /dashboard/pedagogie/emargement accessible (attendance.manage)', async ({ page }) => {
    await page.goto('/dashboard/pedagogie/emargement');
    await expect(page).toHaveURL(/\/pedagogie\/emargement/);
    // La section "Lancer un appel" doit être présente
    await expect(page.getByText('Lancer un appel')).toBeVisible();
  });

  test('professeur → /dashboard/emargement/scan redirigé (pas de attendance.read_own)', async ({ page }) => {
    await page.goto('/dashboard/emargement/scan');
    // Les profs n'ont pas attendance.read_own → redirect dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/emargement\/scan/);
  });

});
