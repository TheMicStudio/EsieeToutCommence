# Audit Frontend — Hub École
> Date : 2026-04-07  
> Basé sur une lecture exhaustive de tous les fichiers tsx/ts du projet.  
> Objectif : recenser tous les problèmes à corriger pour avoir un produit propre, professionnel et fonctionnel.

---

## Sommaire

1. [Sécurité & Accès](#1-sécurité--accès)
2. [Panel Admin — Fonctionnalités manquantes](#2-panel-admin--fonctionnalités-manquantes)
3. [Données hardcodées à dynamiser](#3-données-hardcodées-à-dynamiser)
4. [Problèmes de navigation & UX](#4-problèmes-de-navigation--ux)
5. [Bugs logique métier](#5-bugs-logique-métier)
6. [Incohérences & dette technique](#6-incohérences--dette-technique)
7. [États vides & messages d'erreur](#7-états-vides--messages-derreur)
8. [Plan de travail priorisé](#8-plan-de-travail-priorisé)

---

## 1. Sécurité & Accès

### 🔴 CRITIQUE — Inscription publique sans contrôle de rôle
**Fichier :** `src/modules/auth/components/RegisterForm.tsx` + `src/modules/auth/actions.ts`

N'importe qui peut s'inscrire comme `admin` directement depuis `/auth/register`. Le formulaire expose les 4 rôles (élève, professeur, admin, entreprise) en libre-service. Aucune validation côté serveur ne vérifie si le rôle est autorisé à s'auto-créer.

**Ce qui doit changer :**
- L'inscription publique doit être limitée aux rôles `eleve` et `entreprise` (ou désactivée complètement si c'est l'admin qui crée tous les comptes).
- Les rôles `professeur` et `admin` ne doivent être créables que depuis le panel admin.

---

### 🔴 CRITIQUE — Mot de passe transmis en champ hidden HTML
**Fichier :** `src/modules/auth/components/RegisterForm.tsx` ligne 187

Entre l'étape 1 et l'étape 2 du formulaire, le mot de passe est réinjecté via `<input type="hidden" name="password" value={step1.password} />`. Ce pattern expose le mot de passe dans le DOM en clair, accessible via les outils développeur.

**Ce qui doit changer :**
- Stocker temporairement dans un `ref` ou state React sans le remettre dans le DOM.
- Ou fusionner les deux étapes en une seule soumission.

---

### 🟡 MOYEN — Les admins accèdent à la page émargement sans utilité
**Fichier :** `src/app/dashboard/emargement/page.tsx` ligne 12

La page émargement autorise les admins (`profile.role !== 'professeur' && profile.role !== 'admin'`), mais les admins ne sont jamais dans `teacher_classes` donc ils obtiennent 0 classe et un formulaire vide inutile.

**Ce qui doit changer :**
- Soit retirer l'accès admin à cette page.
- Soit donner à l'admin une vue de supervision (voir toutes les sessions actives).

---

### 🟡 MOYEN — Bouton "Nouveau ticket" visible pour les admins
**Fichier :** `src/app/dashboard/support/page.tsx` ligne 31

Le bouton "Nouveau ticket" est affiché pour tout le monde, y compris les admins. Sémantiquement, c'est l'admin qui *traite* les tickets, pas qui en crée.

---

## 2. Panel Admin — Fonctionnalités manquantes

### 🔴 CRITIQUE — Aucune création de compte depuis le panel admin
**Fichier :** `src/modules/admin/users-actions.ts`

La fonction `createUser()` n'existe pas. L'admin ne peut que **supprimer** des utilisateurs. Pour ajouter un prof ou un admin, il faut passer par l'inscription publique (voir problème de sécurité ci-dessus).

**Ce qui doit être créé :**
- `createUser(formData)` dans `users-actions.ts` utilisant `admin.auth.admin.createUser()`.
- Formulaire dans `UsersPanel` avec : email, prénom, nom, rôle, et champs spécifiques au rôle (type_parcours pour élève, matieres pour prof, fonction pour admin).
- Une fois le compte créé, l'admin peut directement affecter l'élève à une classe.

---

### 🔴 CRITIQUE — Aucune édition de profil depuis le panel admin
**Fichiers :** `src/app/dashboard/admin/UsersPanel.tsx`, `src/modules/admin/users-actions.ts`

Le tableau des utilisateurs affiche uniquement Supprimer. Il n'y a aucun moyen d'éditer :
- Le nom/prénom d'un utilisateur.
- Le `type_parcours` d'un élève (temps plein ↔ alternant).
- Les matières enseignées d'un prof.
- La fonction d'un admin.

**Ce qui doit être créé :**
- Bouton "Éditer" sur chaque ligne du tableau.
- Modal ou page dédiée avec le formulaire d'édition selon le rôle.
- Actions `updateStudent()`, `updateTeacher()`, `updateAdmin()` dans `users-actions.ts`.

---

### 🔴 CRITIQUE — Champ "Matière" dans l'assignation prof = texte libre
**Fichier :** `src/app/dashboard/admin/AdminClassPanel.tsx` ligne 154

```tsx
<input name="matiere" placeholder="Matière enseignée" required ... />
```

Lors de l'assignation d'un prof à une classe, la matière est saisie en texte libre. Rien n'empêche de taper "math", "Maths", "Mathématiques" pour la même matière, ce qui crée des incohérences dans les notes, les stats et le chat.

**Ce qui doit changer :**
- Ce champ doit être un `<select>` peuplé avec les `matieres_enseignees` du prof sélectionné.
- Chargement dynamique : quand l'admin change le prof sélectionné, les matières disponibles se mettent à jour.

---

### 🔴 CRITIQUE — Les enseignants assignés à une classe ne sont pas affichés
**Fichier :** `src/app/dashboard/admin/AdminClassPanel.tsx`

Dans `ClassDetail`, seuls les élèves sont listés avec un bouton "Retirer". Les enseignants assignés à la classe ne sont **pas affichés**. On peut en ajouter mais pas voir qui est déjà là, ni retirer quelqu'un.

**Ce qui doit changer :**
- Fetcher les assignations `teacher_classes` pour la classe affichée.
- Lister les profs avec leur matière, et un bouton "Retirer".
- La fonction `removeTeacherFromClass(teacherId, classId, matiere)` existe déjà dans `actions.ts`, il manque juste l'UI.

---

### 🟡 MOYEN — Label sidebar admin trompeur
**Fichier :** `src/modules/auth/components/DashboardSidebar.tsx` ligne 51

Le lien admin s'appelle "Gestion classes" alors que le panel gère aussi les utilisateurs et l'alternance.

**Ce qui doit changer :**
- Renommer en "Administration" ou "Gestion générale".

---

### 🟡 MOYEN — Élèves sans classe : alerte mais pas d'action rapide
**Fichier :** `src/app/dashboard/admin/AdminClassPanel.tsx` ligne 266

La zone orange liste les élèves sans classe mais depuis cette vue il faut ouvrir une classe puis chercher l'élève dans le dropdown pour l'affecter. Pas d'action directe depuis l'alerte.

**Ce qui doit changer :**
- Ajouter un lien ou un sélecteur de classe directement depuis l'alerte orange.

---

## 3. Données hardcodées à dynamiser

### 🔴 CRITIQUE — Liste des matières dupliquée en 3 endroits et non éditable

**Fichiers :**
- `src/modules/auth/components/RegisterForm.tsx` ligne 18 — 15 matières
- `src/modules/auth/components/ProfileEditForm.tsx` ligne 10 — 15 matières  
- `src/app/dashboard/admin/AdminClassPanel.tsx` ligne 154 — texte libre (lié)

La liste des matières est en dur dans le code. Un admin ne peut pas ajouter "Robotique" ou "Marketing Digital" sans modifier le code source.

**Ce qui doit être fait :**
- Créer une table `subjects` en base (ou une config admin).
- Panel admin : section "Matières" pour ajouter/supprimer/renommer.
- Remplacer les tableaux hardcodés par un fetch de cette table.
- La liste doit être la même partout (source de vérité unique).

---

### 🔴 CRITIQUE — Liste des fonctions admin incohérente entre les deux formulaires

**Fichiers :**
- `src/modules/auth/components/RegisterForm.tsx` ligne 36 — **10 fonctions** (dont RH, Communication, Référent numérique, Autre)
- `src/modules/auth/components/ProfileEditForm.tsx` ligne 16 — **7 fonctions** (sans RH, Communication, etc.)

Les deux listes sont différentes ! Un admin inscrit avec "Ressources humaines" ne retrouvera pas cette valeur dans son formulaire d'édition.

**Ce qui doit être fait :**
- Même solution que les matières : table `admin_functions` dynamique.
- Source unique partagée entre inscription et édition.

---

### 🔴 CRITIQUE — Catégories de tickets hardcodées
**Fichier :** `src/modules/support/components/TicketForm.tsx` lignes 52-57

```tsx
<option value="pedagogie">Pédagogie</option>
<option value="batiment">Bâtiment</option>
<option value="informatique">Informatique</option>
<option value="autre">Autre</option>
```

Aussi dans `src/modules/support/types/index.ts` (type TypeScript + CATEGORIE_LABELS).

Un établissement peut avoir besoin de "Restauration", "Transport", "Vie étudiante", etc.

**Ce qui doit être fait :**
- Table `ticket_categories` gérée par l'admin.
- Interface admin pour créer/archiver des catégories.
- Le type TypeScript `TicketCategorie` doit devenir `string` (ou un type dynamique).

---

### 🟡 MOYEN — Rôles secondaires figés dans le type TypeScript
**Fichier :** `src/modules/auth/types/index.ts` ligne 20

```ts
role_secondaire?: 'delegue' | 'ambassadeur';
```

Les rôles secondaires sont hardcodés dans le type. L'admin ne peut pas créer de nouveaux rôles (ex: "Représentant BDE", "Tuteur pédagogique") ni les assigner proprement.

**Ce qui doit être fait :**
- Table `secondary_roles` : id, label, description.
- Table `student_secondary_roles` : student_id, role_id (relation many-to-many).
- Interface admin : créer des rôles secondaires, les assigner à des élèves via checkboxes.
- Remplacer le champ texte libre / type figé par cette structure.

---

### 🟡 MOYEN — Durée du QR code limitée à 5 ou 10 minutes
**Fichier :** `src/modules/attendance/components/StartSessionForm.tsx` ligne 70

Seulement deux options hardcodées. Certains contextes (amphi, TP long) nécessitent plus.

**Ce qui doit changer :**
- Ajouter 15 et 30 minutes, ou un champ libre avec validation min/max.

---

## 4. Problèmes de navigation & UX

### 🔴 CRITIQUE — Les élèves n'ont aucun accès au scan QR depuis l'interface
**Fichiers :** `src/modules/auth/components/DashboardSidebar.tsx`, `src/app/dashboard/page.tsx`

La page `/dashboard/emargement/scan` existe mais elle n'est référencée **nulle part** dans la sidebar ni dans les cards du dashboard élève. Un élève doit connaître l'URL par cœur pour pointer sa présence.

**Ce qui doit changer :**
- Ajouter un lien "Pointer ma présence" (icône QR) dans la sidebar élève.
- Ajouter une card "Émargement" dans le dashboard élève.

---

### 🟡 MOYEN — Sidebar : lien actif ne remonte pas sur les sous-pages
**Fichier :** `src/modules/auth/components/DashboardSidebar.tsx` ligne 89

```ts
const isActive = pathname === item.href;
```

Sur `/dashboard/pedagogie/cours`, le lien "Mes cours" (href `/dashboard/pedagogie`) n'est **pas** mis en surbrillance car le match est exact. Idem pour toutes les sous-pages.

**Ce qui doit changer :**
- Remplacer par `pathname.startsWith(item.href)` (avec exception pour `/dashboard` exact).

---

### 🟡 MOYEN — Annuaire incomplet : pas de filtre par classe, pas de rôles secondaires
**Fichier :** `src/modules/auth/components/AnnuaireGrid.tsx`

- Pas de filtre par classe (utile pour un prof qui veut retrouver ses élèves).
- Le rôle secondaire (`delegue`, `ambassadeur`) n'est pas affiché sur la card élève.
- Les admins et entreprises ne sont pas dans l'annuaire (OK côté vie privée, mais à documenter).

**Ce qui doit changer :**
- Ajouter un filtre par classe si l'utilisateur est prof ou admin.
- Afficher un badge "Délégué" si `role_secondaire === 'delegue'`.

---

### 🟡 MOYEN — Page pédagogie : même nav pour élèves et profs
**Fichier :** `src/app/dashboard/pedagogie/page.tsx`

Les 3 cards (Cours, Notes, Chat) sont identiques pour élèves et profs. Un prof devrait voir "Gérer les notes" et non "Consulter mes notes". Les descriptions sont génériques et ne reflètent pas le rôle.

---

### 🟢 MINEUR — Aucun breadcrumb sur les pages profondes
Sur les pages comme `/dashboard/emargement/session/[id]` ou `/dashboard/support/[ticketId]`, l'utilisateur n'a aucun fil d'Ariane pour savoir où il est et revenir en arrière (juste le lien dans la sidebar qui n'est pas actif).

---

### 🟢 MINEUR — Support : accès admin au Kanban via un bouton, pas dans la sidebar
**Fichier :** `src/app/dashboard/support/page.tsx` ligne 27

La vue Kanban admin est accessible via un bouton sur la page support, pas directement depuis la sidebar. L'admin fait un aller-retour inutile.

**Ce qui doit changer :**
- Ajouter "Kanban" comme lien direct dans la sidebar admin, ou rediriger directement l'admin vers le Kanban.

---

## 5. Bugs logique métier

### 🔴 CRITIQUE — convertTicketToFaq utilise la description initiale comme réponse FAQ
**Fichier :** `src/modules/support/actions.ts` ligne 204

```ts
reponse: ticket.description,  // ← c'est la description du problème par l'élève, pas la réponse admin !
```

Quand un ticket est converti en FAQ, la "réponse" de l'article FAQ est la description du problème par l'élève, pas la réponse apportée par l'admin dans le fil.

**Ce qui doit changer :**
- Chercher le dernier message de l'admin dans `ticket_messages` et l'utiliser comme réponse.
- Ou ouvrir un modal de confirmation qui permet d'éditer la réponse avant publication.

---

### 🔴 CRITIQUE — ClassChat : noms des auteurs manquants pour les nouveaux messages temps réel
**Fichier :** `src/app/dashboard/pedagogie/chat/page.tsx` lignes 68-79

Les `authorNames` sont fetchés **uniquement** pour les auteurs des messages initiaux. Quand un nouveau message arrive via Realtime, si l'auteur n'avait pas encore de message dans le fil, son nom s'affiche "Utilisateur".

**Ce qui doit changer :**
- Soit fetcher tous les membres de la classe au chargement (auteurs potentiels).
- Soit appeler un fetch côté client quand un `author_id` inconnu apparaît dans un message Realtime.

---

### 🔴 CRITIQUE — KanbanBoard : les tickets "Fermés" sont invisibles
**Fichier :** `src/modules/support/components/KanbanBoard.tsx` ligne 17

`COLUMNS` ne contient que 3 entrées : `ouvert`, `en_cours`, `resolu`. Le statut `ferme` existe dans les types et dans `TicketThread` mais n'a pas de colonne. Les tickets fermés disparaissent du Kanban.

**Ce qui doit changer :**
- Ajouter une colonne "Fermé" dans `COLUMNS`.
- Ou créer un filtre "Afficher les tickets fermés" (toggle).

---

### 🟡 MOYEN — TicketThread : le statut affiché ne se met pas à jour après changement
**Fichier :** `src/modules/support/components/TicketThread.tsx` lignes 28-30

```ts
function handleStatusChange(statut: TicketStatut) {
  startTransition(async () => { await updateTicketStatus(ticket.id, statut); });
}
```

`updateTicketStatus` appelle `revalidatePath` côté serveur mais le composant est client. Sans refresh de la page ou mise à jour de l'état local, le badge de statut reste sur l'ancienne valeur jusqu'au prochain rechargement.

**Ce qui doit changer :**
- Ajouter un state local `[currentStatut, setCurrentStatut]` et le mettre à jour après l'action.
- Ou utiliser `router.refresh()` après l'action.

---

### 🟡 MOYEN — Session d'émargement : pas de matière indiquée dans le titre
**Fichier :** `src/app/dashboard/emargement/page.tsx` lignes 46-53

La liste des sessions passées affiche seulement la date. Si un prof a 3 cours le même jour (Maths, Algo, BDD), il ne sait pas quel rapport correspond à quel cours.

**Ce qui doit changer :**
- Ajouter un champ `matiere` à la session (`AttendanceSession`) lors de la création.
- L'afficher dans la liste des sessions passées et dans le rapport.

---

### 🟡 MOYEN — AssignStudentToClass : un élève peut être déplacé sans confirmation
**Fichier :** `src/modules/admin/actions.ts` ligne 146-149

```ts
await admin.from('class_members').delete().eq('student_id', studentId); // supprime l'ancienne affectation sans avertir
await admin.from('class_members').insert({ class_id: classId, student_id: studentId });
```

Si l'élève était dans une autre classe, il en est retiré silencieusement. Pas d'avertissement dans l'UI.

**Ce qui doit changer :**
- Afficher un avertissement si l'élève est déjà dans une classe ("Cet élève est actuellement en Bac3 IT, voulez-vous le déplacer ?").

---

### 🟢 MINEUR — EmargementPage appelle auth.getUser() en double
**Fichier :** `src/app/dashboard/emargement/page.tsx` lignes 14-17

`getCurrentUserProfile()` appelle déjà `supabase.auth.getUser()`. La page rappelle ensuite `supabase.auth.getUser()` pour obtenir l'`user.id`. Double appel réseau inutile.

**Ce qui doit changer :**
- Utiliser `userProfile.profile.id` qui est déjà disponible depuis `getCurrentUserProfile()`.

---

## 6. Incohérences & dette technique

### 🔴 CRITIQUE — MATIERES et FONCTIONS dupliquées (source de vérité éclatée)
- `MATIERES` : définie dans `RegisterForm.tsx` ET `ProfileEditForm.tsx` (même liste mais deux endroits).
- `FONCTIONS` : définie dans `RegisterForm.tsx` (10 items) ET `ProfileEditForm.tsx` (7 items, **liste différente !**).

Toute modification nécessite de mettre à jour plusieurs fichiers. Les désynchronisations entraînent des bugs silencieux (valeur en base non affichable dans l'UI d'édition).

**Ce qui doit être fait :**
- Centraliser dans un fichier de constantes `src/lib/constants.ts` en attendant la version dynamique.
- À terme : table en base gérée par l'admin.

---

### 🟡 MOYEN — ROLE_LABELS dupliqué
- Défini dans `src/modules/auth/types/index.ts`.
- Re-défini dans `src/app/dashboard/admin/UsersPanel.tsx` (lignes 16-21) avec des valeurs légèrement différentes (`'Admin'` vs `'Administration'`).

---

### 🟡 MOYEN — AdminClassPanel n'affiche pas les profs déjà assignés
**Fichier :** `src/app/dashboard/admin/AdminClassPanel.tsx`

La section "Enseignants" ne liste que le formulaire d'ajout. Les profs déjà assignés (avec leur matière) ne sont pas visibles. La fonction `getClassTeacherAssignments()` existe dans `actions.ts` mais n'est pas utilisée dans l'UI.

---

### 🟡 MOYEN — signUp utilise le client anon pour créer l'auth user
**Fichier :** `src/modules/auth/actions.ts` ligne 84

```ts
const { data: authData, error: authError } = await supabase.auth.signUp(...)
```

Utiliser le client anon pour signUp est correct en Supabase, mais cela signifie que si l'email confirmation est activée dans Supabase, l'utilisateur sera redirigé vers `/dashboard` sans avoir confirmé son email, et `getCurrentUserProfile()` peut échouer.

**À vérifier :**
- Comportement avec email confirmation activée.
- Gérer l'état "compte créé mais non confirmé".

---

### 🟢 MINEUR — CourseMaterialList sans recherche ni filtre par matière
**Fichier :** `src/modules/pedagogy/components/CourseMaterialList.tsx`

Pas de recherche, pas de filtre. Avec 50+ ressources, la liste devient ingérable.

---

### 🟢 MINEUR — GradeBook sans possibilité de suppression
**Fichier :** `src/modules/pedagogy/components/GradeBook.tsx`

Un prof ne peut qu'ajouter des notes. Il ne peut pas supprimer une note saisie par erreur.

---

### 🟢 MINEUR — Pas de pagination sur les listes longues
- `UsersPanel` : tableau de tous les utilisateurs sans pagination.
- `SupportPage` : liste de tous les tickets sans pagination.
- `AnnuaireGrid` : grille de toute la promo sans pagination.

---

## 7. États vides & messages d'erreur

### 🟡 MOYEN — Page support : état vide trompeur pour les élèves
**Fichier :** `src/modules/support/components/TicketList.tsx` (non lu mais inféré)

Quand un élève n'a pas de ticket, il voit probablement "Aucun ticket". Il devrait voir un message incitatif + bouton "Créer mon premier ticket".

---

### 🟡 MOYEN — Cours sans matière assignée : GradeGrid affiche un select vide
**Fichier :** `src/app/dashboard/pedagogie/notes/page.tsx` lignes 84-89

Si `teacher_classes` ne retourne aucune matière pour ce prof/classe, le select "Matière" est vide et le prof ne peut rien saisir. Pas de message d'erreur explicatif.

**Ce qui doit changer :**
- Afficher : "Vous n'avez pas de matière assignée pour cette classe. Contactez l'administration."

---

### 🟢 MINEUR — Aucun état de chargement sur la page admin
Quand l'admin supprime un utilisateur ou une classe, le composant reste figé pendant la transition. Pas de spinner, pas de feedback visuel.

---

## 8. Plan de travail priorisé

### Phase 1 — Critique (bloquant pour la démo) ✅ TERMINÉE

| # | Tâche | Statut |
|---|-------|--------|
| P1-01 | Création de compte depuis le panel admin (createUser) | ✅ |
| P1-02 | Édition de profil depuis le panel admin | ✅ |
| P1-03 | Afficher + retirer les profs assignés dans AdminClassPanel | ✅ |
| P1-04 | Champ matière → select dynamique lors de l'assignation prof | ✅ |
| P1-05 | Accès scan QR pour les élèves (sidebar + dashboard card) | ✅ |
| P1-06 | Sécuriser l'inscription (bloquer admin/professeur en auto-inscription) | ✅ |
| P1-07 | Corriger convertTicketToFaq (utiliser réponse admin, pas description élève) | ✅ |

### Phase 2 — Dynamisation des listes hardcodées ✅ TERMINÉE

| # | Tâche | Statut |
|---|-------|--------|
| P2-01 | Table `subjects` + interface admin + constants.ts | ✅ Migration + ConfigPanel |
| P2-02 | Table `admin_functions` + interface admin + constants.ts | ✅ Migration + ConfigPanel |
| P2-03 | Table `ticket_categories` + interface admin + TicketForm | ✅ Migration + ConfigPanel |
| P2-04 | Table `secondary_roles` + interface admin + checkboxes | ✅ Migration + ConfigPanel + UsersPanel |

### Phase 3 — Navigation & UX ✅ TERMINÉE

| # | Tâche | Statut |
|---|-------|--------|
| P3-01 | Sidebar : `startsWith` pour isActive | ✅ |
| P3-02 | Rediriger admin vers Kanban depuis sidebar + support/page.tsx | ✅ |
| P3-03 | Annuaire : filtre par classe + badge délégué/ambassadeur | ✅ |
| P3-04 | Labels admin renommés ("Gestion classes" → "Administration") | ✅ |
| P3-05 | Sidebar : lien Scanner QR pour élève | ✅ |

### Phase 4 — Bugs & robustesse ✅ TERMINÉE

| # | Tâche | Statut |
|---|-------|--------|
| P4-01 | KanbanBoard : colonne "Fermé" ajoutée | ✅ |
| P4-02 | TicketThread : statut local + router.refresh() | ✅ |
| P4-03 | ClassChat : fetch tous membres de la classe comme auteurs | ✅ |
| P4-04 | Centraliser MATIERES/FONCTIONS dans `src/lib/constants.ts` | ✅ |
| P4-05 | Émargement : double getUser supprimé, accès admin retiré | ✅ |
| P4-06 | AdminClassPanel : confirmation suppression classe | ✅ |

### Phase 5 — Notion d'école (multi-établissement)

| # | Tâche | Description |
|---|-------|-------------|
| P5-01 | Ajouter `school_id` sur tous les profils | Migration BDD, toutes les tables profils |
| P5-02 | Interface d'onboarding établissement | Nouvel écran admin first-time |
| P5-03 | Isolation des données par école | RLS Supabase + filtres |

---

> Ce document est la référence unique pour le roadmap de correction. Cocher les items au fur et à mesure de leur traitement.
