# Hub École — Plateforme de gestion scolaire

Projet étudiant développé en **Full Vibe Coding** par une équipe de 4 développeurs.
Stack : **Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase**

---

## Comprendre le projet en 30 secondes

Hub École est un LMS/ERP scolaire modulaire qui centralise :
- L'authentification et les profils (Élève, Prof, Admin, Entreprise)
- L'espace pédagogique (cours, notes, chat de classe)
- Le suivi carrière et alternance
- Le support administratif (tickets, FAQ)
- La communication interne staff
- L'émargement numérique par QR Code
- La gestion de semaines projets avec mur de rétro

Chaque module est **isolé** : un développeur = une branche = un module. Zéro collision.

---

## Prérequis

- Node.js 22+
- npm 10+
- Docker & Docker Compose (optionnel, pour le déploiement)
- Un compte Supabase avec un projet créé

---

## Installation

```bash
# 1. Cloner le repo
git clone <url-du-repo>
cd EsieeToutCommence

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# Remplir les valeurs dans .env.local (voir section ci-dessous)

# 4. Lancer en développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ton-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ta-clé-anon>
SUPABASE_SERVICE_ROLE_KEY=<ta-clé-service-role>
```

Ces valeurs se trouvent dans ton dashboard Supabase → **Settings → API**.

---

## Lancer avec Docker

```bash
# Build et démarrage
docker compose up --build

# En arrière-plan
docker compose up --build -d

# Arrêt
docker compose down
```

---

## Structure du projet

```
EsieeToutCommence/
├── src/
│   ├── app/                        # Pages Next.js (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── dashboard/              # Pages protégées
│   ├── modules/                    # Code métier par module (ISOLÉ)
│   │   ├── auth/                   # Dev 1
│   │   ├── pedagogy/               # Dev 2
│   │   ├── career/                 # Dev 3
│   │   ├── support/                # Dev 4
│   │   ├── communication/          # Dev 4
│   │   ├── attendance/             # Dev 2
│   │   └── projects/               # Dev 3
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # Client navigateur
│   │       └── server.ts           # Client serveur (SSR)
│   └── components/
│       ├── ui/                     # Composants partagés
│       └── layout/
├── docs/
│   ├── AI_PROTOCOL.md              # Protocole IA universel (source de vérité)
│   ├── AI_RULES.md                 # Règles de collaboration équipe
│   ├── BRANCHES_STATUS.md          # Suivi temps réel des branches
│   ├── Backlog.md                  # Backlog du projet
│   ├── base.md                     # Architecture fonctionnelle
│   ├── features/                   # Specs techniques par module
│   │   ├── 01_module_auth_profils.md
│   │   ├── 02_module_pedagogie_classe.md
│   │   ├── 03_module_carriere_alternance.md
│   │   ├── 04_module_support_faq.md
│   │   ├── 05_module_com_interne.md
│   │   ├── 06_module_emargement_qrcode.md
│   │   └── 07_module_projets_groupes_retro.md
│   └── sql/
│       ├── 01_init_schema.sql      # Migration 1 : Auth & Profils
│       └── 02_projets_groupes_retro.sql  # Migration 2 : Projets
├── public/
├── CLAUDE.md                       # Config IA pour Claude Code
├── GEMINI.md                       # Config IA pour Google Gemini
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Base de données (Supabase)

Les migrations SQL sont dans `docs/sql/`. Elles doivent être exécutées **dans l'ordre** dans le **SQL Editor** de Supabase Studio.

| Ordre | Fichier | Contenu |
|-------|---------|---------|
| 1 | `docs/sql/01_init_schema.sql` | Types ENUM, tables de profils, RLS Auth |
| 2 | SQL dans `docs/features/02_module_pedagogie_classe.md` | Classes, cours, notes, chat |
| 3 | SQL dans `docs/features/06_module_emargement_qrcode.md` | Sessions QR, présences |
| 4 | `docs/sql/02_projets_groupes_retro.sql` | Projets, groupes, rétro |
| 5 | SQL dans `docs/features/03_module_carriere_alternance.md` | Offres, tripartite, livret |
| 6 | SQL dans `docs/features/04_module_support_faq.md` | Tickets, FAQ |
| 7 | SQL dans `docs/features/05_module_com_interne.md` | Canaux staff |

> **Important :** Les migrations 3 et 4 dépendent de la migration 2 (fonctions `is_class_member` et `is_class_teacher`). Toujours exécuter dans l'ordre.

---

## Workflow Git

### Branches

| Branche | Dev | Modules |
|---------|-----|---------|
| `main` | Tech Lead | Code stable et reviewé uniquement |
| `feat/T01-auth-profiles-identite` | Dev 1 | Auth & Profils |
| `feat/T02-pedagogy-espace-classe` | Dev 2 | Pédagogie + Émargement |
| `feat/T03-career-alternance` | Dev 3 | Carrière & Alternance |
| `feat/T04-support-faq-communication` | Dev 4 | Support FAQ + Com Interne |
| `feat/T07-projects-groupes-retro` | Dev 3 | Projets & Rétro |

### Règles

```bash
# Se placer sur sa branche AVANT de commencer
git checkout feat/T0X-nom-de-ta-branche

