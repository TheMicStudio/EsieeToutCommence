# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: acces-controle.spec.ts >> Contrôle d'accès — rôle Professeur >> professeur → /dashboard/pedagogie/emargement accessible (attendance.manage)
- Location: tests\e2e\acces-controle.spec.ts:48:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/pedagogie\/emargement/
Received string:  "http://localhost:3000/dashboard/pedagogie"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/dashboard/pedagogie"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]:
            - img [ref=e9]
            - generic [ref=e12]:
              - paragraph [ref=e13]: EsieeToutCommence
              - paragraph [ref=e14]: Professeur
          - button "Réduire" [ref=e15]:
            - img [ref=e16]
        - generic [ref=e18]:
          - generic [ref=e19]:
            - button "Principal" [ref=e20]:
              - generic [ref=e21]: Principal
              - img [ref=e22]
            - generic [ref=e24]:
              - link "Accueil" [ref=e25] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e27]
                - generic [ref=e32]: Accueil
              - link "Annuaire" [ref=e33] [cursor=pointer]:
                - /url: /dashboard/annuaire
                - img [ref=e35]
                - generic [ref=e40]: Annuaire
          - generic [ref=e42]:
            - button "Pédagogie" [ref=e43]:
              - generic [ref=e44]: Pédagogie
              - img [ref=e45]
            - generic [ref=e47]:
              - link "Emploi du temps" [ref=e48] [cursor=pointer]:
                - /url: /dashboard/emploi-du-temps
                - img [ref=e50]
                - generic [ref=e52]: Emploi du temps
              - link "Mes disponibilités" [ref=e53] [cursor=pointer]:
                - /url: /dashboard/pedagogie/disponibilites
                - img [ref=e55]
                - generic [ref=e58]: Mes disponibilités
              - link "Mes classes" [ref=e59] [cursor=pointer]:
                - /url: /dashboard/pedagogie
                - img [ref=e61]
                - generic [ref=e64]: Mes classes
              - link "Cours" [ref=e65] [cursor=pointer]:
                - /url: /dashboard/pedagogie/cours
                - img [ref=e67]
                - generic [ref=e69]: Cours
              - link "Projets" [ref=e70] [cursor=pointer]:
                - /url: /dashboard/projets
                - img [ref=e72]
                - generic [ref=e74]: Projets
          - generic [ref=e76]:
            - button "Communication" [ref=e77]:
              - generic [ref=e78]: Communication
              - img [ref=e79]
            - generic [ref=e81]:
              - link "Actualités" [ref=e82] [cursor=pointer]:
                - /url: /dashboard/actualites
                - img [ref=e84]
                - generic [ref=e87]: Actualités
              - link "Messagerie staff" [ref=e88] [cursor=pointer]:
                - /url: /dashboard/communication
                - img [ref=e90]
                - generic [ref=e92]: Messagerie staff
    - generic [ref=e94]:
      - generic [ref=e95]:
        - generic [ref=e96]:
          - generic [ref=e97]: Dashboard
          - img [ref=e98]
          - generic [ref=e100]: Pédagogie
        - generic [ref=e102]:
          - img [ref=e103]
          - textbox "Rechercher des cours, documents, personnes…" [ref=e106]
          - generic [ref=e107]: ⌘K
        - generic [ref=e108]:
          - button "Notifications" [ref=e109]:
            - img [ref=e110]
          - button "Messages" [ref=e114]:
            - img [ref=e115]
          - button "SB Sophie" [ref=e119] [cursor=pointer]:
            - generic [ref=e120]: SB
            - generic [ref=e121]: Sophie
            - img [ref=e122]
      - main [ref=e124]:
        - generic [ref=e125]:
          - generic [ref=e126]:
            - heading "Mes classes" [level=1] [ref=e127]
            - paragraph [ref=e128]: 0 classe assignée
          - generic [ref=e129]:
            - paragraph [ref=e130]: Aucune classe assignée
            - paragraph [ref=e131]: Contactez votre administration pour être affecté à une classe.
    - complementary [ref=e132]:
      - generic [ref=e133]:
        - generic [ref=e134]:
          - generic [ref=e135]:
            - paragraph [ref=e136]: Documents récents
            - link "Voir tout" [ref=e137] [cursor=pointer]:
              - /url: /dashboard/pedagogie
          - generic [ref=e138]:
            - link "Mes classes Pédagogie · actif" [ref=e139] [cursor=pointer]:
              - /url: /dashboard/pedagogie
              - img [ref=e141]
              - generic [ref=e144]:
                - paragraph [ref=e145]: Mes classes
                - paragraph [ref=e146]: Pédagogie · actif
            - link "Cours déposés Supports · 3 fichiers" [ref=e147] [cursor=pointer]:
              - /url: /dashboard/pedagogie/cours
              - img [ref=e149]
              - generic [ref=e151]:
                - paragraph [ref=e152]: Cours déposés
                - paragraph [ref=e153]: Supports · 3 fichiers
            - link "Base de données Matière · 2 classes" [ref=e154] [cursor=pointer]:
              - /url: /dashboard/pedagogie
              - img [ref=e156]
              - generic [ref=e160]:
                - paragraph [ref=e161]: Base de données
                - paragraph [ref=e162]: Matière · 2 classes
            - link "Algorithmes Matière · 1 classe" [ref=e163] [cursor=pointer]:
              - /url: /dashboard/pedagogie
              - img [ref=e165]
              - generic [ref=e168]:
                - paragraph [ref=e169]: Algorithmes
                - paragraph [ref=e170]: Matière · 1 classe
        - generic [ref=e171]:
          - generic [ref=e172]:
            - paragraph [ref=e173]: Contacts campus
            - link "Tous" [ref=e174] [cursor=pointer]:
              - /url: /dashboard/annuaire
          - generic [ref=e175]:
            - generic [ref=e176]:
              - generic [ref=e177]: AD
              - generic [ref=e178]:
                - paragraph [ref=e179]: Admin
                - paragraph [ref=e180]: Administration
            - generic [ref=e181]:
              - generic [ref=e182]: SC
              - generic [ref=e183]:
                - paragraph [ref=e184]: Scolarité
                - paragraph [ref=e185]: Scolarité
            - generic [ref=e186]:
              - generic [ref=e187]: IT
              - generic [ref=e188]:
                - paragraph [ref=e189]: Support IT
                - paragraph [ref=e190]: Informatique
  - alert [ref=e191]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from './helpers/auth';
  3  | 
  4  | /**
  5  |  * Parcours : Contrôle d'accès par rôle
  6  |  *
  7  |  * Vérifie que les permissions côté serveur (requirePermission / getRequestPermissions)
  8  |  * bloquent bien les accès non autorisés, sans possibilité de contournement côté client.
  9  |  *
  10 |  * Règles testées :
  11 |  *  - 'attendance.manage' requis pour la page émargement professeur
  12 |  *  - 'attendance.read_own' requis pour la page scan étudiant
  13 |  */
  14 | 
  15 | test.describe('Contrôle d\'accès — rôle Élève', () => {
  16 | 
  17 |   test.beforeEach(async ({ page }) => {
  18 |     await loginAs(page, 'student');
  19 |   });
  20 | 
  21 |   test('étudiant connecté → accède à /dashboard', async ({ page }) => {
  22 |     await page.goto('/dashboard');
  23 |     await expect(page).toHaveURL(/\/dashboard/);
  24 |     // La page doit charger du contenu (pas une page vide ou d'erreur)
  25 |     await expect(page.locator('main, [role="main"]').first()).toBeVisible();
  26 |   });
  27 | 
  28 |   test('étudiant → /dashboard/emargement/scan accessible (attendance.read_own)', async ({ page }) => {
  29 |     await page.goto('/dashboard/emargement/scan');
  30 |     await expect(page).toHaveURL(/\/emargement\/scan/);
  31 |     await expect(page.getByText('Pointer ma présence')).toBeVisible();
  32 |   });
  33 | 
  34 |   test('étudiant → /dashboard/pedagogie/emargement interdit → redirigé vers /dashboard', async ({ page }) => {
  35 |     await page.goto('/dashboard/pedagogie/emargement');
  36 |     // requirePermission('attendance.manage') redirige les non-profs vers /dashboard
  37 |     await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  38 |   });
  39 | 
  40 | });
  41 | 
  42 | test.describe('Contrôle d\'accès — rôle Professeur', () => {
  43 | 
  44 |   test.beforeEach(async ({ page }) => {
  45 |     await loginAs(page, 'teacher');
  46 |   });
  47 | 
  48 |   test('professeur → /dashboard/pedagogie/emargement accessible (attendance.manage)', async ({ page }) => {
  49 |     await page.goto('/dashboard/pedagogie/emargement');
> 50 |     await expect(page).toHaveURL(/\/pedagogie\/emargement/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  51 |     // La section "Lancer un appel" doit être présente
  52 |     await expect(page.getByText('Lancer un appel')).toBeVisible();
  53 |   });
  54 | 
  55 |   test('professeur → /dashboard/emargement/scan redirigé (pas de attendance.read_own)', async ({ page }) => {
  56 |     await page.goto('/dashboard/emargement/scan');
  57 |     // Les profs n'ont pas attendance.read_own → redirect dashboard
  58 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  59 |     await expect(page).not.toHaveURL(/\/emargement\/scan/);
  60 |   });
  61 | 
  62 | });
  63 | 
```