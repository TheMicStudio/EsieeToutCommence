# Module Auth & Profils - Spécifications de Développement

**Assigné à :** Dev 1
**Branche Git :** `feat/T01-auth-profiles-identite`
**Règle absolue :** Interdiction stricte de modifier l'arborescence, les routes, ou la base de données des autres modules. Ce module est le CŒUR de l'application — toute modification ici impacte tout le monde. Procéder avec une rigueur maximale.

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Section 1) et `backlog.md` (US22, US23, US14, US13) :

- Mettre en place l'authentification complète via Supabase Auth (email/password).
- Créer les 4 tables de profils métier liées à `auth.users` (Student, Teacher, Admin, Company).
- Implémenter un tableau de bord dynamique qui redirige l'utilisateur selon son rôle.
- Exposer une API interne (`getCurrentUserProfile`) consommable par les autres modules **sans jamais exposer les tables directement**.
- Implémenter l'annuaire filtrable (Trombinoscope).

---

## 2. Base de Données (Supabase)

> Le fichier `docs/sql/01_init_schema.sql` contient déjà la base. Compléter avec ce qui suit.

### 2.1 Tables à créer / compléter

```sql
-- Enum rôle principal (déjà dans 01_init_schema.sql, vérifier qu'il existe)
CREATE TYPE public.role_principal AS ENUM (
  'eleve', 'professeur', 'admin', 'entreprise'
);

-- Table intermédiaire : relie auth.users à un rôle et au bon profil
CREATE TABLE public.user_roles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role           public.role_principal NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- student_profiles (déjà dans 01_init_schema.sql — compléter avec class_id FK)
-- teacher_profiles (déjà dans 01_init_schema.sql)
-- admin_profiles   (déjà dans 01_init_schema.sql)
-- company_profiles (déjà dans 01_init_schema.sql)
```

### 2.2 Row Level Security (RLS)

```sql
-- user_roles : lecture publique (pour le routage), écriture admin uniquement
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture rôle propre" ON public.user_roles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin peut tout lire" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Annuaire : les users authentifiés peuvent lire les profils (pas les données sensibles)
CREATE POLICY "Lecture annuaire eleves" ON public.student_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lecture annuaire profs" ON public.teacher_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Écriture : uniquement son propre profil
CREATE POLICY "Modifier son profil eleve" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Modifier son profil prof" ON public.teacher_profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/auth/actions.ts` | `signIn(email, password)` | Connexion via Supabase Auth |
| `src/modules/auth/actions.ts` | `signUp(email, password, role, profileData)` | Inscription + création du profil |
| `src/modules/auth/actions.ts` | `signOut()` | Déconnexion |
| `src/modules/auth/actions.ts` | `getCurrentUserProfile()` | **API interne** — retourne `{ role, profile }` |
| `src/modules/auth/actions.ts` | `updateProfile(data)` | Mise à jour du profil de l'utilisateur connecté |

> `getCurrentUserProfile()` est la **seule fonction** que les autres modules ont le droit d'importer depuis ce module.

### 3.2 Pages Next.js

| Chemin | Type | Description |
|---|---|---|
| `src/app/auth/login/page.tsx` | Page (Server) | Formulaire de connexion |
| `src/app/auth/register/page.tsx` | Page (Server) | Formulaire d'inscription |
| `src/app/auth/callback/route.ts` | Route Handler | Callback OAuth/Magic Link Supabase |
| `src/app/dashboard/page.tsx` | Page (Server) | Router dynamique selon le rôle |
| `src/app/dashboard/profile/page.tsx` | Page (Server) | Édition du profil |
| `src/app/dashboard/annuaire/page.tsx` | Page (Server) | Trombinoscope filtrable |

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/auth/components/LoginForm.tsx` | Formulaire email/password avec gestion d'erreur |
| `src/modules/auth/components/RegisterForm.tsx` | Formulaire inscription multi-étapes (rôle → profil) |
| `src/modules/auth/components/ProfileCard.tsx` | Carte de profil utilisateur (lecture) |
| `src/modules/auth/components/ProfileEditForm.tsx` | Formulaire d'édition du profil |
| `src/modules/auth/components/AnnuaireGrid.tsx` | Grille filtrée du trombinoscope |
| `src/modules/auth/components/RoleGuard.tsx` | HOC — bloque l'accès si rôle non autorisé |

### 3.4 Types TypeScript

Fichier : `src/modules/auth/types/index.ts`

```typescript
export type RolePrincipal = 'eleve' | 'professeur' | 'admin' | 'entreprise';

export interface UserRole {
  id: string;
  role: RolePrincipal;
}

