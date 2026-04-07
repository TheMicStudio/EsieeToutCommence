# Audit Backlog — Couverture du projet

**Date :** 2026-04-07
**Périmètre :** Comparaison exhaustive entre `docs/product/Backlog.md` (40 US) et l'ensemble des livrables actuels du projet.

---

## Résumé

| Statut | Nombre | US |
|--------|--------|----|
| ✅ Couvert | 12 | US13, US14, US17, US18, US19, US20, US21, US22, US23, US24, US35, US36 |
| 🟡 Partiel | 5 | US10, US25, US26, US37, US27 |
| 🔴 Non couvert | 23 | US01–09, US11, US12, US15, US16, US28–34, US38–40 |

---

## Détail par US

---

### CADRAGE & PRODUIT

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US01 | Définir le problème, la cible et la proposition de valeur | 🔴 Non couvert | — | Document dédié (problem statement, value prop) |
| US02 | Définir les personas et leurs scénarios d'usage | 🔴 Non couvert | — | Fichier `docs/personas.md` |
| US03 | Cartographier les user journeys prioritaires | 🔴 Non couvert | — | Fichier `docs/user_journeys.md` |
| US04 | Définir le MVP, hors périmètre et critères de coupe | 🔴 Non couvert | — | Fichier `docs/mvp.md` |
| US05 | Choisir le thème précis et justifier les choix produit | 🔴 Non couvert | — | Fichier `docs/product_decisions.md` |
| US06 | Formaliser l'elevator pitch | 🔴 Non couvert | — | Section dans `docs/product_decisions.md` ou README |
| US08 | Réaliser une SWOT et un benchmark minimal | 🔴 Non couvert | — | Fichier `docs/swot_benchmark.md` |

---

### UX & DESIGN

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US07 | Concevoir la landing page de présentation | 🔴 Non couvert | — | Page `src/app/page.tsx` (placeholder vide actuellement) |
| US09 | Concevoir les écrans clés et règles d'interface | 🔴 Non couvert | — | Maquettes + mini guide UI (`docs/technical/ui_guidelines.md`) |

---

### ARCHITECTURE

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US10 | Définir l'architecture globale et ses responsabilités | 🟡 Partiel | `docs/technical/base.md` couvre les modules fonctionnels | Schéma d'architecture technique (diagramme blocs) |
| US11 | Justifier les choix techniques et de stack | 🔴 Non couvert | — | Document `docs/architecture_decisions.md` (Next.js vs autres, Supabase vs autres…) |
| US12 | Produire le diagramme de séquence du parcours principal | 🔴 Non couvert | — | Diagramme Mermaid ou image dans `docs/` |
| US13 | Produire le modèle de domaine et la modélisation des données | ✅ Couvert | `docs/features/01_module_auth_profils.md` + SQL dans chaque spec module | — |
| US14 | Définir les rôles, permissions et stratégie de gestion des erreurs | ✅ Couvert | `docs/features/01_module_auth_profils.md` + RLS dans chaque module | — |
| US15 | Documenter le contrat des routes API | 🔴 Non couvert | — | Fichier `docs/technical/api_contract.md` avec méthodes, entrées, sorties, codes HTTP |
| US16 | Tenir un journal des décisions produit et techniques | 🔴 Non couvert | — | Fichier `docs/product/decision_log.md` |

---

### GIT & COLLABORATION

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US17 | Définir la stratégie Git, branches et règles d'intégration | ✅ Couvert | `README.md` (section Workflow Git) + branches créées + `docs/governance/AI_RULES.md` | — |
| US18 | Définir la convention de commits et le découpage atomique | ✅ Couvert | `README.md` + `docs/governance/AI_PROTOCOL.md` + `docs/governance/AI_RULES.md` | — |

---

### GOUVERNANCE IA (ANTIGRAVITY)

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US19 | Configurer Antigravity pour imposer les règles projet | ✅ Couvert | `CLAUDE.md`, `GEMINI.md`, `docs/governance/AI_PROTOCOL.md`, `docs/governance/AI_RULES.md` | — |
| US20 | Définir les règles de travail communes des agents IA | ✅ Couvert | `docs/governance/AI_PROTOCOL.md`, `docs/governance/AI_RULES.md` | — |
| US21 | Mettre en place les garde-fous qualité et sécurité des agents | ✅ Couvert | `docs/governance/AI_RULES.md` (règles anti-collision, non-hallucination, sécurité) | — |

---

### DÉVELOPPEMENT

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US22 | Initialiser le socle applicatif | ✅ Couvert | Next.js + Tailwind + Supabase installés, arborescence créée, Docker configuré | — |
| US23 | Implémenter le parcours utilisateur principal | ✅ Couvert | Specs détaillées dans `01`, `02`, `03` — checklist prête | Implémentation réelle (pas encore codé) |
| US24 | Implémenter les fonctionnalités cœur du MVP | ✅ Couvert | Specs dans tous les modules `01` à `07` — checklists prêtes | Implémentation réelle (pas encore codé) |
| US25 | Réaliser une interface web cohérente et accessible | 🟡 Partiel | Composants listés dans specs `02`, `04`, `07` | Pas de guide UI/design system, pas de règles accessibilité documentées |
| US26 | Gérer les états vides, erreurs et cas limites | 🟡 Partiel | Mentionné dans specs `04` et `07` | Pas de stratégie globale de gestion d'erreurs documentée |

