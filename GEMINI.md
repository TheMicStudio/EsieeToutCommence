# GEMINI.md — Règles d'initialisation obligatoires pour Gemini

> Ce fichier est lu automatiquement par Gemini CLI et Gemini Code Assist au démarrage de chaque session.
> Toute IA intervenant sur ce projet DOIT exécuter le protocole ci-dessous AVANT de produire la moindre ligne de code.

---

## ⚠️ PROTOCOLE D'INITIALISATION OBLIGATOIRE

### Étape 1 — Lire les fichiers de contexte projet

Lis ces fichiers dans cet ordre avant toute action :

1. `docs/base.md` — Architecture fonctionnelle et séparation des modules
2. `docs/AI_RULES.md` — Règles strictes de collaboration et anti-collision
3. `docs/Backlog.md` — Liste des tâches et exigences
4. `docs/BRANCHES_STATUS.md` — **État en temps réel de toutes les branches en cours**

### Étape 2 — Auditer l'état Git complet du projet

Exécute ces commandes et analyse leur sortie :

```bash
# Vue globale de toutes les branches et leurs commits
git log --oneline --all --graph --decorate -20

# État de chaque branche vs main
git branch -v

# Fichiers modifiés sur chaque branche active
git diff --name-only main..feat/T01-auth-profiles-identite
git diff --name-only main..feat/T02-pedagogy-espace-classe
git diff --name-only main..feat/T03-career-alternance
git diff --name-only main..feat/T04-support-faq-communication
git diff --name-only main..feat/T07-projects-groupes-retro
```

### Étape 3 — Identifier le module et vérifier l'absence de collision

- Lis le fichier de spec complet du module concerné dans `docs/features/`
- Vérifie que les fichiers que tu vas modifier ne sont pas déjà en cours sur une autre branche :

```bash
git log --oneline --all -- src/modules/<nom_du_module>/
```

- Si collision détectée : **stop, alerte le développeur humain avant de continuer.**

---

## 🗂️ Carte des modules et branches

| Module | Branche | Dev | Spec |
|--------|---------|-----|------|
| Auth & Profils | `feat/T01-auth-profiles-identite` | Dev 1 | `docs/features/01_module_auth_profils.md` |
| Pédagogie & Classe | `feat/T02-pedagogy-espace-classe` | Dev 2 | `docs/features/02_module_pedagogie_classe.md` |
| Carrière & Alternance | `feat/T03-career-alternance` | Dev 3 | `docs/features/03_module_carriere_alternance.md` |
| Support & FAQ | `feat/T04-support-faq-communication` | Dev 4 | `docs/features/04_module_support_faq.md` |
| Communication Interne | `feat/T04-support-faq-communication` | Dev 4 | `docs/features/05_module_com_interne.md` |
| Émargement QR Code | `feat/T02-pedagogy-espace-classe` | Dev 2 | `docs/features/06_module_emargement_qrcode.md` |
| Projets & Rétro | `feat/T07-projects-groupes-retro` | Dev 3 | `docs/features/07_module_projets_groupes_retro.md` |

---

## 🚫 Règles absolues

1. **Tu ne modifies que les fichiers du module assigné à ton développeur.**
2. **Seul export public autorisé entre modules :** `getCurrentUserProfile()` depuis `src/modules/auth/actions.ts`.
3. **Jamais de merge de branche toi-même** — c'est le Tech Lead humain qui valide et merge.
4. **1 fonctionnalité = 1 commit.**
5. **Jamais de secret en dur dans le code** — uniquement `.env.local`.
6. **Si la demande sort du périmètre du module ou contredit `docs/base.md` :** stop et demande confirmation.

---

## 📋 Convention de commits

```
feat(module): description courte en français (Ref: USxx)
fix(module): description du correctif (Ref: USxx)
docs(module): mise à jour documentation
chore(scope): tâche technique sans impact fonctionnel
```

---

## 🔄 Mise à jour obligatoire après chaque session

Mets à jour `docs/BRANCHES_STATUS.md` avec :
- Statut de la branche (🔴 / 🟡 / 🟢 / ✅)
- Fichiers modifiés (`git diff --name-only main..feat/XXX`)
- Étapes de checklist cochées
- Blocages ou dépendances non résolues
- Date de mise à jour
