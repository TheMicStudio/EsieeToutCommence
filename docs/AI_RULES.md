# 🤖 RÈGLES STRICTES DE DÉVELOPPEMENT : VIBE CODING EN ÉQUIPE (ANTIGRAVITY)

**ATTENTION À TOUTES LES IA ET DÉVELOPPEURS :** Ce projet est développé par une équipe de 4 personnes en "Full Vibe Coding". Pour éviter les collisions, garantir la scalabilité et respecter les consignes pédagogiques, les règles suivantes sont **absolues et non négociables**. Toute IA générant du code doit s'y conformer strictement.

---

## 1. 🛡️ Règle d'Or de la Connaissance (Context First)
Avant de proposer la moindre ligne de code ou de modifier un fichier, l'IA **DOIT** obligatoirement :
1. Lire le fichier `base.md` (Cahier des charges fonctionnel et architecture de base).
2. Lire le fichier `backlog.md` (Le backlog fourni par le professeur).
3. S'assurer que la demande du développeur correspond bien à une tâche du backlog.

> **Instruction IA :** Si le développeur te demande une fonctionnalité qui n'est pas dans `base.md` ou `backlog.md`, ou si la demande contredit l'architecture (ex: mélanger l'authentification et les profils), tu dois t'arrêter, alerter le développeur et lui demander confirmation avant de coder.

---

## 2. 🧩 Séparation Stricte des Tâches (Zéro Collision)
L'équipe est composée de 4 personnes. Pour éviter les conflits Git, le projet est divisé en modules isolés. L'IA ne doit modifier **que** les fichiers appartenant au module sur lequel son développeur humain est assigné.

* **Dev 1 :** Module 1 (Authentification, Modèles `User` et `Profils`).
* **Dev 2 :** Module 2 (Espace Pédagogique, Classes, Notes, Cours).
* **Dev 3 :** Module 3 (Carrière & Alternance : Job Board, Espace Tripartite).
* **Dev 4 :** Modules 4 & 5 (Ticketing FAQ & Communication interne).

> **Instruction IA :** N'importe jamais une dépendance, ne modifie jamais une route, et ne touche jamais au schéma de base de données d'un autre module sans l'accord explicite d'un autre membre de l'équipe. Utilise des interfaces/API internes pour faire communiquer les modules entre eux.

---

## 3. 🚦 Workflow Git & Micro-Commits Obligatoires
Le "Vibe Coding" génère beaucoup de code très vite. Pour que le reste de l'équipe puisse suivre et analyser ce qui est fait sur Antigravity, l'IA doit forcer des sauvegardes constantes.

* **Pas de "Big Bang Commits" :** Interdiction de coder 3 fonctionnalités d'un coup.
* **Fréquence :** 1 fonctionnalité = 1 fichier modifié = 1 commit + 1 push.
* **Nommage des branches :** `feat/[numero-ticket-backlog]-[nom-module]-[courte-description]` (ex: `feat/T04-pedagogie-ajout-notes`).

> **Instruction IA :** Après chaque génération de code fonctionnelle (même mineure, comme la création d'un modèle de données ou d'une vue), tu **dois** proposer ou exécuter automatiquement les commandes suivantes :
> `git add .`
> `git commit -m "feat(module): description exacte (Ref: backlog item)"`
> `git push`

---

## 4. 🛑 Règle de Non-Hallucination et d'Interrogation
Les IA ont tendance à inventer des solutions quand elles manquent de contexte. Dans ce projet, c'est formellement interdit.

> **Instruction IA :** > * Tu ne dois **jamais** deviner la structure de la base de données ou le nom d'une variable d'un autre module. 
> * Si tu as besoin d'une information sur la façon dont Dev 1 a géré l'authentification pour coder le module de Dev 2, **arrête-toi et demande au développeur humain** d'aller vérifier ou de te fournir le fichier en question.
> * Si la demande du développeur humain est floue, incomplète, ou risque de casser le code existant, pose des questions claires à choix multiples ou demande des précisions avant d'écrire le code.

---

## 5. 🏗️ Standardisation du Code
* **Langage & Stack :** [À compléter par l'équipe : ex: TypeScript strict, Next.js, Tailwind, Prisma].
* **Commentaires :** Chaque fonction complexe générée par l'IA doit être accompagnée d'un commentaire expliquant *pourquoi* elle a été codée ainsi, en faisant référence à l'étape du `backlog.md`.
* **Tests :** Pas de code poussé sans que l'IA n'ait généré au moins un test unitaire ou vérifié que le code compile sans erreur critique.

---

## 6. 📝 Documentation Continue (Doc-as-Code)
Ce projet vise un standard professionnel. La documentation ne se fait pas à la fin du projet, elle est générée **au fur et à mesure**, étape par étape, en stricte conformité avec les attentes définies dans le `backlog.md`.

> **Instruction IA :** > * Chaque fois qu'une route d'API, un nouveau composant UI ou un modèle de base de données est finalisé et validé, tu **dois** générer ou mettre à jour le fichier de documentation correspondant (ex: `README_MODULE_X.md`, Swagger, ou docstrings dans le code).
> * Vérifie toujours dans le `backlog.md` quel est le format ou le niveau de détail attendu pour la documentation de la tâche en cours.
> * N'attends pas qu'on te le demande : propose spontanément la mise à jour de la doc avant de passer au ticket suivant.

---

**Déclaration de l'IA :** "J'ai lu et compris ces règles. Je suis prête à assister l'équipe en respectant l'architecture de `base.md`, les tâches de `backlog.md`, et la sectorisation des modules. Je ferai des commits réguliers, je documenterai mon code en continu et je poserai des questions en cas de doute."