---

### DONNÉES

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US27 | Préparer les données de démonstration et de test | 🟡 Partiel | Structure SQL définie dans `docs/sql/` | Pas de seed data, pas de script de démo |

---

### QUALITÉ

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US28 | Définir les règles de qualité de code et commentaires | 🔴 Non couvert | `docs/governance/AI_RULES.md` effleure le sujet | Fichier dédié `docs/quality_rules.md` + config ESLint stricte |
| US29 | Mettre en place les tests unitaires prioritaires | 🔴 Non couvert | — | Config Jest/Vitest + premiers tests sur `getCurrentUserProfile`, calcul moyenne, RLS |
| US30 | Mettre en place les tests d'intégration ou de parcours | 🔴 Non couvert | — | Config Playwright ou Cypress + scénario de connexion → dashboard |

---

### CI/CD

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US31 | Mettre en place le pipeline CI/CD GitHub | 🔴 Non couvert | — | `.github/workflows/ci.yml` (lint + build + tests) |
| US32 | Intégrer SonarQube dans les vérifications | 🔴 Non couvert | — | Config SonarQube + intégration dans la CI |

---

### SÉCURITÉ

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US33 | Réaliser l'analyse sécurité du code et des accès | 🔴 Non couvert | RLS définie dans chaque module mais pas d'analyse formelle | Document `docs/security_analysis.md` |
| US34 | Contrôler les dépendances et produire une SBOM | 🔴 Non couvert | — | `npm audit` documenté + génération SBOM (`cyclonedx-npm`) |

---

### DEVOPS

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US35 | Conteneuriser l'application avec Docker | ✅ Couvert | `Dockerfile` multi-stage (deps → builder → runner), image allégée, user non-root | — |
| US36 | Orchestrer l'environnement avec Docker Compose | ✅ Couvert | `docker-compose.yml` avec injection `.env` | — |

---

### DOCUMENTATION

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US37 | Rédiger la documentation d'installation, d'exploitation et du projet | 🟡 Partiel | `README.md` complet (install, Docker, Git, modules) | Pas de doc d'exploitation (journaux, limites connues, procédure de rollback) |

---

### LIVRAISON & SOUTENANCE

| US | Titre | Statut | Couvert par | Manque |
|----|-------|--------|-------------|--------|
| US38 | Préparer une version démontrable et stable | 🔴 Non couvert | — | Tag Git de release + script de démo + données de démo chargées |
| US39 | Justifier les arbitrages, compromis et priorités du backlog | 🔴 Non couvert | — | Document `docs/product/decision_log.md` avec 5+ arbitrages argumentés |
| US40 | Préparer les preuves de crédibilité professionnalisante | 🔴 Non couvert | — | Consolidation de tous les livrables (pipeline, tests, sécurité, Git, doc) |

---

## Plan d'action priorisé

### Priorité HAUTE — Bloque la soutenance ou le développement

| US | Action | Livrable à créer |
|----|--------|-----------------|
| US11 | Justifier la stack technique | `docs/architecture_decisions.md` |
| US15 | Documenter les routes API | `docs/technical/api_contract.md` |
| US16 | Journal des décisions | `docs/product/decision_log.md` |
| US28 | Règles qualité de code | `docs/quality_rules.md` + ESLint config |
| US29 | Tests unitaires | Config Vitest + tests sur fonctions critiques |
| US31 | Pipeline CI/CD | `.github/workflows/ci.yml` |
| US07 | Landing page | `src/app/page.tsx` (vraie landing, pas placeholder) |

### Priorité MOYENNE — Attendu pour la soutenance

| US | Action | Livrable à créer |
|----|--------|-----------------|
| US01 | Problème + proposition de valeur | `docs/product_decisions.md` |
| US02 | Personas | `docs/personas.md` |
| US04 | MVP défini | Section dans `docs/product_decisions.md` |
| US09 | Maquettes + guide UI | `docs/technical/ui_guidelines.md` |
| US12 | Diagramme de séquence | Diagramme Mermaid dans `docs/` |
| US27 | Seed data de démo | `docs/sql/99_seed_demo.sql` |
| US33 | Analyse sécurité | `docs/security_analysis.md` |
| US37 | Doc exploitation complète | Compléter `README.md` (logs, rollback, limites) |

### Priorité BASSE — Bonus professionnel

| US | Action | Livrable à créer |
|----|--------|-----------------|
| US03 | User journeys | `docs/user_journeys.md` |
| US05 | Justification thème | Section dans `docs/product_decisions.md` |
| US06 | Elevator pitch | Section dans `docs/product_decisions.md` |
| US08 | SWOT + benchmark | `docs/swot_benchmark.md` |
| US30 | Tests d'intégration | Config Playwright |
| US32 | SonarQube | Config + intégration CI |
| US34 | SBOM | `npm audit` + `cyclonedx-npm` |
| US38 | Version de démo | Tag Git + script de démo |
| US39 | Arbitrages soutenance | Dans `docs/product/decision_log.md` |
| US40 | Preuves crédibilité | Consolidation finale |
