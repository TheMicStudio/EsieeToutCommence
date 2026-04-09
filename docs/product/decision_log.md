# Journal des Décisions — EsieeToutCommence

**Ref :** US16, US39

> Chaque décision structurante est tracée ici avec sa date, son contexte, les options envisagées et le compromis accepté.

---

## DEC-001 — Choix de Next.js App Router plutôt que Pages Router

**Date :** 2026-04-07
**Contexte :** Choix du framework frontend pour le projet.
**Options envisagées :**
- Next.js Pages Router (stable, documenté)
- Next.js App Router (React Server Components, Server Actions)
- Remix (routing similaire)

**Choix retenu :** Next.js App Router

**Raison :** Les Server Actions permettent d'appeler la base de données sans écrire d'API REST, réduisant la surface d'attaque. Les RSC améliorent les performances sans configuration. Compatible avec Supabase SSR.

**Compromis accepté :** Courbe d'apprentissage plus raide que le Pages Router. Certaines libs tierces ne supportent pas encore les RSC.

---

## DEC-002 — Supabase comme backend complet (Auth + DB + Storage + Realtime)

**Date :** 2026-04-07
**Contexte :** Choix de la couche données et authentification.
**Options envisagées :**
- Supabase (PostgreSQL managé + Auth + RLS)
- Firebase (NoSQL)
- PocketBase (self-hosted)
- Prisma + NeonDB + NextAuth

**Choix retenu :** Supabase

**Raison :** La RLS (Row Level Security) de PostgreSQL permet de définir les droits d'accès directement en base, sans code applicatif. Supabase Realtime est natif. L'interface Studio simplifie la gestion pour une équipe étudiante.

**Compromis accepté :** Vendor lock-in Supabase. En cas de changement de provider, les policies RLS et les fonctions SQL devront être réécrites.

---

## DEC-003 — Architecture modulaire 1 dev = 1 branche = 1 module

**Date :** 2026-04-07
**Contexte :** Organisation du travail en équipe de 4 sur un projet "Full Vibe Coding".
**Options envisagées :**
- Trunk-based development (tout le monde sur main)
- Feature branches classiques (par fonctionnalité)
- Modules isolés avec branches dédiées par développeur

**Choix retenu :** Modules isolés avec branches dédiées

**Raison :** Le vibe coding génère du code rapidement. Sans isolation stricte, les conflits Git entre 4 IA codant en parallèle seraient ingérables. La règle "1 fichier = 1 module = 1 dev" élimine les collisions.

**Compromis accepté :** Moins de flexibilité. Un dev ne peut pas toucher au module d'un autre sans validation explicite. Les features transversales doivent être planifiées.

---

## DEC-004 — Docker comme environnement de référence (pas Node.js local)

**Date :** 2026-04-07
**Contexte :** Uniformisation des environnements de développement entre les 4 devs.
**Options envisagées :**
- Node.js local (chacun gère son environnement)
- Docker + docker-compose

**Choix retenu :** Docker + docker-compose

**Raison :** Garantit que tout le monde a exactement le même environnement. Évite les "ça marche chez moi". Prépare le déploiement.

**Compromis accepté :** Overhead Docker (rebuild nécessaire après changement de dépendances). Moins rapide qu'un `npm run dev` direct en développement actif.

---

## DEC-005 — Server Actions plutôt qu'API REST publique

**Date :** 2026-04-07
**Contexte :** Communication entre le frontend et la base de données.
**Options envisagées :**
- API REST classique (`/api/v1/...`)
- tRPC
- Server Actions Next.js

**Choix retenu :** Server Actions (avec une exception : `/api/attendance/checkin` pour le mobile)

**Raison :** Les Server Actions ne créent pas d'endpoints publics exposés sur internet. Le typage est end-to-end sans configuration supplémentaire. Simplifie le code (pas de fetch côté client pour les mutations).

**Compromis accepté :** Moins testable unitairement (les Server Actions nécessitent un environnement Next.js). Le scan QR mobile nécessite une vraie API Route (exception documentée).

---

## DEC-006 — SonarCloud plutôt que SonarQube self-hosted

**Date :** 2026-04-07
**Contexte :** Analyse qualité du code en CI/CD.
**Options envisagées :**
- SonarQube local (Docker)
- SonarCloud (cloud, gratuit pour projets publics)

**Choix retenu :** SonarCloud

**Raison :** Gratuit pour les projets publics, intégration GitHub native, pas d'infrastructure à maintenir. Adapté à un projet étudiant.

**Compromis accepté :** Le projet doit être public sur GitHub (ou avoir une licence SonarCloud étudiante). Les analyses sont sur les serveurs de SonarSource.

---

## DEC-007 — Tailwind CSS v4 + shadcn/ui + Outfit + palette projet

**Date :** 2026-04-07
**Contexte :** Choix du système de styles UI, de la typographie et de la palette de couleurs.
**Options envisagées :**
- Tailwind CSS seul + composants maison
- shadcn/ui (composants Tailwind)
- MUI / Ant Design

**Choix retenu :** Tailwind CSS v4 + **shadcn/ui** pour les composants, **Outfit** (Google Fonts) comme font unique, palette de 5 couleurs projet mappée sur les tokens shadcn.

**Palette :**
| Nom | Hex | Token |
|-----|-----|-------|
| Bright Teal Blue | `#0471a6` | `--primary` |
| Ocean Blue | `#3685b5` | `--ring` |
| Wisteria Blue | `#89aae6` | `--secondary` |
| Dusty Mauve | `#ac80a0` | `--accent` |
| Ink Black | `#061826` | `--background` (dark) |

**Raison :** shadcn/ui donne des composants accessibles prêts à l'emploi sans surcharge de dépendances. Outfit est lisible et moderne pour une plateforme scolaire. La palette volontairement restreinte garantit la cohérence visuelle entre les 4 développeurs.

**Compromis accepté :** Respecter les tokens shadcn (jamais de couleurs Tailwind hardcodées). Voir `docs/technical/ui_guidelines.md`.
