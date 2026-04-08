# Système de Permissions Avancé — EsieeToutCommence

## Objectif

Remplacer le système de rôle unique par des **permissions granulaires configurables par l'établissement**, sans toucher au code. Chaque permission correspond à un niveau d'accès clair sur un module.

---

## Principe de conception

Plutôt que d'exposer chaque opération CRUD individuellement (85+ permissions), on regroupe par **niveau logique** :

| Niveau | Ce qu'il couvre |
|---|---|
| `read` | Accès lecture |
| `write` | Créer + modifier + supprimer **ses propres** données |
| `manage` | Gérer les données de **tout le monde** + actions d'administration du module |
| `participate` | Accès interactif sans pouvoir administrer (rejoindre, s'inscrire, envoyer) |

Quand deux niveaux ne sont jamais dissociés logiquement → ils sont fusionnés en un seul.

---

## Liste consolidée — 38 permissions

### Actualités
| Permission | Niveau | Couvre |
|---|---|---|
| `news.read` | Lecture | Voir toutes les publications |
| `news.write` | Écriture | Créer, modifier et supprimer ses propres publications |
| `news.moderate` | Admin | Supprimer n'importe quelle publication, épingler |

### Annuaire
| Permission | Niveau | Couvre |
|---|---|---|
| `directory.read` | Lecture | Voir les profils (nom, classe, matières, téléphone, email) |
| `directory.export` | Admin | Exporter l'annuaire en CSV |

### Classes
| Permission | Niveau | Couvre |
|---|---|---|
| `class.read` | Lecture | Voir la liste des classes et leurs membres |
| `class.manage` | Admin | Créer, modifier, supprimer des classes, gérer les membres |

### Supports de cours
| Permission | Niveau | Couvre |
|---|---|---|
| `course_material.read` | Lecture | Télécharger les supports |
| `course_material.write` | Écriture | Déposer et supprimer ses propres supports |
| `course_material.moderate` | Admin | Supprimer n'importe quel support |

### Notes & Moyennes
| Permission | Niveau | Couvre |
|---|---|---|
| `grade.read_own` | Lecture | Voir ses propres notes et moyennes |
| `grade.read_class` | Lecture+ | Voir les notes de toute une classe |
| `grade.manage` | Admin | Saisir, modifier, supprimer des notes |

### Projets — Semaines
| Permission | Niveau | Couvre |
|---|---|---|
| `project_week.read` | Lecture | Voir les semaines projet et leur contenu |
| `project_week.manage` | Admin | Créer, modifier, supprimer des semaines projet |

### Projets — Groupes
| Permission | Niveau | Couvre |
|---|---|---|
| `project_group.read` | Lecture | Voir tous les groupes |
| `project_group.participate` | Participation | Rejoindre/quitter un groupe, chat, tableau blanc |
| `project_group.manage` | Admin | Créer/supprimer des groupes, gérer les membres, noter |

### Projets — Rétrospective
| Permission | Niveau | Couvre |
|---|---|---|
| `retro.participate` | Participation | Lire, créer et supprimer ses propres post-its |
| `retro.moderate` | Admin | Supprimer tout post-it, ouvrir/fermer le mur |

### Projets — Soutenances
| Permission | Niveau | Couvre |
|---|---|---|
| `soutenance.read` | Lecture | Voir les créneaux disponibles |
| `soutenance.book` | Participation | Réserver un créneau (groupe) |
| `soutenance.manage` | Admin | Créer, modifier, supprimer des créneaux |

### Émargement
| Permission | Niveau | Couvre |
|---|---|---|
| `attendance.read_own` | Lecture | Voir son propre historique |
| `attendance.read_class` | Lecture+ | Voir l'émargement d'une classe, exporter |
| `attendance.manage` | Admin | Ouvrir/fermer une session QR, marquer présent/absent manuellement |

### Job Board
| Permission | Niveau | Couvre |
|---|---|---|
| `job.read` | Lecture | Voir les offres d'emploi |
| `job.manage` | Admin | Publier, modifier, supprimer des offres |

### Événements Carrière
| Permission | Niveau | Couvre |
|---|---|---|
| `career_event.read` | Lecture | Voir les événements |
| `career_event.participate` | Participation | S'inscrire et se désinscrire |
| `career_event.manage` | Admin | Créer, modifier, supprimer, voir la liste des inscrits |

### Espace Tripartite & Livret
| Permission | Niveau | Couvre |
|---|---|---|
| `alternance.access` | Participation | Accéder au chat tripartite, déposer des entrées dans le livret |
| `alternance.validate` | Admin | Valider les entrées du livret, voir tous les livrets |

### Support
| Permission | Niveau | Couvre |
|---|---|---|
| `support.use` | Participation | Créer un ticket, suivre ses propres tickets |
| `support.manage` | Admin | Voir tous les tickets, répondre, clore, supprimer |

### Messagerie Staff
| Permission | Niveau | Couvre |
|---|---|---|
| `staff_channel.participate` | Participation | Lire et envoyer des messages dans les canaux |
| `staff_channel.manage` | Admin | Créer/supprimer des canaux, modérer les messages |

### Profil
| Permission | Niveau | Couvre |
|---|---|---|
| `profile.edit_own` | Écriture | Modifier son propre profil |
| `profile.manage_any` | Admin | Modifier le profil d'un autre utilisateur |

### Administration
| Permission | Niveau | Couvre |
|---|---|---|
| `user.manage` | Admin | Créer, modifier le rôle, désactiver, supprimer des comptes |
| `permission.manage` | Super-admin | Modifier la configuration des permissions par rôle |

---

## Hiérarchie des rôles

```
admin (super-admin)        → accès total, gestion technique et permissions
  ↓
staff (personnel école)    → publication, support, carrière — pas de gestion utilisateurs
  ↓
coordinateur (resp. péda)  → tout professeur + gestion classes + validation livrets
  ↓
professeur                 → pédagogie, projets, émargement
  ↓
eleve / entreprise / parent
```

> **Partage de tables profil :**
> `coordinateur` → `teacher_profiles` · `staff` → `admin_profiles`

---

## Matrice des valeurs par défaut

| Permission | eleve | prof | coord. | staff | admin | entrep. | parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `news.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news.write` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `news.moderate` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `directory.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `directory.export` | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `class.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `class.manage` | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `course_material.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `course_material.write` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `course_material.moderate` | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `grade.read_own` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `grade.read_class` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `grade.manage` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `project_week.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `project_week.manage` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `project_group.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `project_group.participate` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `project_group.manage` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `retro.participate` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `retro.moderate` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `soutenance.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `soutenance.book` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `soutenance.manage` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `attendance.read_own` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `attendance.read_class` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `attendance.manage` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `job.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `job.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `career_event.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `career_event.participate` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `career_event.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `alternance.access` | ✅* | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `alternance.validate` | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `support.use` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `support.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `staff_channel.participate` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `staff_channel.manage` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `profile.edit_own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `profile.manage_any` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `user.manage` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `permission.manage` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

> *`alternance.access` pour élève : uniquement si `type_parcours === 'alternant'` (vérification runtime)

---

## Schéma SQL

```sql
-- Catalogue des permissions
CREATE TABLE permissions (
  key         TEXT PRIMARY KEY,   -- ex: 'news.write'
  module      TEXT NOT NULL,      -- ex: 'news'
  level       TEXT NOT NULL,      -- 'read' | 'write' | 'manage' | 'participate'
  description TEXT NOT NULL
);

-- Configuration par rôle (modifiable par l'admin)
CREATE TABLE role_permissions (
  role           TEXT NOT NULL,   -- 'eleve' | 'professeur' | 'admin' | 'entreprise' | 'parent'
  permission_key TEXT NOT NULL REFERENCES permissions(key),
  enabled        BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (role, permission_key)
);

-- Overrides par utilisateur (cas exceptionnels)
CREATE TABLE user_permission_overrides (
  user_id        UUID NOT NULL REFERENCES auth.users(id),
  permission_key TEXT NOT NULL REFERENCES permissions(key),
  enabled        BOOLEAN NOT NULL,  -- true = accordé, false = révoqué
  PRIMARY KEY (user_id, permission_key)
);
```

---

## Helper d'intégration

```ts
// src/lib/permissions.ts
import { createAdminClient } from '@/lib/supabase/admin';

export async function can(userId: string, role: string, permission: string): Promise<boolean> {
  const admin = createAdminClient();

  // 1. Override utilisateur (priorité max)
  const { data: override } = await admin
    .from('user_permission_overrides')
    .select('enabled')
    .eq('user_id', userId)
    .eq('permission_key', permission)
    .maybeSingle();

  if (override !== null) return override.enabled;

  // 2. Permission du rôle
  const { data: rolePerm } = await admin
    .from('role_permissions')
    .select('enabled')
    .eq('role', role)
    .eq('permission_key', permission)
    .maybeSingle();

  return rolePerm?.enabled ?? false;
}
```

Utilisation dans une Server Action :
```ts
import { can } from '@/lib/permissions';

export async function createNewsPost(formData: FormData) {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error('Non authentifié');

  if (!await can(profile.profile.id, profile.role, 'news.write')) {
    throw new Error('Permission refusée');
  }
  // ...
}
```

---

## Roadmap d'implémentation

1. **Seed SQL** — insérer les 38 permissions dans `permissions` + valeurs par défaut dans `role_permissions`
2. **Helper `can()`** — fonction serveur + mise en cache par session (cookie signé ou mémoire in-request)
3. **Remplacer les guards `role === 'admin'`** dans toutes les Server Actions par `can()`
4. **Interface admin** — page `/dashboard/admin/permissions` : tableau role × permission avec toggle
5. **Overrides individuels** — UI optionnelle pour attribuer des exceptions utilisateur par utilisateur
