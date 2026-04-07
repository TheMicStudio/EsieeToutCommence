# AI_PROTOCOL.md — Protocole universel pour tous les modèles IA

> Source de vérité unique. Référencé par `CLAUDE.md` et `GEMINI.md`.
> Tout modèle IA intervenant sur ce projet doit appliquer ce protocole intégralement.

---

## ÉTAPE 1 — Lire le contexte projet (obligatoire, dans cet ordre)

1. `docs/base.md` — Architecture fonctionnelle et séparation des modules
2. `docs/AI_RULES.md` — Règles de collaboration et anti-collision
3. `docs/Backlog.md` — Tâches et exigences du projet
4. `docs/BRANCHES_STATUS.md` — État en temps réel de toutes les branches

---

## ÉTAPE 2 — Auditer l'état Git complet

```bash
git log --oneline --all --graph --decorate -20
git branch -v
git diff --name-only main..feat/T01-auth-profiles-identite
git diff --name-only main..feat/T02-pedagogy-espace-classe
git diff --name-only main..feat/T03-career-alternance
git diff --name-only main..feat/T04-support-faq-communication
git diff --name-only main..feat/T07-projects-groupes-retro
```

---

## ÉTAPE 3 — Identifier le module et vérifier les collisions

- Lire le fichier spec du module concerné dans `docs/features/`
- Vérifier qu'aucun fichier cible n'est déjà modifié sur une autre branche :

```bash
git log --oneline --all -- src/modules/<nom_du_module>/
```

**Si collision détectée → stop et alerte le développeur humain.**

---

## Carte des modules

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

## Règles absolues

1. Ne modifier que les fichiers du module assigné.
2. Seul export public entre modules : `getCurrentUserProfile()` depuis `src/modules/auth/actions.ts`.
3. Jamais de merge de branche — c'est le Tech Lead humain qui valide.
4. 1 fonctionnalité = 1 commit.
5. Jamais de secret en dur — uniquement `.env.local`.
6. Si la demande sort du périmètre ou contredit `docs/base.md` → stop, demande confirmation.

---

## Convention de commits

```
feat(module): description courte (Ref: USxx)
fix(module): description du correctif (Ref: USxx)
docs(module): mise à jour documentation
chore(scope): tâche technique
```

---

## Mise à jour obligatoire après chaque session

Mettre à jour `docs/BRANCHES_STATUS.md` :
- Statut de la branche (🔴 / 🟡 / 🟢 / ✅)
- Fichiers modifiés
- Checklist cochée
- Blocages ou dépendances
- Date de mise à jour
