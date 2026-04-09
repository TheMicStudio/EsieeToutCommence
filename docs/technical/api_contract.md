# Contrat des API (Server Actions & Routes) — EsieeToutCommence

**Ref :** US15  
**Dernière mise à jour :** 2026-04-09  
**Auteur :** Claude (documentation complète)

---

## Architecture générale

Ce projet repose sur **Next.js App Router** avec deux types de contrats d'API :

| Type | Usage | Auth |
|---|---|---|
| **Server Actions** (`'use server'`) | Toutes les mutations et lectures côté serveur | Cookie de session Supabase (automatique) |
| **API Routes** (`/app/api/`) | Endpoints HTTP accessibles hors navigateur (ex : scan QR mobile) | Cookie de session Supabase |

> **Convention de réponse des Server Actions**
> ```ts
> type ActionState = { success?: boolean; error?: string; [key: string]: unknown }
> ```
> - Succès → `{ success: true, ...données }`
> - Erreur → `{ error: "message lisible" }`

---

## 1. API Route HTTP

### `POST /api/attendance/checkin`

Point d'entrée QR Code pour les élèves (scan mobile hors dashboard).

**Auth requise :** oui — cookie de session Supabase  
**Rôle requis :** `eleve`

#### Corps de la requête (JSON)

```json
{
  "codeUnique": "string (UUID)",
  "deviceFingerprint": "string (hash technique, non biométrique)"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `codeUnique` | `string` UUID | ✅ | Token unique de la session d'émargement (extrait du QR Code) |
| `deviceFingerprint` | `string` | ✅ | Empreinte technique de l'appareil (user-agent + résolution, hashé) |

#### Réponses

| Code | Corps | Condition |
|---|---|---|
| `200` | `{ success: true, statut: "present" \| "en_retard" }` | Pointage enregistré avec succès |
| `400` | `{ error: "Données manquantes" }` | `codeUnique` ou `deviceFingerprint` absent |
| `401` | `{ error: "Non authentifié" }` | Pas de session valide |
| `404` | `{ error: "Session expirée ou introuvable" }` | Session fermée, expirée ou code inconnu |
| `409` | `{ error: "Déjà pointé pour cette session" }` | Doublon sur `(session_id, student_id)` ou `(session_id, device_fingerprint)` |
| `500` | `{ error: "Erreur serveur" }` | Erreur base de données inattendue |

#### Logique de statut présence

```
elapsed = maintenant - heure_ouverture
totalMin = heure_expiration - heure_ouverture
statut = elapsed > totalMin * 0.5 ? "en_retard" : "present"
```

---

## 2. Module Auth — `src/modules/auth/actions.ts`

### `signIn(formData)`

Authentifie un utilisateur et redirige vers `/dashboard`.

**Entrée (FormData)**

| Champ | Type | Requis |
|---|---|---|
| `email` | `string` | ✅ |
| `password` | `string` | ✅ |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | Redirect vers `/dashboard` |
| Identifiants incorrects | `{ error: "Email ou mot de passe incorrect." }` |
| Champs manquants | `{ error: "Veuillez remplir tous les champs." }` |
| Erreur serveur | `{ error: "Une erreur est survenue. Réessayez." }` |

---

### `signUp(formData)`

Crée un compte + profil et connecte l'utilisateur. Utilise le client admin (bypass email confirmation).

**Entrée (FormData)**

| Champ | Type | Requis | Rôles concernés |
|---|---|---|---|
| `email` | `string` | ✅ | Tous |
| `password` | `string` | ✅ | Tous |
| `role` | `eleve \| professeur \| coordinateur \| admin \| staff \| entreprise \| parent` | ✅ | Tous |
| `nom` | `string` | ✅ | Tous |
| `prenom` | `string` | ✅ | Tous |
| `type_parcours` | `"temps_plein" \| "alternant"` | ❌ | `eleve` |
| `matieres_enseignees` | `string` (virgule-séparé) | ❌ | `professeur`, `coordinateur` |
| `fonction` | `string` | ❌ | `admin`, `staff` |
| `entreprise` | `string` | ❌ | `entreprise` |
| `poste` | `string` | ❌ | `entreprise` |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | Redirect vers `/dashboard` |
| Email déjà utilisé | `{ error: "Cet email est déjà utilisé." }` |
| Champs obligatoires manquants | `{ error: "Veuillez remplir tous les champs obligatoires." }` |
| Erreur création Auth | `{ error: "Impossible de créer le compte : <détail>" }` |
| Erreur création profil | `{ error: "Erreur lors de la création du profil : <détail>" }` |

---

### `signOut()`

Déconnecte l'utilisateur et redirige vers `/auth/login`.

**Entrée :** aucune  
**Sortie :** Redirect vers `/auth/login`

---

### `getCurrentUserProfile()`

Retourne le profil complet de l'utilisateur connecté. **Point d'intégration public entre modules.**

**Entrée :** aucune  
**Sortie :** `UserProfile | null`

```ts
type UserProfile =
  | { role: 'eleve';        profile: StudentProfile  }
  | { role: 'professeur';   profile: TeacherProfile  }
  | { role: 'coordinateur'; profile: TeacherProfile  }
  | { role: 'admin';        profile: AdminProfile    }
  | { role: 'staff';        profile: AdminProfile    }
  | { role: 'entreprise';   profile: CompanyProfile  }
  | { role: 'parent';       profile: ParentProfile   }
