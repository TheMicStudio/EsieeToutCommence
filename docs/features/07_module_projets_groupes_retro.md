# Module Projets, Groupes & Rétro - Spécifications de Développement

**Assigné à :** Dev 3
**Branche Git :** `feat/T07-projects-groupes-retro`
**Recommandation d'assignation :** Dev 3 est retenu car Dev 2 gère déjà les Modules 2 et 6. Ce module partage le concept de "classe" avec Module 2 mais reste totalement indépendant côté code.
**Règle absolue :** Ne pas modifier les fichiers de `src/modules/auth/`, `src/modules/pedagogy/` ou toute table existante. Toute interaction avec les classes se fait via des FK SQL uniquement — aucun import de code du Module 2.

---

## Design & Templates

> **Avant de coder toute page ou composant**, consulter :
> - [`docs/templates/README.md`](../templates/README.md) — charte graphique, palette, typographie Outfit, règles responsive
> - [`docs/templates/projets/`](../templates/projets/) — maquettes liste groupes, board rétro (3 colonnes), grille soutenances
> - [`docs/templates/global/`](../templates/global/) — layout dashboard (sidebar + header)
> - [`docs/technical/ui_guidelines.md`](../technical/ui_guidelines.md) — tokens shadcn, composants, états UI

**Exigences responsive :**
- Mobile : board rétro en colonnes empilées verticalement (scroll vertical), 1 colonne par type
- Tablet : 2 colonnes visibles (scroll horizontal pour la 3ème)
- Desktop : 3 colonnes côte à côte en pleine largeur (`grid-cols-3`)

---

## 1. Objectifs & Backlog

Basé sur `base.md` et `backlog.md` (US22, US24, US25, US26) :

- **Semaines Projets :** Les profs créent des semaines projets liées à leur classe (titre, dates).
- **Groupes :** Les élèves s'auto-organisent en groupes (avec capacité max), déposent leurs livrables (GitHub, Slides).
- **Notation :** Les profs notent chaque groupe et laissent des conseils pédagogiques textuels.
- **Soutenances :** Créneaux de passage créés par les profs, réservés par les groupes (first come, first served).
- **Mur de Rétro :** Tableau Kanban 3 colonnes (Aimé / Pas aimé / Idées) avec post-its en temps réel. Ouverture/fermeture contrôlées par le prof.

---

## 2. Base de Données (Supabase)

> Fichier SQL complet : `docs/sql/02_projets_groupes_retro.sql`

### 2.1 Schéma des tables

```
project_weeks
  └── project_groups  (week_id →)
        └── group_members  (group_id →)
  └── soutenance_slots  (week_id →, group_id →)
  └── retro_boards  (week_id → UNIQUE)
        └── retro_postits  (board_id →)
```

| Table | Colonnes clés |
|---|---|
| `project_weeks` | `id`, `title`, `class_id`, `start_date`, `end_date`, `cree_par` |
| `project_groups` | `id`, `week_id`, `group_name`, `repo_url`, `slides_url`, `capacite_max`, `note`, `feedback_prof`, `note_par` |
| `group_members` | `group_id`, `student_id` (PK composite) |
| `soutenance_slots` | `id`, `week_id`, `heure_debut`, `heure_fin`, `group_id` (NULL = libre) |
| `retro_boards` | `id`, `week_id` (UNIQUE), `is_open` |
| `retro_postits` | `id`, `board_id`, `type` (POSITIVE/NEGATIVE/IDEA), `content`, `is_anonymous`, `author_id` |

### 2.2 Règles RLS clés

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `project_weeks` | Membres + profs de la classe | Profs de la classe | Créateur | — |
| `project_groups` | Membres + profs de la classe | Élèves de la classe | Membres du groupe (liens) / Profs (note) | — |
| `group_members` | Membres + profs de la classe | Élève lui-même (si capacité OK) | — | Élève lui-même |
| `soutenance_slots` | Membres + profs de la classe | Profs (création) | Groupe libre (réservation) | — |
| `retro_boards` | Membres + profs de la classe | — | Profs (ouverture/fermeture) | — |
| `retro_postits` | Tous élèves de la classe | Élèves si board ouvert | Auteur | Auteur |

