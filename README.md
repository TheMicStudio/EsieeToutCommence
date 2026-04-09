# Hub École — Plateforme de Gestion Scolaire

> **Plateforme LMS/ERP modulaire** pour écoles supérieures avec parcours mixtes (temps plein + alternance)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

---

## Table des matières

1. [À propos](#à-propos)
2. [Installation (5 min)](#installation)
3. [Lancer l'app](#lancer-lapplication)
4. [Configuration](#configuration)
5. [Exploitation](#exploitation)
6. [Architecture](#architecture)
7. [Documentation](#documentation)
8. [Support](#support)

---

## À propos

**Hub École** centralise en une seule plateforme :

| Module | Fonction |
|--------|----------|
| **Auth & Profils** | Authentification, gestion utilisateurs (Élève, Prof, Admin, Entreprise) |
| **Pédagogie** | Supports de cours, notes, discussions de classe |
| **Alternance & Carrière** | Livret d'apprentissage, tripartite, offres de stage |
| **Support & FAQ** | Système de tickets, FAQ intelligente |
| **Communication** | Canaux staff, annonces internes |
| **Émargement** | Appels numériques par QR Code (zéro fraude) |
| **Projets & Rétro** | Gestion semaines projets, murs de rétrospectives |

### Avantage clé

Chaque module est **développé indépendamment par 1 développeur dans sa propre branche** → **0 collision de code**.

---

## Installation

### Prérequis

- **Docker** 20.10+ [(installer)](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.0+ (inclus avec Docker Desktop)
- **Git** 2.0+ [(installer)](https://git-scm.com/)
- **Compte Supabase** gratuit [(créer)](https://app.supabase.com/sign-up)

> Node.js n'est **pas requis** — Docker inclut tout ce qu'il faut.

### Étapes (5 minutes)

#### 1. Cloner le projet

```bash
git clone https://github.com/TheMicStudio/EsieeToutCommence.git
cd EsieeToutCommence
```

#### 2. Configurer l'environnement

```bash
cp .env.example .env
```

#### 3. Récupérer les clés Supabase

1. Aller sur https://app.supabase.com → Sélectionner votre projet
2. **Settings → API** et copier-coller dans `.env` :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Sécurité :** `.env` est dans `.gitignore`. Ne JAMAIS le commiter. Les clés sont confidentielles — demander au Tech Lead si absent.

#### 4. Lancer l'app

```bash
docker compose up --build
```

**À la première exécution :** Attendez 1-2 min pour le build.  
**Ensuite :** `docker compose up` (plus rapide)

L'app est accessible sur **http://localhost:3000**

L'app est accessible sur **http://localhost:3000**

---

## Lancer l'application

### Mode Docker (recommandé)

```bash
# Premier lancement (build image)
docker compose up --build

# Relances suivantes (plus rapide)
docker compose up

# Arrêter
docker compose down

# Logs en temps réel
docker compose logs -f app

# Shell dans le conteneur
docker compose exec app sh
```

### Mode local (développement avancé)

```bash
# Installer dépendances
npm ci

# Démarrer
npm run dev

# Compiler TypeScript
npm run build

# Lint
npm run lint
```

---

## Configuration

### Variables obligatoires

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → Service Role Key |

### Notes de sécurité

- Variables commençant par `NEXT_PUBLIC_` → **exposées au navigateur** (c'est normal, limitées par RLS)
- `SUPABASE_SERVICE_ROLE_KEY` → **jamais exposée**, utilisée côté serveur seulement

---

## Exploitation

### Démarrage/Arrêt

```bash
# Démarrer en dev
docker compose up

# Arrêter (garde les données)
docker compose down

# Redémarrer sans rebuild
docker compose restart

# Arrêt complet (réinitialise BDD)
docker compose down -v
```

### Logs et dépannage

```bash
# Logs en temps réel
docker compose logs -f app

# Logs avec timestamps
docker compose logs --timestamps -f app

# Voir les 50 derniers logs
docker compose logs --tail=50 app

# Filtrer les erreurs
docker compose logs app | grep -i error
```

### Backup / Restore

```bash
# Backup BDD
docker compose exec db pg_dump -U postgres -d hub_ecole > backup_$(date +%Y%m%d).sql

# Restore depuis backup
docker compose exec -T db psql -U postgres -d hub_ecole < backup_20260409.sql
```

### Limitations connues

| Limitation | Contournement |
|-----------|--------------|
| Pas de Web Push | Phase 2 : implémenter Service Worker |
| Realtime 250 users max | Tier Business Supabase (+$25/m) |
| Attachements 5MB max | Demander augmentation |
| Storage 10GB gratuit | Monitorer `storage.objects` |

### Dépannage

**L'app ne démarre pas ?**
```bash
docker compose logs app | tail -50
docker compose down -v && docker compose up --build
```

**Impossible de se connecter à Supabase ?**
- Vérifier `.env` contient les bonnes clés
- Vérifier votre projet existe dans Supabase Dashboard

**Conteneur refuse de redémarrer ?**
```bash
docker compose down --remove-orphans
docker compose up
```

---

## Architecture

### Stack Technique

| Couche | Tech | Pourquoi |
|-------|------|---------|
| **Frontend** | Next.js 16 + React 19 | SSR, TypeScript natif, Server Components |
| **Langage** | TypeScript | Typage statique, IDE, moins de bugs |
| **Styling** | Tailwind CSS v4 | Utility-first, zéro CSS custom |
| **Backend** | Supabase (PostgreSQL) | Managed, RLS natif, Auth intégré, Realtime |
| **Orchestration** | Docker Compose | Dev ≈ Prod, reproductibilité |

### Structure du code

```
src/
├── app/                  # Pages & routes (Next.js App Router)
├── modules/              # Code métier isolé par module
│   ├── auth/            # Dev 1 — Authentification
│   ├── pedagogy/        # Dev 2 — Pédagogie
│   ├── career/          # Dev 3 — Carrière
│   ├── support/         # Dev 4 — Support
│   ├── attendance/      # Dev 2 — Émargement
│   └── projects/        # Dev 3 — Projets
├── lib/                 # Utilitaires partagés (Supabase, permissions, constants)
└── components/          # Composants UI réutilisables

supabase/
├── migrations/          # Migrations SQL versionnées
└── seed.sql            # Données de test

docs/
├── features/           # Specs techniques par module
├── technical/          # Architecture détaillée
├── governance/         # Processus équipe
└── product/            # Vision & produit
```

### Sécurité

- **Authentification** → Supabase Auth (JWT tokens)
- **Autorisation** → Row-Level Security (RLS) PostgreSQL
- **Server Actions** → Exécution côté serveur (jamais exposées)
- **Permissions** → Vérifiées avant chaque mutation

Voir [`docs/technical/ROLES_PERMISSIONS_ERREURS_US14.md`](./docs/technical/ROLES_PERMISSIONS_ERREURS_US14.md) pour la matrice complète.

---

## Documentation

### Pour débuter

| Besoin | Document | Temps |
|--------|----------|-------|
| Comprendre le projet | [`docs/product/product.md`](./docs/product/product.md) | 5 min |
| Développer un module | [`docs/features/0X_*.md`](./docs/features/) | 15 min |
| Comprendre l'architecture | [`docs/technical/architecture.md`](./docs/technical/architecture.md) | 10 min |
| Modèle de domaine | [`docs/technical/base.md`](./docs/technical/base.md) | 5 min |

### Specs par module

| Module | Développeur | Document |
|--------|------------|----------|
| Auth & Profils | Dev 1 | [`01_module_auth_profils.md`](./docs/features/01_module_auth_profils.md) |
| Pédagogie & Classes | Dev 2 | [`02_module_pedagogie_classe.md`](./docs/features/02_module_pedagogie_classe.md) |
| Carrière & Alternance | Dev 3 | [`03_module_carriere_alternance.md`](./docs/features/03_module_carriere_alternance.md) |
| Support & FAQ | Dev 4 | [`04_module_support_faq.md`](./docs/features/04_module_support_faq.md) |
| Communication Interne | Dev 4 | [`05_module_com_interne.md`](./docs/features/05_module_com_interne.md) |
| Émargement & QR Code | Dev 2 | [`06_module_emargement_qrcode.md`](./docs/features/06_module_emargement_qrcode.md) |
| Projets & Rétro | Dev 3 | [`07_module_projets_groupes_retro.md`](./docs/features/07_module_projets_groupes_retro.md) |

### Documentation technique complète

- [`docs/technical/architecture.md`](./docs/technical/architecture.md) — Architecture détaillée
- [`docs/technical/base.md`](./docs/technical/base.md) — Modèle de domaine
- [`docs/technical/api_contract.md`](./docs/technical/api_contract.md) — Contrats API
- [`docs/technical/ROLES_PERMISSIONS_ERREURS_US14.md`](./docs/technical/ROLES_PERMISSIONS_ERREURS_US14.md) — Permissions & RLS
- [`docs/technical/SCHEMA_BDD_DIAGRAMME.md`](./docs/technical/SCHEMA_BDD_DIAGRAMME.md) — Schéma BDD

### Gouvernance & Processus

- [`docs/governance/AI_PROTOCOL.md`](./docs/governance/AI_PROTOCOL.md) — Protocole IA
- [`docs/governance/AI_RULES.md`](./docs/governance/AI_RULES.md) — Règles équipe
- [`docs/governance/BRANCHES_STATUS.md`](./docs/governance/BRANCHES_STATUS.md) — État du projet
- [`docs/governance/decision_log.md`](./docs/governance/decision_log.md) — Décisions architecturales

### Produit & Vision

- [`docs/product/product.md`](./docs/product/product.md) — Vision & MVP
- [`docs/product/Backlog.md`](./docs/product/Backlog.md) — Toutes les User Stories
- [`docs/product/decision_log.md`](./docs/product/decision_log.md) — Décisions produit

---

## Flux de Développement

### Pour un nouveau développeur

1. **Installation & Compréhension (15 min)**
   - Lire ce README
   - Suivre les étapes d'[Installation](#installation)
   - Lancer l'app avec Docker

2. **Apprendre le projet (10 min)**
   - Lire [`docs/product/product.md`](./docs/product/product.md)
   - Lire [`docs/technical/base.md`](./docs/technical/base.md)

3. **Développer votre module**
   - Lire la spec → `docs/features/0X_*.md`
   - Développer dans `src/modules/[votre-module]`
   - Tester avec `docker compose up`
   - Créer branche `feat/T0X-description`
   - Merger via Pull Request

---

## Support

| Sujet | Ressource |
|-------|-----------|
| **Installation** | Voir section [Installation](#installation) |
| **Configuration** | Voir section [Configuration](#configuration) |
| **Démarrage** | Lire [`docs/product/product.md`](./docs/product/product.md) |
| **Architecture** | Lire [`docs/technical/architecture.md`](./docs/technical/architecture.md) |
| **Module spécifique** | Lire `docs/features/0X_*.md` correspondant |
| **Dépannage** | Voir section [Dépannage](#dépannage) |

---

**Équipe :** 4 développeurs 
- [@djelines](https://www.github.com/djelines)

- [@zinackes](https://www.github.com/zinackes)

- [@BourletMateis](https://www.github.com/BourletMateis)

- [@Cl3m3nt03](https://www.github.com/Cl3m3nt03)



**Dernière mise à jour :** 9 avril 2026
