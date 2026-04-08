# BRANCHES_STATUS.md — Suivi en temps réel des branches

> **Ce fichier est la source de vérité sur l'état du projet.**
> Il DOIT être mis à jour par chaque IA (ou développeur) après chaque session de travail.
> Lu automatiquement par toutes les IA via `CLAUDE.md`.

**Dernière mise à jour :** 2026-04-08
**Mis à jour par :** Claude (redesign page notes élève : accordéons collapsibles par matière, badges note #0471a6, sidebar droite 280px avec Moyenne générale + progress bars par matière, fallback data si BDD vide)

---

## Vue d'ensemble

```
main  ← développement centralisé (tous modules codés sur main)
```

> ⚠️ Tous les modules sont développés directement sur `main` (décision d'équipe).
> Les branches feat/* n'ont pas encore été créées.

**Légende :** 🔴 Pas commencé · 🟡 En cours · 🟢 Prêt pour review · ✅ Mergé sur main

---

## Détail par branche

---

### `feat/T01-auth-profiles-identite` — Dev 1

**Modules couverts :** Auth & Profils (`docs/features/01_module_auth_profils.md`)
**Statut :** 🟡 EN COURS — Code complet, SQL à exécuter dans Supabase

#### Fichiers modifiés (vs main)
- `src/middleware.ts` — Protection routes `/dashboard/*` et `/auth/*`
- `src/app/page.tsx` — Redirect vers dashboard ou login
- `src/app/auth/login/page.tsx` — Page de connexion
- `src/app/auth/register/page.tsx` — Page d'inscription multi-étapes
- `src/app/auth/callback/route.ts` — Handler OAuth/Magic Link
- `src/app/dashboard/layout.tsx` — Layout avec sidebar responsive
- `src/app/dashboard/page.tsx` — Tableau de bord dynamique par rôle
- `src/app/dashboard/profile/page.tsx` — Page profil (lecture + édition)
- `src/app/dashboard/annuaire/page.tsx` — Trombinoscope filtrable
- `src/modules/auth/types/index.ts` — Types TypeScript complets
- `src/modules/auth/actions.ts` — signIn / signUp / signOut / getCurrentUserProfile / updateProfile
- `src/modules/auth/components/LoginForm.tsx` — redesign complet (icônes mail/lock, bouton cyan, OAuth buttons, "or" divider)
- `src/app/auth/login/page.tsx` — layout 2 panneaux 50/50 100vh, trust card, panneau navy + illustration SVG + glassmorphism card
- `src/modules/auth/components/RegisterForm.tsx`
- `src/modules/auth/components/ProfileCard.tsx`
- `src/modules/auth/components/ProfileEditForm.tsx`
- `src/modules/auth/components/AnnuaireGrid.tsx`
- `src/modules/auth/components/RoleGuard.tsx`
- `src/modules/auth/components/DashboardSidebar.tsx`
- `src/components/ui/input.tsx`, `label.tsx`, `card.tsx`, `badge.tsx`, `avatar.tsx`, `separator.tsx`, `tabs.tsx`

#### Checklist de progression
- [x] SQL exécuté dans Supabase (tables `user_roles`, profils, RLS) — via `supabase db push`
- [x] `src/modules/auth/types/index.ts` créé
- [x] `src/middleware.ts` créé
- [x] Actions `signIn` / `signOut` / `signUp`
- [x] `getCurrentUserProfile()` exportée et fonctionnelle ← **DÉBLOQUÉ pour tous les modules**
- [x] Pages `/auth/login` et `/auth/register`
- [x] Page `/dashboard` avec routage dynamique par rôle
- [x] Annuaire filtrable
- [ ] Tests manuels post-déploiement SQL

#### Dépendances
- **Bloque :** TOUS les autres modules (ils ont besoin de `getCurrentUserProfile`)
- **Bloqué par :** Exécution du SQL dans Supabase Studio

#### Notes
- `getCurrentUserProfile()` est opérationnelle dès que le SQL est exécuté.
- La sidebar est responsive : fixe `w-64` sur desktop, slide-in sur mobile.
- Design : font Outfit, palette Teal Blue / Wisteria / Dusty Mauve.

---

### `feat/T02-pedagogy-espace-classe` — Dev 2

**Modules couverts :** Pédagogie (`docs/features/02_module_pedagogie_classe.md`) + Émargement QR (`docs/features/06_module_emargement_qrcode.md`)
**Statut :** 🔴 PAS COMMENCÉ

#### Fichiers modifiés (vs main)
_Aucun pour l'instant_

#### Checklist de progression
**Module Pédagogie**
- [ ] SQL exécuté (classes, course_materials, grades, channels, messages + fonctions RLS)
- [ ] `src/modules/pedagogy/types/index.ts` créé
- [ ] Actions pédagogie (cours, notes, chat)
- [x] Page notes — redesign vue élève : accordéons collapsibles, badges #0471a6, sidebar droite 280px (moyenne générale + progress bars)
- [ ] Chat temps réel Supabase Realtime

**Module Émargement**
- [ ] SQL exécuté (attendance_sessions, attendance_records)
- [ ] `src/modules/attendance/types/index.ts` créé
- [ ] Génération QR Code (`qrcode.react`)
- [ ] Scanner QR côté élève (`@zxing/browser`)
- [ ] API Route `/api/attendance/checkin`
- [ ] Rapport de présence + export CSV

#### Dépendances
- **Bloque :** Module 7 (utilise `is_class_member()` et `is_class_teacher()` définis ici en SQL)
- **Bloqué par :** Module 1 (`getCurrentUserProfile`)

#### Notes
_Aucune pour l'instant_

---

### `feat/T03-career-alternance` — Dev 3

**Modules couverts :** Carrière & Alternance (`docs/features/03_module_carriere_alternance.md`)
**Statut :** 🔴 PAS COMMENCÉ

#### Fichiers modifiés (vs main)
_Aucun pour l'instant_

#### Checklist de progression
**Parcours Temps Plein**
- [ ] SQL exécuté (job_offers, career_events, event_registrations)
- [ ] Job Board fonctionnel
- [ ] Événements + inscriptions

**Parcours Alternant**
- [ ] SQL exécuté (tripartite_chats, tripartite_messages, apprenticeship_entries)
- [ ] Bucket Supabase Storage `apprenticeship-files` créé
- [ ] Chat tripartite temps réel
- [ ] Livret d'apprentissage (upload + workflow validation)
- [ ] `ValidationPanel` pour référent/maître

#### Dépendances
- **Bloque :** Rien
- **Bloqué par :** Module 1 (`getCurrentUserProfile`, `type_parcours`)

#### Notes
_Aucune pour l'instant_

---

### `feat/T04-support-faq-communication` — Dev 4

**Modules couverts :** Support & FAQ (`docs/features/04_module_support_faq.md`) + Communication Interne (`docs/features/05_module_com_interne.md`)
**Statut :** 🔴 PAS COMMENCÉ

#### Fichiers modifiés (vs main)
_Aucun pour l'instant_

#### Checklist de progression
**Module Support / FAQ**
- [ ] SQL exécuté (tickets, ticket_messages, faq_articles)
- [ ] Formulaire ticket avec suggestions FAQ en temps réel
- [ ] Gestion des droits Délégués
- [ ] Kanban admin
- [ ] Conversion ticket → FAQ
- [ ] Page FAQ publique `/faq`

**Module Communication Interne**
- [ ] SQL exécuté (staff_channels, staff_messages + fonction `is_staff()`)
- [ ] Seed : 2 canaux par défaut créés
- [ ] Chat staff temps réel
- [ ] Annuaire staff

#### Dépendances
- **Bloque :** Rien
- **Bloqué par :** Module 1 (`getCurrentUserProfile`), Module 2 (FK `class_id` dans `tickets`)

#### Notes
_Aucune pour l'instant_

---

### `feat/T07-projects-groupes-retro` — Dev 3

**Modules couverts :** Projets, Groupes & Rétro (`docs/features/07_module_projets_groupes_retro.md`)
**Statut :** 🔴 PAS COMMENCÉ

#### Fichiers modifiés (vs main)
_Aucun pour l'instant_

#### Checklist de progression
- [ ] SQL exécuté (`docs/sql/02_projets_groupes_retro.sql`)
- [ ] Realtime activé sur `retro_postits` et `soutenance_slots` dans le dashboard Supabase
- [ ] `src/modules/projects/types/index.ts` créé
- [ ] Actions semaines projets + groupes
- [ ] Gestion capacité max + contrainte 1 groupe par élève par semaine
- [ ] Dépôt de livrables (repo + slides)
- [ ] Notation par le prof
- [ ] Créneaux de soutenance (first come, first served)
- [ ] Mur de Rétro temps réel (3 colonnes, anonymat, ouverture/fermeture prof)

#### Dépendances
- **Bloque :** Rien
- **Bloqué par :**
  - Module 1 (`getCurrentUserProfile`)
  - Module 2 (fonctions SQL `is_class_member()` et `is_class_teacher()` doivent être créées en premier)

#### Notes
_Dev 3 doit d'abord terminer le Module 3 (ou en parallèle). Vérifier que les fonctions SQL du Module 2 sont déployées avant d'exécuter `02_projets_groupes_retro.sql`._

---

## SQL Migrations

| Fichier | Statut | Tables créées |
|---------|--------|---------------|
| `supabase/migrations/20260407130912_init_module_auth.sql` | ✅ Pushé | Auth, profils, user_roles, RLS |
| `supabase/migrations/20260407131117_init_module_pedagogy.sql` | ✅ Pushé | Classes, cours, notes, canaux |
| `supabase/migrations/20260407140000_init_module_attendance.sql` | ✅ Pushé | Sessions, émargements QR |
| `supabase/migrations/20260407132313_init_module_career.sql` | ✅ Pushé | Job offers, events, tripartite, livret |
| `supabase/migrations/20260407133054_init_module_support_com.sql` | ✅ Pushé | Tickets, FAQ, canaux staff |
| `supabase/migrations/20260407150000_init_module_projects.sql` | ✅ Pushé | Semaines, groupes, soutenances, rétro |
| `supabase/migrations/20260408000000_add_phone_columns.sql` | ✅ Pushé | Colonnes phone_mobile + phone_fixed |
| `supabase/migrations/20260408030000_class_members_is_current.sql` | ✅ Pushé | Multi-année : colonne is_current |
| `supabase/migrations/20260408040000_group_workspace.sql` | ✅ Pushé | group_messages, group_whiteboard, week_course_materials |
| `supabase/migrations/20260408050000_add_roles_coordinateur_staff.sql` | ✅ Pushé | Nouveaux rôles coordinateur + staff dans l'enum role_principal |
| `supabase/migrations/20260408060000_permissions_system.sql` | ✅ Pushé | Tables permissions, role_permissions, user_permission_overrides + seed 38 permissions × 7 rôles |

> ⚠️ Les migrations du Module 2 (classes, pedagogy, attendance) sont définies dans `docs/features/02_module_pedagogie_classe.md` et `docs/features/06_module_emargement_qrcode.md` — elles n'ont pas encore de fichier SQL dédié.

---

## Instructions de mise à jour de ce fichier

Après chaque session de développement, mettre à jour :
1. La **vue d'ensemble** (changer l'emoji de statut)
2. La section **Fichiers modifiés** de la branche concernée (via `git diff --name-only main..feat/XXX`)
3. La **Checklist de progression** (cocher les étapes terminées)
4. Les **Notes** (problèmes rencontrés, décisions prises, points de blocage)
5. Le tableau **SQL Migrations**
6. La date **"Dernière mise à jour"** en haut du fichier