> Les fonctions `is_class_member()` et `is_class_teacher()` sont définies dans le Module 2. Ne pas les recréer — elles sont dans le schéma `public`.

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/projects/actions.ts` | `getProjectWeeks(classId)` | Semaines projets d'une classe |
| `src/modules/projects/actions.ts` | `createProjectWeek(data)` | Créer une semaine (prof) |
| `src/modules/projects/actions.ts` | `getGroups(weekId)` | Groupes d'une semaine avec membres |
| `src/modules/projects/actions.ts` | `createGroup(weekId, groupName, capaciteMax)` | Créer un groupe (élève) |
| `src/modules/projects/actions.ts` | `joinGroup(groupId)` | Rejoindre un groupe (élève) |
| `src/modules/projects/actions.ts` | `leaveGroup(groupId)` | Quitter un groupe (élève) |
| `src/modules/projects/actions.ts` | `updateGroupLinks(groupId, repoUrl, slidesUrl)` | Déposer les livrables |
| `src/modules/projects/actions.ts` | `gradeGroup(groupId, note, feedbackProf)` | Noter un groupe (prof) |
| `src/modules/projects/actions.ts` | `getSoutenanceSlots(weekId)` | Créneaux de soutenance |
| `src/modules/projects/actions.ts` | `createSoutenanceSlots(weekId, slots[])` | Créer les créneaux (prof) |
| `src/modules/projects/actions.ts` | `bookSlot(slotId, groupId)` | Réserver un créneau (first come, first served) |
| `src/modules/projects/actions.ts` | `getRetroBoard(weekId)` | Récupère le board de rétro |
| `src/modules/projects/actions.ts` | `toggleRetroBoard(boardId, isOpen)` | Ouvrir/fermer le board (prof) |
| `src/modules/projects/actions.ts` | `addPostit(boardId, type, content, isAnonymous)` | Ajouter un post-it |
| `src/modules/projects/actions.ts` | `deletePostit(postitId)` | Supprimer son post-it |

### 3.2 Pages Next.js

| Chemin | Type | Rôles | Description |
|---|---|---|---|
| `src/app/dashboard/projets/page.tsx` | Server | Élèves + Profs | Hub — liste des semaines projets |
| `src/app/dashboard/projets/[weekId]/page.tsx` | Server | Élèves + Profs | Détail d'une semaine (groupes + créneaux) |
| `src/app/dashboard/projets/[weekId]/groupes/page.tsx` | Server | Élèves + Profs | Liste des groupes, rejoindre/quitter |
| `src/app/dashboard/projets/[weekId]/retro/page.tsx` | Client | Élèves + Profs | Mur de rétro temps réel |
| `src/app/dashboard/projets/[weekId]/soutenances/page.tsx` | Server | Élèves + Profs | Tableau des créneaux |
| `src/app/dashboard/projets/nouveau/page.tsx` | Server | Profs uniquement | Formulaire création semaine projet |

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/projects/components/ProjectWeekCard.tsx` | Carte d'une semaine projet (titre, dates, nb groupes) |
| `src/modules/projects/components/CreateWeekForm.tsx` | Formulaire création semaine (prof) |
| `src/modules/projects/components/GroupList.tsx` | Liste des groupes avec membres et capacité |
| `src/modules/projects/components/GroupCard.tsx` | Carte groupe : membres, liens, note, badge capacité |
| `src/modules/projects/components/JoinGroupButton.tsx` | Bouton rejoindre/quitter (Client Component, optimistic UI) |
| `src/modules/projects/components/SubmitLinksForm.tsx` | Formulaire dépôt repo + slides (membres du groupe) |
| `src/modules/projects/components/GradeGroupForm.tsx` | Formulaire notation groupe (prof) |
| `src/modules/projects/components/SoutenanceGrid.tsx` | Grille des créneaux (vert=libre, rouge=pris) |
| `src/modules/projects/components/BookSlotButton.tsx` | Bouton réservation créneau (Client Component) |
| `src/modules/projects/components/RetroBoard.tsx` | Mur rétro 3 colonnes temps réel (Client Component) |
| `src/modules/projects/components/RetroBoardColumn.tsx` | Colonne unique du mur (Aimé / Pas aimé / Idées) |
| `src/modules/projects/components/PostitCard.tsx` | Post-it individuel avec bouton suppression |
| `src/modules/projects/components/AddPostitForm.tsx` | Formulaire ajout post-it (type, contenu, anonyme?) |

### 3.4 Types TypeScript

Fichier : `src/modules/projects/types/index.ts`

