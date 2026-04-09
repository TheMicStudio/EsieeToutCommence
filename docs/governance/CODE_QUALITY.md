# CODE_QUALITY.md — Règles de qualité de code

**Ref :** US28  
**Dernière mise à jour :** 2026-04-09  
**Scope :** tout le code produit dans ce dépôt (humains et IA)

> Ces règles s'appliquent à chaque Pull Request et à chaque session de vibe coding.  
> Toute exception **doit** être documentée avec un commentaire `// EXCEPTION: raison`.

---

## 1. Lisibilité

### 1.1 Nommage — règles absolues

| Contexte | Convention | Exemple correct |
|---|---|---|
| Variables / fonctions | `camelCase` | `activeClass`, `getMyTeacherSessions` |
| Types / Interfaces | `PascalCase` | `AttendanceSession`, `UserProfile` |
| Constantes de module | `SCREAMING_SNAKE` | `FALLBACK_AVERAGES`, `COLOR_CLS` |
| Fichiers composants | `PascalCase.tsx` | `StartSessionForm.tsx` |
| Fichiers utilitaires | `kebab-case.ts` | `api_contract.md`, `permissions.ts` |
| Tables Supabase | `snake_case` | `attendance_sessions`, `doc_folders` |

**Interdits :**
```ts
// ❌ Noms génériques sans contexte
const data = await supabase.from('classes').select();
const res  = await createAttendanceSession(id, d);
const tmp  = teacherClasses[0];

// ✅ Noms qui racontent leur rôle
const allClasses    = await supabase.from('classes').select();
const result        = await createAttendanceSession(classId, durationMin);
const defaultClass  = teacherClasses[0];
```

### 1.2 Longueur des fonctions

- **Règle :** une fonction = une responsabilité = lisible en moins de 40 lignes.
- Au-delà, extraire dans une fonction nommée (pas une closure anonyme).

```ts
// ❌ Trop dense, pas de séparation
export async function NotesPage({ searchParams }) {
  // 80 lignes mélangant auth + fetch + calcul + rendu
}

// ✅ Calcul isolé dans une fonction nommée
function computeClassAverages(grades: Grade[]): MatiereMoyenne[] { ... }

export async function NotesPage() {
  const grades    = await getClassGrades(activeClass.id);
  const averages  = computeClassAverages(grades);
  return <GradeView averages={averages} />;
}
```

### 1.3 Imbrication (nesting)

- Maximum **3 niveaux** d'imbrication dans une fonction.
- Au-delà, extraire ou utiliser des early returns.

```ts
// ❌ Pyramide de mort
if (user) {
  if (session) {
    if (session.statut === 'ouvert') {
      if (session.expiration > now) {
        // logique
      }
    }
  }
}

// ✅ Early returns
if (!user)                           return { error: 'Non authentifié' };
if (!session)                        return { error: 'Session introuvable' };
if (session.statut !== 'ouvert')     return { error: 'Session fermée' };
if (session.expiration <= now)       return { error: 'Session expirée' };
// logique principale ici
```

---

## 2. Duplication

### 2.1 Règle des 3

> Si un bloc de code identique apparaît **3 fois ou plus**, il devient une fonction ou une constante partagée.

```ts
// ❌ Dupliqué dans 3 composants
className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm..."

// ✅ Constante de module
const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 ...';
// Réelle dans : StartSessionForm.tsx, WeekCourseMaterialsPanel.tsx
```

### 2.2 Pas de copie d'actions entre modules

Les Server Actions ne se copient pas. Si le Module A a besoin de données du Module B, il **importe l'action** du Module B ou utilise l'unique point d'entrée public.

```ts
// ❌ Copier-coller d'une requête Supabase d'un autre module
const { data } = await supabase.from('classes').select().eq('id', classId);

// ✅ Appeler l'action publique du module concerné
import { getMyTeacherClasses } from '@/modules/pedagogy/actions';
const classes = await getMyTeacherClasses();
```