```

> ℹ️ Cette fonction est mise en cache via `cache()` de React — elle ne déclenche qu'une seule requête par cycle de rendu.

---

### `updateProfile(formData)`

Modifie les informations du profil de l'utilisateur connecté.

**Entrée (FormData)**

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `nom` | `string` | ✅ | |
| `prenom` | `string` | ✅ | |
| `email` | `string` | ❌ | Utiliser `requestEmailChange` pour changer l'email |
| `phone_mobile` | `string` | ❌ | |
| `phone_fixed` | `string` | ❌ | |
| `matieres_enseignees` | `string` (CSV) | ❌ | `professeur`, `coordinateur` |
| `fonction` | `string` | ❌ | `admin`, `staff` |
| `entreprise` | `string` | ❌ | `entreprise` |
| `poste` | `string` | ❌ | `entreprise` |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | `{ success: true }` + revalidation `/dashboard/profile` |
| Non authentifié | `{ error: "Non authentifié." }` |
| Nom/prénom manquant | `{ error: "Nom et prénom sont requis." }` |
| Erreur BDD | `{ error: "Erreur lors de la mise à jour du profil." }` |

---

### `requestEmailChange(formData)`

Change l'adresse e-mail via le client admin (sans confirmation SMTP).

**Entrée (FormData)**

| Champ | Type | Requis |
|---|---|---|
| `new_email` | `string` | ✅ |
| `confirm_email` | `string` | ✅ |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | `{ success: true }` |
| Emails différents | `{ error: "Les deux adresses ne correspondent pas." }` |
| Même email que l'actuel | `{ error: "C'est déjà votre adresse e-mail actuelle." }` |
| Erreur | `{ error: "Impossible de changer l'e-mail : <détail>" }` |

---

## 3. Module Émargement — `src/modules/attendance/actions/index.ts`

### `createAttendanceSession(classId, durationMin)`

Ouvre une session d'appel QR Code.

**Entrée**

| Paramètre | Type | Requis | Contraintes |
|---|---|---|---|
| `classId` | `string` UUID | ✅ | Doit être une classe assignée au prof |
| `durationMin` | `number` | ✅ | Valeurs acceptées : `5`, `10`, `15`, `30` |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | `{ session: AttendanceSession }` |
| Non authentifié | `{ error: "Non authentifié" }` |
| Erreur BDD | `{ error: "<message Supabase>" }` |

```ts
interface AttendanceSession {
  id: string;           // UUID
  class_id: string;
  teacher_id: string;
  code_unique: string;  // UUID — intégré dans le QR Code
  expiration: string;   // ISO 8601
  statut: "ouvert" | "ferme";
  created_at: string;
}
```

---

### `closeAttendanceSession(sessionId)`

Ferme une session (le prof ne peut fermer que ses propres sessions — RLS).

**Entrée**

| Paramètre | Type | Requis |
|---|---|---|
| `sessionId` | `string` UUID | ✅ |

**Sortie**

| Cas | Résultat |
|---|---|
| Succès | `{}` |
| Erreur BDD / RLS | `{ error: "<message>" }` |

---

### `getSessionByCode(codeUnique)`

Valide un code QR : retourne la session si elle est ouverte et non expirée.

**Entrée**

| Paramètre | Type | Requis |
|---|---|---|
| `codeUnique` | `string` UUID | ✅ |

**Sortie :** `AttendanceSession | null`

- `null` si session inexistante, fermée ou expirée.

---

### `getSessionRecords(sessionId)`

Liste tous les pointages d'une session (prof/admin uniquement via RLS).

**Entrée**

| Paramètre | Type | Requis |
|---|---|---|
| `sessionId` | `string` UUID | ✅ |

**Sortie :** `AttendanceRecord[]`

```ts
interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  statut_presence: "present" | "en_retard";
  heure_pointage: string;   // ISO 8601
  device_fingerprint: string;
}
```

---

### `getAbsentees(sessionId)`

Génère la liste des élèves absents (membres de la classe sans pointage). Utilise le client admin.

**Entrée**

| Paramètre | Type | Requis |
|---|---|---|
| `sessionId` | `string` UUID | ✅ |

**Sortie :** `{ student_id: string; nom: string; prenom: string }[]`

---

### `getAttendanceReport(sessionId)`

Rapport complet d'une session : présents + absents + taux.

**Sortie**

```ts
interface AttendanceReport {
  session: AttendanceSession;
  presents: AttendanceRecord[];
  absents: { student_id: string; nom: string; prenom: string }[];
  taux_presence: number; // 0–100
}
```

Retourne `null` si la session est introuvable.

---

### `getMyTeacherSessions()`

Retourne toutes les sessions créées par le prof connecté (ordre anti-chronologique).

**Sortie :** `AttendanceSession[]`

---

### `getMyAttendanceHistory()`

Retourne l'historique de pointage de l'élève connecté.

**Sortie :** `AttendanceRecord[]`

---

## 4. Module Documents — `src/modules/documents/actions.ts`

> **Rôles autorisés :** `admin`, `coordinateur` uniquement (sauf `resolveShareLink` et `getPublicSignedUrl` qui sont publics).

### `getFolderContents(folderId?)`

**Entrée**

| Paramètre | Type | Requis | Notes |
|---|---|---|---|
| `folderId` | `string` UUID | ❌ | Si absent → racine (dossiers seulement, pas de fichiers) |

**Sortie**

```ts
{ folders: DocFolder[]; files: DocFile[] }
```

---

### `createFolder(formData)`

**Entrée (FormData)**

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `parent_id` | `string` UUID | ❌ |
| `description` | `string` | ❌ |

**Sortie :** `ActionState` — `{ success: true }` ou `{ error: "..." }`

---

### `uploadFile(formData)`

**Entrée (FormData)**

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `folder_id` | `string` UUID | ✅ | |
| `file` | `File` | ✅ | Max 50 Mo |
| `description` | `string` | ❌ | |
| `tags` | `string` (CSV) | ❌ | |

**Sortie :** `ActionState`

**Codes d'erreur**

| Condition | Message |
|---|---|
| Fichier manquant | `"Dossier et fichier sont requis."` |
| Fichier > 50 Mo | `"Le fichier dépasse 50 Mo."` |
| Erreur storage | `"Erreur upload : <détail>"` |
| Erreur BDD | `"Erreur lors de l'enregistrement du fichier."` |

---

### `getSignedDownloadUrl(fileId)`

Génère une URL signée valide 1 heure (auth requise).

**Sortie :** `{ url?: string; error?: string }`

---

### `createShareLink(formData)`

**Entrée (FormData)**

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `file_id` | `string` UUID | ❌ | `file_id` OU `folder_id` requis |
| `folder_id` | `string` UUID | ❌ | |
| `label` | `string` | ❌ | |
| `expires_at` | `string` ISO 8601 | ❌ | |
| `max_uses` | `number` | ❌ | |

**Sortie :** `ActionState`

---

### `resolveShareLink(token)` *(public, sans auth)*

Valide et consomme un lien de partage. Incrémente `uses_count`.

**Entrée :** `token: string`

**Sortie**

```ts
{
  link?: DocShareLink;
  file?: DocFile;           // si lien vers fichier
  folderFiles?: DocFile[];  // si lien vers dossier
  folderName?: string;
  error?: string;
}
```

**Cas d'erreur**

| Condition | Message |
|---|---|
| Token inconnu | `"Lien introuvable ou révoqué."` |
| Expiré | `"Ce lien a expiré."` |
| Quota atteint | `"Ce lien a atteint sa limite d'utilisation."` |

---

### `getPublicSignedUrl(storagePath)` *(public, sans auth)*

Génère une URL signée valide 24 h pour les liens de partage publics.

**Sortie :** `string | null`

---

### `setFolderPermission(formData)`

**Entrée (FormData)**

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `folder_id` | `string` UUID | ✅ | |
| `level` | `"read" \| "write" \| "admin"` | ✅ | |
| `role_target` | `string` | ❌ | OU `user_target`, pas les deux |
| `user_target` | `string` UUID | ❌ | |

**Sortie :** `ActionState`

---

### `searchDocuments(query)`

Recherche full-text (ILIKE) dans noms et descriptions des dossiers et fichiers.

**Entrée :** `query: string`  
**Sortie :** `DocSearchResult[]` (max 20 dossiers + 20 fichiers)

---

## 5. Règles transversales de validation

| Règle | Application |
|---|---|
| UUID toujours côté serveur | Les IDs ne sont jamais générés côté client |
| RLS Supabase | Chaque table a des politiques RLS — le serveur anon ne peut accéder qu'aux données autorisées par le rôle connecté |
| Client admin | Utilisé uniquement quand la RLS bloque légitimement (ex : un prof qui lit la liste classe dont il n'est pas membre) — l'identité est toujours vérifiée via `auth.getUser()` avant d'utiliser le client admin |
| Taille fichiers | Vérifiée avant upload (`> 50 Mo` → rejet immédiat) |
| Anti-doublon pointage | Contrainte UNIQUE BDD sur `(session_id, student_id)` et `(session_id, device_fingerprint)` — code retour `409` |
| Expiration QR | Vérifiée à chaque scan côté serveur (`expiration > NOW()`) — pas de cron job |
| Données sensibles | Aucun secret en dur — uniquement `.env.local`. `device_fingerprint` : données techniques uniquement (pas de biométrie, pas de géoloc) |

---

## 6. Types de base partagés

```ts
// src/modules/auth/types.ts
type RolePrincipal = "eleve" | "professeur" | "coordinateur" | "admin" | "staff" | "entreprise" | "parent";

// src/modules/documents/types/index.ts
type DocPermissionLevel = "read" | "write" | "admin";

// src/modules/attendance/types/index.ts
type SessionStatut   = "ouvert" | "ferme";
type PresenceStatut  = "present" | "en_retard";
```

---

## 7. Conventions d'erreurs

| Scénario | Pattern retourné |
|---|---|
| Non authentifié | `{ error: "Non authentifié" }` ou `{ error: "Non authentifié." }` |
| Accès refusé (rôle insuffisant) | `{ error: "Accès refusé." }` |
| Données manquantes | `{ error: "Données manquantes." }` ou message champ spécifique |
| Ressource introuvable | `{ error: "<ressource> introuvable" }` |
| Doublon BDD (code `23505`) | `{ error: "Déjà <action> pour cette session" }` ou message spécifique |
| Erreur serveur générique | `{ error: "Erreur serveur" }` (HTTP 500 sur API Route) |

---

*Ce document est généré depuis l'analyse du code source. Il fait référence pour tout tiers (autre IA, développeur front, testeur) souhaitant intégrer ou tester les fonctionnalités sans lire le code.*