```typescript
export interface ProjectWeek {
  id: string;
  title: string;
  class_id: string;
  start_date: string;
  end_date: string;
  cree_par: string;
  created_at: string;
}

export interface ProjectGroup {
  id: string;
  week_id: string;
  group_name: string;
  repo_url?: string;
  slides_url?: string;
  capacite_max: number;
  note?: number;
  feedback_prof?: string;
  note_par?: string;
  members?: GroupMember[];
}

export interface GroupMember {
  group_id: string;
  student_id: string;
  joined_at: string;
  // Jointure depuis student_profiles :
  nom?: string;
  prenom?: string;
}

export interface SoutenanceSlot {
  id: string;
  week_id: string;
  heure_debut: string;
  heure_fin: string;
  group_id?: string;  // null = disponible
}

export interface RetroBoard {
  id: string;
  week_id: string;
  is_open: boolean;
}

export type PostitType = 'POSITIVE' | 'NEGATIVE' | 'IDEA';

export interface RetroPostit {
  id: string;
  board_id: string;
  type: PostitType;
  content: string;
  is_anonymous: boolean;
  author_id: string;
  created_at: string;
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter `docs/sql/02_projets_groupes_retro.sql` dans Supabase Studio. Vérifier que les 6 tables sont créées et que toutes les RLS sont actives. Tester que la contrainte `UNIQUE (session_id, student_id)` sur `group_members` bloque bien un double-join.
- [ ] **Étape 2 — Realtime Supabase** : Dans Supabase Dashboard → Database → Replication → activer `retro_postits` et `soutenance_slots`. Le SQL contient déjà `ALTER PUBLICATION supabase_realtime ADD TABLE ...` mais vérifier visuellement dans le dashboard.
- [ ] **Étape 3 — Types** : Créer `src/modules/projects/types/index.ts` avec toutes les interfaces ci-dessus.
- [ ] **Étape 4 — Actions semaines projets** : `getProjectWeeks(classId)` — appeler `getCurrentUserProfile()`, récupérer le `class_id`, requêter `project_weeks`. `createProjectWeek(data)` — vérifier côté serveur que le rôle est `professeur` avant l'insert.
- [ ] **Étape 5 — Page hub `/dashboard/projets`** : Server Component. Liste les semaines projets de la classe avec `ProjectWeekCard`. Bouton "Créer une semaine" visible uniquement si rôle `professeur`.
- [ ] **Étape 6 — Gestion des groupes** : `GroupList.tsx` — fetcher `project_groups` avec jointure sur `group_members` + jointure sur `student_profiles` pour afficher les noms. Afficher la capacité restante (`capacite_max - COUNT(members)`). `JoinGroupButton.tsx` — Client Component avec optimistic UI : mettre à jour l'UI immédiatement, confirmer via l'action `joinGroup`. Vérifier côté serveur qu'un élève ne peut appartenir qu'à un seul groupe par semaine.
- [ ] **Étape 7 — Dépôt de livrables** : `SubmitLinksForm.tsx` visible uniquement pour les membres du groupe. Champs URL pour GitHub et Slides. Validation basique : `url.startsWith('https://')`. Appel `updateGroupLinks()`.
- [ ] **Étape 8 — Notation prof** : `GradeGroupForm.tsx` visible uniquement si rôle `professeur`. Input numérique (0-20) + textarea feedback. Appel `gradeGroup()`. Afficher la note sur la `GroupCard` si elle existe.
- [ ] **Étape 9 — Créneaux de soutenance** : `SoutenanceGrid.tsx` — grille des créneaux. Cellule verte = libre (bouton "Réserver"), rouge = pris (afficher nom du groupe). `BookSlotButton.tsx` — appel `bookSlot(slotId, groupId)`. Utiliser `revalidatePath` après réservation. En cas de conflit (créneau déjà pris), afficher un toast d'erreur "Ce créneau vient d'être pris".
- [ ] **Étape 10 — Mur de Rétro (cœur du module)** :
  - `RetroBoard.tsx` est un **Client Component**.
  - Charger les post-its initiaux côté serveur (passés en props depuis la page).
  - S'abonner via `supabase.channel('retro-[boardId]').on('postgres_changes', { event: '*', table: 'retro_postits', filter: 'board_id=eq.[boardId]' }, callback)`.
  - Gérer les 3 events : `INSERT` (ajouter le post-it dans la colonne), `DELETE` (retirer), `UPDATE` (mettre à jour).
  - `RetroBoardColumn.tsx` — colonnes colorées via les tokens CSS sémantiques définis dans `globals.css` : `POSITIVE` → `bg-[var(--color-retro-positive)]`, `NEGATIVE` → `bg-[var(--color-retro-negative)]`, `IDEA` → `bg-[var(--color-retro-idea)]`. Ne jamais utiliser de couleurs Tailwind hardcodées (`bg-green-100` etc.).
  - `PostitCard.tsx` — si `is_anonymous = true`, afficher "Anonyme" à la place du nom. Bouton suppression visible uniquement si `author_id = currentUser.id`.
  - `AddPostitForm.tsx` — select type + textarea contenu + checkbox "Anonyme". Désactivé si `board.is_open = false`. Appel `addPostit()`.
  - Bouton "Ouvrir/Fermer le board" visible uniquement si rôle `professeur`. Appel `toggleRetroBoard()`.
- [ ] **Étape 11 — Commit** : `git commit -m "feat(projects): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** modifier `src/modules/auth/`, `src/modules/pedagogy/`, ni aucune table des modules 1 à 6.
- **NE PAS** recréer les fonctions `is_class_member()` ou `is_class_teacher()` — elles existent déjà depuis le Module 2.
- **NE PAS** implémenter de drag-and-drop pour les post-its — les colonnes sont fixes, seul l'ajout/suppression est requis.
- **NE PAS** stocker les livrables (PDF, ZIP) dans Supabase Storage — uniquement des URLs externes (GitHub, Google Drive, Notion…).
- **NE PAS** permettre à un élève de modifier le contenu d'un post-it d'un autre élève, même si `is_anonymous = true`.
- **NE PAS** afficher `author_id` brut si `is_anonymous = true` — toujours remplacer par `"Anonyme"` côté client ET côté serveur (ne pas envoyer le nom au front).
- **Dépendances autorisées :**
  - `import { getCurrentUserProfile } from '@/modules/auth/actions'` (Module 1)
  - Aucun import depuis les modules 2, 3, 4, 5, 6
- **Composants UI communs :** Si Dev 1 a créé des composants dans `src/components/ui/` (Boutons, Inputs, Badge…), les utiliser sans les modifier.
