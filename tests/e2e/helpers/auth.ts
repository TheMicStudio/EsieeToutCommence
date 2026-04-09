import type { Page } from '@playwright/test';

/** Comptes de test (credentials visibles dans LoginForm.tsx — accès rapide dev) */
export const ACCOUNTS = {
  student: { email: 'etudiant@hub-ecole.dev',    password: 'Test1234!' },
  teacher: { email: 'prof@hub-ecole.dev',         password: 'Test1234!' },
  admin:   { email: 'admin@hub-ecole.dev',        password: 'Test1234!' },
} as const;

/**
 * Connecte un utilisateur via le formulaire de login et attend
 * la redirection vers /dashboard.
 */
export async function loginAs(
  page: Page,
  role: keyof typeof ACCOUNTS,
): Promise<void> {
  const { email, password } = ACCOUNTS[role];
  await page.goto('/auth/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]:not([aria-hidden])');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}