# Commiter après chaque fonctionnalité (pas en batch)
git add src/modules/ton-module/fichier-modifie.ts
git commit -m "feat(module): description courte (Ref: USxx)"
git push
```

- **Jamais de commit direct sur `main`**
- **1 fonctionnalité = 1 commit**
- **Les merges sont faits par le Tech Lead après revue**

---

## Comment démarrer sur un module (guide rapide)

### 1. Récupérer le projet

```bash
git clone <url-du-repo>
cd EsieeToutCommence
npm install
```

### 2. Configurer son environnement

```bash
cp .env.local.example .env.local
# Remplir avec les clés Supabase fournies par le Tech Lead
```

### 3. Se placer sur sa branche

```bash
# Remplacer T0X par ton numéro de module
git checkout feat/T0X-nom-de-ta-branche
```

### 4. Lire sa spec avant de toucher au code

Ouvrir le fichier `docs/features/0X_module_ton_module.md` et lire :
- Les tables SQL à créer
- Les Server Actions à implémenter
- Les composants à créer
- La checklist d'exécution pas-à-pas

### 5. Configurer son modèle IA

Le modèle IA utilisé **doit** lire `docs/AI_PROTOCOL.md` avant de commencer.

**Si tu utilises Claude Code :**
Le fichier `CLAUDE.md` est lu automatiquement. Rien à faire.

**Si tu utilises Gemini (Google IDE) :**
Le fichier `GEMINI.md` est lu automatiquement. Rien à faire.

**Si tu utilises un autre modèle (ChatGPT, Mistral, Cursor…) :**
Copier-coller le contenu de `docs/AI_PROTOCOL.md` comme **premier message** ou **system prompt** de ta session.

### 6. Vérifier l'état du projet avant de coder

```bash
# Voir ce que les autres ont déjà fait
git log --oneline --all --graph -15

# Lire le suivi des branches
cat docs/BRANCHES_STATUS.md
```

### 7. Mettre à jour le suivi après chaque session

Après chaque session de travail, mettre à jour `docs/BRANCHES_STATUS.md` :
- Cocher les étapes terminées
- Changer l'emoji de statut si nécessaire
- Noter les blocages éventuels

---

## Commandes utiles

```bash
npm run dev          # Lancer en développement
npm run build        # Builder le projet
npm run lint         # Vérifier le code

# Git
git log --all --graph --oneline        # Vue globale de toutes les branches
git diff main..feat/T0X-ta-branche     # Voir tes changements vs main
git stash                              # Sauvegarder sans commiter
```

---

## Documentation complète

| Document | Description |
|----------|-------------|
| `docs/base.md` | Architecture fonctionnelle détaillée |
| `docs/Backlog.md` | Toutes les user stories |
| `docs/AI_RULES.md` | Règles de collaboration équipe |
| `docs/AI_PROTOCOL.md` | Protocole IA universel |
| `docs/BRANCHES_STATUS.md` | État en temps réel du projet |
| `docs/features/01_*.md` … `07_*.md` | Specs techniques par module |

---

## Contacts & Responsabilités

| Rôle | Responsabilité |
|------|---------------|
| Tech Lead | Revue de code, merges sur `main`, architecture globale |
| Dev 1 | Module Auth & Profils — **critique, débloque tout le monde** |
| Dev 2 | Module Pédagogie + Émargement |
| Dev 3 | Module Carrière + Projets & Rétro |
| Dev 4 | Module Support FAQ + Communication Interne |