### 2.3 Seul point d'entrée inter-modules

```ts
// L'unique import autorisé entre modules (réf. AI_PROTOCOL.md)
import { getCurrentUserProfile } from '@/modules/auth/actions';
```

---

## 3. Complexité

### 3.1 Cyclomatic complexity

- **Max 10** chemins logiques par fonction (if/else, switch, boucles, ternaires).
- Un switch sur le rôle utilisateur avec 7 cas = 7 branches = à la limite. Ne pas en ajouter.

```ts
// ⚠️ Déjà à la limite — ne pas ajouter de cas sans extraire
if (role === 'eleve') { ... }
else if (role === 'professeur' || role === 'coordinateur') { ... }
else if (role === 'admin' || role === 'staff') { ... }
else if (role === 'entreprise') { ... }
else if (role === 'parent') { ... }
// Réel dans : src/modules/auth/actions.ts — signUp()
```

### 3.2 Conditions complexes → variables nommées

```ts
// ❌ Condition illisible
if (elapsed > (expTime.getTime() - openTime.getTime()) / 60000 * 0.5) { ... }

// ✅ Variables qui racontent la logique métier
const totalMinutes = (expTime.getTime() - openTime.getTime()) / 60000;
const elapsedMin   = (now.getTime() - openTime.getTime()) / 60000;
const isLate       = elapsedMin > totalMinutes * 0.5;
// Réel dans : src/app/api/attendance/checkin/route.ts
```

### 3.3 Pas de magie numérique

```ts
// ❌ Magic numbers
if (file.size > 50 * 1024 * 1024) { ... }  // que signifie ce calcul ?
if (crumbs.length < 20) { ... }             // pourquoi 20 ?

// ✅ Constante nommée
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo — limite storage Supabase
const MAX_BREADCRUMB_DEPTH = 20;              // sécurité anti-boucle infinie

// EXCEPTION actuelle : ces deux valeurs sont en dur dans documents/actions.ts
// Raison : valeurs stables, extraction prévue si changement de plan storage
```

---

## 4. Séparation des responsabilités

### 4.1 Server Components vs Client Components

| Responsabilité | Où |
|---|---|
| Fetch de données, auth, permissions | Server Component (`.tsx` sans `'use client'`) |
| Interactivité (state, événements, hooks) | Client Component (`'use client'` en tête de fichier) |
| Mutations, accès BDD | Server Action (`'use server'` dans `actions.ts`) |
| Accès direct à Supabase | **Jamais dans un composant** — toujours via une action |

```ts
// ❌ Accès BDD dans un composant Client
'use client';
const { data } = await supabase.from('grades').select(); // INTERDIT

// ✅ La page Server Component fetch, le composant Client affiche
// page.tsx (Server)
const grades = await getClassGrades(activeClass.id);
return <GradeBook grades={grades} />;

// GradeBook.tsx (Client)
'use client';
export function GradeBook({ grades }: { grades: Grade[] }) { ... }
```

### 4.2 Un fichier = une responsabilité

| Fichier | Contient |
|---|---|
| `actions.ts` | Server Actions uniquement |
| `types/index.ts` | Interfaces TypeScript uniquement |
| `components/Foo.tsx` | Un seul composant exporté |
| `page.tsx` | Orchestration + rendu, pas de logique métier |
| `lib/permissions.ts` | Système de permissions uniquement |

### 4.3 Client admin Supabase — usage strict

Le client admin bypass la RLS. Il ne doit être utilisé que dans ces deux cas :