export interface StudentProfile {
  id: string;
  nom: string;
  prenom: string;
  type_parcours: 'temps_plein' | 'alternant';
  role_secondaire?: 'delegue' | 'ambassadeur';
  class_id?: string;
}

export interface TeacherProfile {
  id: string;
  nom: string;
  prenom: string;
  matieres_enseignees: string[];
}

export interface AdminProfile {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
}

export interface CompanyProfile {
  id: string;
  nom: string;
  prenom: string;
  entreprise: string;
  poste?: string;
}

export type UserProfile =
  | { role: 'eleve'; profile: StudentProfile }
  | { role: 'professeur'; profile: TeacherProfile }
  | { role: 'admin'; profile: AdminProfile }
  | { role: 'entreprise'; profile: CompanyProfile };
```

### 3.5 Middleware d'authentification

Fichier : `src/middleware.ts` (racine `src/`)

```typescript
// Protège toutes les routes /dashboard/* et redirige vers /auth/login si non connecté
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter le fichier `docs/sql/01_init_schema.sql` dans Supabase Studio. Vérifier que les 5 tables (`user_roles`, `student_profiles`, `teacher_profiles`, `admin_profiles`, `company_profiles`) et les policies RLS sont créées sans erreur.
- [ ] **Étape 2 — Types** : Créer `src/modules/auth/types/index.ts` avec les interfaces ci-dessus. Compiler avec `npx tsc --noEmit` pour valider.
- [ ] **Étape 3 — Middleware** : Créer `src/middleware.ts`. Utiliser `@supabase/ssr` pour vérifier la session. Rediriger vers `/auth/login` si non connecté sur les routes `/dashboard/*`. Rediriger vers `/dashboard` si déjà connecté sur `/auth/*`.
- [ ] **Étape 4 — Actions `signIn` / `signOut`** : Créer `src/modules/auth/actions.ts`. Utiliser `createClient()` de `src/lib/supabase/server.ts`. Tester la connexion manuellement dans Supabase Auth.
- [ ] **Étape 5 — Action `signUp`** : Implémenter l'inscription. Après `supabase.auth.signUp()`, insérer dans `user_roles` ET dans la table de profil correspondante au rôle choisi. Tout doit être dans une transaction (ou vérifier la cohérence manuellement).
- [ ] **Étape 6 — Action `getCurrentUserProfile`** : Récupérer `auth.getUser()`, lire le rôle dans `user_roles`, puis charger le profil correspondant. Cette fonction est **exportée et utilisée par tous les autres modules**. Ne pas la casser.
- [ ] **Étape 7 — Page `/auth/login`** : Créer le composant `LoginForm.tsx` (Client Component). Appeler l'action `signIn`. En cas de succès, `router.push('/dashboard')`. Afficher les erreurs Supabase en français.
- [ ] **Étape 8 — Page `/auth/register`** : Créer `RegisterForm.tsx`. Step 1 : saisir email/password/rôle. Step 2 : saisir les données du profil selon le rôle. Appeler `signUp`.
- [ ] **Étape 9 — Route `/auth/callback`** : Créer `src/app/auth/callback/route.ts` pour gérer les tokens Supabase (magic link, OAuth). Suivre la documentation officielle Supabase SSR.
- [ ] **Étape 10 — Page `/dashboard`** : Server Component. Appeler `getCurrentUserProfile()`. Selon le rôle, afficher un layout différent (menu, widgets). Utiliser `RoleGuard` pour conditionner l'affichage.
- [ ] **Étape 11 — Annuaire** : Page `/dashboard/annuaire`. Fetcher `student_profiles` et `teacher_profiles`. Afficher dans `AnnuaireGrid` avec filtres par rôle et classe. La recherche se fait côté client sur les données déjà chargées.
- [ ] **Étape 12 — Commit** : `git commit -m "feat(auth): [description exacte de ce qui a été fait] (Ref: US22)"`. **1 commit par étape fonctionnelle.**

---

## 5. Limites et Anti-Collisions

- **NE PAS** modifier `src/app/layout.tsx` (racine) — appartient à l'architecture commune.
- **NE PAS** créer de tables Supabase liées aux autres modules (classes, cours, tickets…).
- **NE PAS** importer de code depuis `src/modules/pedagogy/`, `src/modules/career/`, etc.
- **NE PAS** exposer `auth.users` directement — toujours passer par les tables de profils.
- **NE PAS** stocker de secrets dans le code — uniquement via `.env.local`.
- **NE PAS** modifier `src/lib/supabase/client.ts` ou `server.ts` — fichiers partagés, toute modification doit être validée par l'équipe.
- **L'unique export public de ce module vers les autres :** `getCurrentUserProfile()` depuis `src/modules/auth/actions.ts`.
