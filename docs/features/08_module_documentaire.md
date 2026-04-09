# Module 8 — Espace Documentaire

> Inspiré de SharePoint / MiHub. Réservé aux coordinateurs et administrateurs.
> Pas de workflow de validation, pas de versioning, équipe de confiance.

---

## Périmètre

- Accès : rôles `admin` et `coordinateur` et `responsable pedagogique`  uniquement (RLS + middleware)
- Organisation : arborescence libre de dossiers imbriqués
- Droits : configurables par dossier, hérités par sous-dossiers et fichiers
- Permissions : par rôle ET par utilisateur individuel (lecture / écriture / admin)
- Recherche : classique sur nom + description + tags
- Partage : interne (rôle/personne) **ou** lien temporaire avec expiration
- Versioning : hors périmètre

---

## Modèle de données

### `doc_folders`

```sql
create table doc_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  parent_id   uuid references doc_folders(id) on delete cascade,
  created_by  uuid references auth.users(id) not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
-- index pour navigation arborescente
create index on doc_folders(parent_id);
```

### `doc_files`

```sql
create table doc_files (
  id           uuid primary key default gen_random_uuid(),
  folder_id    uuid references doc_folders(id) on delete cascade not null,
  name         text not null,
  description  text,
  tags         text[] default '{}',
  mime_type    text,
  size_bytes   bigint,
  storage_path text not null,  -- chemin dans Supabase Storage bucket "documents"
  uploaded_by  uuid references auth.users(id) not null,
  uploaded_at  timestamptz default now(),
  updated_at   timestamptz default now()
);
create index on doc_files(folder_id);
create index on doc_files using gin(tags);
```

### `doc_permissions`

```sql
-- Droits par dossier. Héritage : si aucune permission sur un sous-dossier,
-- on remonte au parent jusqu'à trouver une règle.
-- role_target et user_target sont mutuellement exclusifs (check constraint).
create table doc_permissions (
  id          uuid primary key default gen_random_uuid(),
  folder_id   uuid references doc_folders(id) on delete cascade not null,
  role_target role_principal,        -- NULL si permission individuelle
  user_target uuid references auth.users(id),  -- NULL si permission par rôle
  level       text not null check (level in ('read', 'write', 'admin')),
  granted_by  uuid references auth.users(id) not null,
  granted_at  timestamptz default now(),
  constraint one_target check (
    (role_target is null) != (user_target is null)
  )
);
create index on doc_permissions(folder_id);
```

### `doc_share_links`

```sql
create table doc_share_links (
  id          uuid primary key default gen_random_uuid(),
  -- partage sur un fichier OU un dossier (mutuellement exclusif)
  file_id     uuid references doc_files(id) on delete cascade,
  folder_id   uuid references doc_folders(id) on delete cascade,
  token       text unique not null default encode(gen_random_bytes(24), 'base64url'),
  label       text,                  -- nom optionnel du lien (ex: "Lien jury 2026")
  expires_at  timestamptz,           -- NULL = pas d'expiration
  max_uses    int,                   -- NULL = illimité
  uses_count  int default 0,
  created_by  uuid references auth.users(id) not null,
  created_at  timestamptz default now(),
  constraint one_share_target check (
    (file_id is null) != (folder_id is null)
  )
);
```

---

## RLS

```sql
-- Seuls admin et coordinateur peuvent accéder aux tables doc_*
-- La logique de permission fine (doc_permissions) est gérée côté application.

create policy "doc_folders_admin_coord" on doc_folders
  for all using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'coordinateur')
    )
  );

-- Idem pour doc_files, doc_permissions, doc_share_links
```

---

## Storage

- Bucket Supabase : `documents` (privé)
- Structure des chemins : `{folder_id}/{file_id}/{filename}`
- URL signées générées à la demande (durée : 1h pour visualisation, 7 jours pour lien de partage)

---

## Logique métier

### Héritage des permissions

```
Dossier racine (pas de parent)
  → chercher une règle dans doc_permissions pour ce dossier
  → si rien : accès refusé (fail closed)

Sous-dossier
  → chercher une règle directe
  → si rien : remonter au parent et répéter jusqu'à la racine
  → si rien sur toute la chaîne : refus
```

Priorité des règles : permission individuelle (`user_target`) > permission par rôle (`role_target`).

### Résolution des droits (helper côté actions)

```typescript
// src/modules/documents/lib/permissions.ts
async function resolvePermission(
  userId: string,
  userRole: RolePrincipal,
  folderId: string
): Promise<'none' | 'read' | 'write' | 'admin'>
```

### Liens de partage

- Accès public via `/share/[token]` (page hors layout dashboard)
- Vérification à chaque accès : expiration + quota d'utilisations
- Incrément de `uses_count` à chaque accès

---

## Routes

| Route | Description |
|---|---|
| `GET /dashboard/documents` | Racine — dossiers sans parent |
| `GET /dashboard/documents/[folderId]` | Contenu d'un dossier |
| `GET /share/[token]` | Accès via lien partagé (public) |

### Server Actions (`src/modules/documents/actions.ts`)

```typescript
// Dossiers
createFolder(name, parentId?, description?)
renameFolder(folderId, name)
deleteFolder(folderId)           // cascade sur sous-dossiers et fichiers

// Fichiers
uploadFile(folderId, file, metadata)
deleteFile(fileId)
getSignedUrl(fileId, expiresIn)  // URL temporaire Supabase Storage

// Permissions
setFolderPermission(folderId, target, level)  // role ou userId
removeFolderPermission(permissionId)
listFolderPermissions(folderId)

// Partage
createShareLink(fileId | folderId, options)
revokeShareLink(linkId)
listShareLinks(fileId | folderId)

// Recherche
searchDocuments(query, filters?)  // cherche dans name, description, tags
```