1. **Vérification d'identité faite avant** (`auth.getUser()` d'abord, client admin ensuite)
2. **Impossibilité technique** de passer par le client anon (ex : prof qui liste les membres d'une classe)

```ts
// ✅ Pattern correct (réel dans lib/permissions.ts)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser(); // identité vérifiée
if (!user) return null;

const admin = createAdminClient();  // admin utilisé APRÈS vérification
const { data } = await admin.from('user_roles').select(...);
```

---

## 5. Règles sur les commentaires

### 5.1 Ce qui est INTERDIT

```ts
// ❌ Commentaire décoratif (dit ce que le code dit déjà)
// On vérifie si l'utilisateur est authentifié
if (!user) return null;

// ❌ Commentaire mensonger (ne correspond plus au code)
// Retourne true si l'email est valide
function checkEmail(email: string) {
  return email.includes('@') && email.length > 5; // validation très partielle
}

// ❌ Code mort commenté (utiliser git pour l'historique)
// const oldQuery = supabase.from('old_table').select();

// ❌ Marqueurs vides sans contenu
// TODO
// FIXME
```

### 5.2 Ce qui est OBLIGATOIRE

#### Pourquoi, pas quoi

```ts
// ✅ Explique la décision non évidente
/**
 * Wrappé dans cache() : une seule requête DB par render, peu importe
 * combien de pages/layouts l'appellent.
 */
export const getRequestPermissions = cache(async (): Promise<Set<string>> => { ... });
// Réel dans : src/lib/permissions.ts
```

#### Zones contre-intuitives

```ts
// ✅ Explique un comportement inattendu
// Utilise le client admin pour contourner les limites de signUp :
// Supabase bloque l'inscription si l'email n'est pas confirmé par SMTP,
// ce qui est impossible en dev sans serveur mail configuré.
const admin = createAdminClient();
const { data: authData } = await admin.auth.admin.createUser({ email_confirm: true });
// Réel dans : src/modules/auth/actions.ts — signUp()
```

#### Exceptions documentées

```ts
// EXCEPTION: la RLS bloque les profs pour lire class_members (ils ne sont pas membres)
// On utilise donc le client admin ici, identité vérifiée via getAttendanceSession() avant.
const { createAdminClient } = await import('@/lib/supabase/admin');
// Réel dans : src/modules/attendance/actions/index.ts — getAbsentees()
```

#### TODO avec ticket

```ts
// TODO(US32): extraire MAX_FILE_SIZE_BYTES en variable d'environnement
// quand le plan storage change (actuellement limité à 50 Mo)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
```

### 5.3 Commentaires de séparation de sections (autorisés, pas obligatoires)

```ts
// ── Dossiers ──────────────────────────────────────────────────────────────────
// ── Fichiers ──────────────────────────────────────────────────────────────────
// ── Permissions ───────────────────────────────────────────────────────────────
```

Ces séparateurs visuels sont autorisés dans les fichiers `actions.ts` longs (>100 lignes).  
**Pas de tirets dans les composants courts.**

---

## 6. Zones complexes identifiées dans ce projet

Ces zones existent déjà et nécessitent une attention particulière lors de toute modification.

### Zone 1 — Système de permissions (`src/lib/permissions.ts`)

**Pourquoi complexe :** deux niveaux de permissions (rôle + override individuel), fusionnés avec priorité aux overrides. Un override `enabled: false` retire une permission de rôle.

**Risque :** une requête Supabase sans cache peut déclencher N+1 appels si appelée dans plusieurs layouts. Le `cache()` de React est essentiel ici.

**Règle :** ne jamais appeler `getUserPermissions()` directement depuis une page — utiliser `getRequestPermissions()` qui est cachée.

---

### Zone 2 — Client admin vs client anon (`src/lib/supabase/`)

**Pourquoi complexe :** deux clients Supabase avec des droits radicalement différents. Le client admin ignore toute RLS.

**Risque :** utiliser le client admin sans vérifier l'identité au préalable expose des données à des utilisateurs non authentifiés.

**Règle :** toujours appeler `supabase.auth.getUser()` avec le client anon **avant** d'utiliser le client admin. Voir pattern dans `lib/permissions.ts`.

---

### Zone 3 — Expiration QR Code (`src/app/api/attendance/checkin/route.ts`)

**Pourquoi complexe :** la logique `present` / `en_retard` dépend d'un ratio temporel (50% de la durée), pas d'une heure fixe.

**Risque :** si la durée de session est modifiée après ouverture (cas non prévu actuellement), le calcul devient incohérent.

**Règle :** toujours calculer `totalMin` et `elapsedMin` depuis `created_at` et `expiration` de la session — jamais depuis un paramètre client.

---

### Zone 4 — Lien de partage documentaire (`src/modules/documents/actions.ts`)

**Pourquoi complexe :** `resolveShareLink` est publique (sans auth), incrémente un compteur, et retourne soit un fichier soit une liste selon la cible du lien.

**Risque :** si l'incrémentation du compteur échoue silencieusement, `max_uses` n'est jamais atteint.

**Règle :** ne pas modifier la logique `uses_count` sans tester le cas `max_uses: 1` explicitement.

---

### Zone 5 — Cascade de rôles dans `signUp` (`src/modules/auth/actions.ts`)

**Pourquoi complexe :** création en 3 étapes atomiques (Auth user → user_roles → profil spécifique). Si l'étape 3 échoue, un rollback manuel `deleteUser` est déclenché.

**Risque :** si un nouveau rôle est ajouté sans branche correspondante dans la cascade, aucun profil n'est créé et l'utilisateur reste dans un état incohérent (Auth user sans profil).

**Règle :** tout nouveau rôle dans `RolePrincipal` nécessite une branche dans `signUp`, `getCurrentUserProfile`, et `updateProfile`.

---

## 7. Checklist avant chaque PR / commit

```
[ ] Aucune variable nommée data, res, tmp, result sans contexte
[ ] Aucun bloc > 40 lignes sans extraction
[ ] Aucun accès Supabase direct dans un composant Client
[ ] Le client admin n'est utilisé qu'après vérification d'identité
[ ] Aucun commentaire décoratif ("On fait X" quand le code fait X)
[ ] Les zones complexes touchées ont leurs commentaires mis à jour
[ ] Toute exception aux règles est documentée avec // EXCEPTION: raison
[ ] Aucun TODO sans référence à un ticket (US, fix, chore)
[ ] Aucun code mort commenté (supprimer ou garder, mais pas les deux)
```

---

## 8. Exemples de référence dans ce projet

| Règle | Bon exemple existant | Fichier |
|---|---|---|
| Commentaire "pourquoi" | JSDoc sur `getRequestPermissions` | `src/lib/permissions.ts:6` |
| Client admin post-auth | Pattern auth → admin | `src/lib/permissions.ts:26` |
| Early returns | Checks successifs dans `checkin/route.ts` | `src/app/api/attendance/checkin/route.ts:6` |
| Constante de module | `inputCls` | `src/modules/projects/components/WeekCourseMaterialsPanel.tsx:12` |
| Exception documentée | Import admin dynamique | `src/modules/attendance/actions/index.ts:112` |
| Séparateurs de sections | `// ── Dossiers ───` | `src/modules/documents/actions.ts` |

---

## 9. Audit initial — état du projet au 2026-04-09

Audit réalisé après rédaction de ces règles. Violations confirmées par lecture du code.

### Violations corrigées immédiatement

| Violation | Fichier | Correction |
|---|---|---|
| Variable `e` au lieu de `updateError` (×5) | `src/modules/auth/actions.ts:281-317` | Renommage `updateError` |
| Magic number `50 * 1024 * 1024` | `src/modules/documents/actions.ts` | Constante `MAX_FILE_SIZE_BYTES` |
| Magic number `3600` (1h) | `src/modules/documents/actions.ts` | Constante `SIGNED_URL_TTL_SHORT` |
| Magic number `86400` (24h) | `src/modules/documents/actions.ts` | Constante `SIGNED_URL_TTL_PUBLIC` |
| Magic number `20` (profondeur) | `src/modules/documents/actions.ts` | Constante `MAX_BREADCRUMB_DEPTH` |
| Supabase client sans commentaire d'exception | `AttendanceCounter.tsx`, `RightSidebar.tsx` | `// EXCEPTION(US28): ...` ajouté |

### Violations structurelles — à ne pas aggraver

| Fichier | Taille | Action requise |
|---|---|---|
| `src/app/dashboard/admin/UsersPanel.tsx` | 634 lignes | Découper en `CreateUserForm`, `EditUserForm`, `UsersTable` |
| `src/app/dashboard/page.tsx` | 508 lignes | Extraire composants par rôle |
| `src/modules/pedagogy/components/CourseGrid.tsx` | 442 lignes | Séparer grid / formulaire / filtres |
| `src/modules/auth/components/AnnuaireGrid.tsx` | 438 lignes | Séparer filtrage / tabs / rendu |
| `src/modules/projects/actions.ts — getAllAccessibleWeekMaterials` | 75 lignes | Extraire helpers fetch + mapping |

### Exceptions validées

| Fichier | Règle contournée | Justification |
|---|---|---|
| `AttendanceCounter.tsx` | Supabase client dans Client Component | Realtime WebSocket — impossible côté serveur |
| `RightSidebar.tsx` | Supabase client dans Client Component | Widgets à données variables — re-render serveur disproportionné |
| `documents/actions.ts — getAllFolders` | Client admin sans auth guard | Utilisé uniquement par `requireDocAccess()` qui vérifie le rôle |

---

## 10. Localisation des tests (US29 + US30)

**Commandes :**
```bash
npm test               # CI / lancement unique
npm run test:watch     # développement (hot reload)
npm run test:coverage  # rapport de couverture
```

**Fichiers de test :**

| Fichier de test | Fonction / module testé | Cas couverts |
|---|---|---|
| `src/lib/utils/__tests__/time.test.ts` | `timeAgo()` | min, h, j, date formatée, 3 frontières exactes |
| `src/lib/utils/__tests__/attendance.test.ts` | `computeAttendanceStatus()` | présent, en_retard, frontière 50 %, session courte |
| `src/modules/documents/lib/__tests__/permissions.test.ts` | `canWrite()`, `canAdmin()`, `resolveFolderPermission()` | individuel > rôle > défaut admin |
| `src/app/api/attendance/checkin/__tests__/route.test.ts` | `POST /api/attendance/checkin` | 400, 401, 404, 200 présent, 200 en_retard, 409, 500 |

**Utilitaires extraits pour la testabilité :**

| Fichier | Exportation | Utilisé par |
|---|---|---|
| `src/lib/utils/time.ts` | `timeAgo()` | `WeekCourseMaterialsPanel.tsx` |
| `src/lib/utils/attendance.ts` | `computeAttendanceStatus()` | `api/attendance/checkin/route.ts` |

---

**Tests de parcours E2E — Playwright (US30) :**

```bash
npm run test:e2e       # parcours complets (nécessite l'app démarrée)
npm run test:e2e:ui    # mode interface Playwright (debug visuel)
```

| Fichier de test | Parcours couvert | Cas |
|---|---|---|
| `tests/e2e/auth.spec.ts` | Login étudiant/prof, mauvais MdP, redirect non-auth | nominal + 3 erreurs |
| `tests/e2e/acces-controle.spec.ts` | Étudiant bloqué sur page prof, prof bloqué sur scan étudiant | 4 scénarios rôles |
| `tests/e2e/checkin-api.spec.ts` | Route POST checkin : sans auth, body incomplet, QR invalide | 401, 400, 404 |

**Prérequis pour lancer les E2E localement :**
```bash
npm run build && npm start   # dans un terminal
npm run test:e2e             # dans un autre
```

> Toute nouvelle règle métier critique doit être accompagnée d'un test dans le dossier `__tests__/` le plus proche (unitaire) ou dans `tests/e2e/` (parcours), ou d'une justification documentée ici.
