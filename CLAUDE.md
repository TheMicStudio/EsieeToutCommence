# CLAUDE.md — Règles d'initialisation obligatoires pour toute IA

> Ce fichier est lu automatiquement par Claude Code au démarrage de chaque session.
> Toute IA intervenant sur ce projet DOIT exécuter le protocole ci-dessous AVANT de produire la moindre ligne de code ou de répondre à une demande de développement.

---

## ⚠️ PROTOCOLE D'INITIALISATION OBLIGATOIRE

### Étape 1 — Lire les fichiers de contexte projet

Tu DOIS lire ces fichiers dans cet ordre avant toute action :

1. `docs/base.md` — Architecture fonctionnelle et séparation des modules
2. `docs/AI_RULES.md` — Règles strictes de collaboration et anti-collision
3. `docs/Backlog.md` — Liste des tâches et exigences
4. `docs/BRANCHES_STATUS.md` — **État en temps réel de toutes les branches en cours**

### Étape 2 — Auditer l'état Git complet du projet

Tu DOIS exécuter ces commandes et analyser leur sortie :

```bash
# 1. Lister toutes les branches locales et leur dernier commit
git branch -v

# 2. Voir les commits récents sur CHAQUE branche active (pas seulement main)
git log --oneline --all --graph --decorate -20

# 3. Voir les fichiers modifiés sur chaque branche par rapport à main
git diff --name-only main..feat/T01-auth-profiles-identite
git diff --name-only main..feat/T02-pedagogy-espace-classe
git diff --name-only main..feat/T03-career-alternance
git diff --name-only main..feat/T04-support-faq-communication
git diff --name-only main..feat/T07-projects-groupes-retro
```

### Étape 3 — Identifier le module concerné par la demande

Avant de coder, tu DOIS :
- Identifier à quel module appartient la demande (voir `docs/features/0X_module_*.md`)
- Vérifier que la fonctionnalité demandée n'est pas déjà en cours sur une autre branche
- Lire le fichier de spec complet du module concerné (`docs/features/`)

### Étape 4 — Vérifier l'absence de collision

Tu DOIS vérifier que les fichiers que tu vas modifier ne sont pas déjà modifiés sur une autre branche active :

```bash
# Exemple : avant de toucher src/modules/pedagogy/
git log --oneline --all -- src/modules/pedagogy/
```

---

## 🗂️ Carte des modules et branches

| Module | Branche | Dev | Fichier spec |
|--------|---------|-----|-------------|
| Auth & Profils | `feat/T01-auth-profiles-identite` | Dev 1 | `docs/features/01_module_auth_profils.md` |
| Pédagogie & Classe | `feat/T02-pedagogy-espace-classe` | Dev 2 | `docs/features/02_module_pedagogie_classe.md` |
| Carrière & Alternance | `feat/T03-career-alternance` | Dev 3 | `docs/features/03_module_carriere_alternance.md` |
| Support & FAQ | `feat/T04-support-faq-communication` | Dev 4 | `docs/features/04_module_support_faq.md` |
| Communication Interne | `feat/T04-support-faq-communication` | Dev 4 | `docs/features/05_module_com_interne.md` |
| Émargement QR Code | `feat/T02-pedagogy-espace-classe` | Dev 2 | `docs/features/06_module_emargement_qrcode.md` |
| Projets & Rétro | `feat/T07-projects-groupes-retro` | Dev 3 | `docs/features/07_module_projets_groupes_retro.md` |

---

## 🚫 Règles absolues de non-collision

1. **Tu ne peux modifier que les fichiers du module sur lequel ton développeur humain travaille.**
2. **L'unique export public autorisé entre modules :** `getCurrentUserProfile()` depuis `src/modules/auth/actions.ts`.
3. **Si un fichier que tu veux modifier a été touché sur une autre branche**, tu t'arrêtes et tu alertes le développeur humain.
4. **Tu ne fusionnes jamais une branche toi-même.** Les merges sont faits par le Tech Lead humain après revue.
5. **1 fonctionnalité = 1 commit.** Pas de commits multi-sujets.

---

## 📋 Convention de commits obligatoire

```
feat(module): description courte en français (Ref: USxx)
fix(module): description du correctif (Ref: USxx)
docs(module): mise à jour documentation
chore(scope): tâche technique sans impact fonctionnel
```

Exemples valides :
- `feat(auth): ajout du formulaire de connexion (Ref: US22)`
- `fix(pedagogy): correction calcul moyenne avec coefficient 0`
- `docs(projects): mise à jour BRANCHES_STATUS.md`

---

## 🔄 Mise à jour obligatoire après chaque session

Après chaque session de développement, tu DOIS mettre à jour `docs/BRANCHES_STATUS.md` avec :
- Ce qui a été fait (fonctionnalités complétées)
- Ce qui est en cours (fonctionnalités partiellement implémentées)
- Les dépendances non encore résolues (ex: "attend que Dev 1 expose `getCurrentUserProfile`")
- Les fichiers modifiés sur la branche