---

## UI — Vues

### Layout principal `/dashboard/documents`

```
┌─────────────────┬──────────────────────────────────────────┐
│  Arborescence   │  Contenu du dossier courant              │
│  (sidebar)      │                                          │
│                 │  [Barre d'outils] Nouveau dossier        │
│  📁 Racine      │               Upload   Recherche...      │
│    📁 RH        │                                          │
│    📁 Pédago    │  📁 Sous-dossier A        ···            │
│      📁 2026    │  📁 Sous-dossier B        ···            │
│    📁 Direction │  📄 document.pdf          ···            │
│                 │  📄 fiche.xlsx            ···            │
└─────────────────┴──────────────────────────────────────────┘
```

### Actions sur un fichier (menu `···`)
- Télécharger
- Visualiser (URL signée dans un nouvel onglet)
- Partager → modal (interne : rôle/personne | lien temporaire)
- Déplacer vers...
- Supprimer

### Actions sur un dossier (menu `···`)
- Renommer
- Gérer les permissions
- Partager (lien temporaire)
- Supprimer (avec confirmation si non vide)

### Modal permissions dossier

```
Permissions de "RH"
─────────────────────────────────
Rôle/Utilisateur    Niveau    [×]
Admin               Admin      ×
Coordinateur        Écriture   ×
Marie Dupont        Lecture    ×
─────────────────────────────────
[+ Ajouter une règle]
  → Sélecteur rôle OU utilisateur
  → Niveau : Lecture / Écriture / Admin
```

### Modal liens de partage

```
Liens de partage pour "rapport-annuel.pdf"
─────────────────────────────────────────────
"Lien jury 2026"    Expire 30/04   3 accès  [Copier] [×]
─────────────────────────────────────────────
[+ Créer un lien]
  → Label (optionnel)
  → Expiration : jamais / date précise
  → Limite d'accès : illimitée / nombre
```

---

## Composants (`src/modules/documents/components/`)

| Composant | Rôle |
|---|---|
| `FolderTree.tsx` | Sidebar arborescente récursive |
| `FolderContents.tsx` | Grille/liste des fichiers et sous-dossiers |
| `FileCard.tsx` | Carte fichier avec icône type MIME |
| `FolderCard.tsx` | Carte dossier cliquable |
| `UploadDropzone.tsx` | Zone drag & drop upload |
| `PermissionsModal.tsx` | Gestion des droits par dossier |
| `ShareModal.tsx` | Création et gestion des liens de partage |
| `DocumentSearch.tsx` | Barre de recherche + résultats |
| `Breadcrumb.tsx` | Fil d'Ariane de navigation |

---

## Pages

| Fichier | Description |
|---|---|
| `src/app/dashboard/documents/page.tsx` | Racine documentaire |
| `src/app/dashboard/documents/[folderId]/page.tsx` | Dossier courant |
| `src/app/share/[token]/page.tsx` | Page de téléchargement lien public |

---

## SQL Migration

Fichier : `supabase/migrations/20260408070000_init_module_documents.sql`

Contenu : création de `doc_folders`, `doc_files`, `doc_permissions`, `doc_share_links` + index + RLS.

---

## Checklist de développement

- [ ] SQL exécuté dans Supabase (`doc_folders`, `doc_files`, `doc_permissions`, `doc_share_links` + RLS)
- [ ] Bucket Storage `documents` créé (privé)
- [ ] `src/modules/documents/lib/permissions.ts` — résolution hiérarchique des droits
- [ ] `src/modules/documents/actions.ts` — toutes les actions listées ci-dessus
- [ ] `src/modules/documents/types/index.ts` — types TypeScript
- [ ] `FolderTree.tsx` — arborescence récursive
- [ ] `FolderContents.tsx` + `FileCard.tsx` + `FolderCard.tsx`
- [ ] `UploadDropzone.tsx` — upload avec progress
- [ ] `PermissionsModal.tsx` — CRUD permissions par dossier
- [ ] `ShareModal.tsx` — liens internes + temporaires
- [ ] `DocumentSearch.tsx` — recherche nom/description/tags
- [ ] `Breadcrumb.tsx`
- [ ] Page `/dashboard/documents` (racine)
- [ ] Page `/dashboard/documents/[folderId]`
- [ ] Page `/share/[token]` (publique, hors layout dashboard)
- [ ] Guard middleware : accès `admin` et `coordinateur` uniquement
- [ ] Sidebar : ajouter entrée "Documents" pour ces rôles

---

## Dépendances

- **Bloque :** Rien
- **Bloqué par :** Module 1 (`getCurrentUserProfile`, `user_roles`, `role_principal`)
- **Packages :** `@supabase/storage-js` (inclus dans `@supabase/supabase-js`), aucune dépendance supplémentaire requise

---

## Décisions techniques

| Décision | Raison |
|---|---|
| Héritage des droits géré côté app (pas de vue SQL récursive) | Simplicité, évite une CTE récursive complexe en RLS |
| Bucket privé + URL signées | Sécurité — aucun fichier accessible sans authentification |
| Token base64url pour les liens de partage | URL-safe, pas de padding, 192 bits d'entropie |
| Fail closed sur les permissions | Si aucune règle trouvée → refus, jamais ouvert par défaut |
