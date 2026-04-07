# BRANCHES_STATUS.md — Suivi en temps réel des branches

> **Ce fichier est la source de vérité sur l'état du projet.**
> Il DOIT être mis à jour par chaque IA (ou développeur) après chaque session de travail.
> Lu automatiquement par toutes les IA via `CLAUDE.md`.

**Dernière mise à jour :** 2026-04-07
**Mis à jour par :** Tech Lead (initialisation)

---

## Vue d'ensemble

```
main
├── feat/T01-auth-profiles-identite       [Dev 1] 🔴 PAS COMMENCÉ
├── feat/T02-pedagogy-espace-classe       [Dev 2] 🔴 PAS COMMENCÉ
├── feat/T03-career-alternance            [Dev 3] 🔴 PAS COMMENCÉ
├── feat/T04-support-faq-communication   [Dev 4] 🔴 PAS COMMENCÉ
└── feat/T07-projects-groupes-retro      [Dev 3] 🔴 PAS COMMENCÉ
```

**Légende :** 🔴 Pas commencé · 🟡 En cours · 🟢 Prêt pour review · ✅ Mergé sur main

---

## Détail par branche

---

### `feat/T01-auth-profiles-identite` — Dev 1

**Modules couverts :** Auth & Profils (`docs/features/01_module_auth_profils.md`)
**Statut :** 🔴 PAS COMMENCÉ

#### Fichiers modifiés (vs main)
_Aucun pour l'instant_

#### Checklist de progression
- [ ] SQL exécuté dans Supabase (tables `user_roles`, profils, RLS)
- [ ] `src/modules/auth/types/index.ts` créé
- [ ] `src/middleware.ts` créé
- [ ] Actions `signIn` / `signOut` / `signUp`
- [ ] `getCurrentUserProfile()` exportée et fonctionnelle ← **BLOQUANT pour tous les autres modules**
- [ ] Pages `/auth/login` et `/auth/register`
- [ ] Page `/dashboard` avec routage dynamique par rôle
- [ ] Annuaire filtrable

#### Dépendances
- **Bloque :** TOUS les autres modules (ils ont besoin de `getCurrentUserProfile`)
- **Bloqué par :** Rien

#### Notes
_Aucune pour l'instant_

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
- [ ] Pages pédagogie
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
| `docs/sql/01_init_schema.sql` | 🔴 Non exécuté | `user_roles`, `student_profiles`, `teacher_profiles`, `admin_profiles`, `company_profiles` |
| `docs/sql/02_projets_groupes_retro.sql` | 🔴 Non exécuté | `project_weeks`, `project_groups`, `group_members`, `soutenance_slots`, `retro_boards`, `retro_postits` |

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
