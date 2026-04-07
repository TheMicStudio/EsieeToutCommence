Agis en tant que Tech Lead et Architecte Logiciel Senior. Notre équipe de 4 développeurs s'apprête à lancer un projet de "Hub École" en mode Full Vibe Coding sur Antigravity. 

⚠️ INSTRUCTION CRITIQUE AVANT DE COMMENCER :
Avant de générer la moindre ligne, tu DOIS impérativement lire, analyser et assimiler le contenu des trois fichiers suivants fournis dans mon contexte :
1. `information/base.md` (Notre architecture fonctionnelle et la séparation Authentification / Profils).
2. `information/backlog.md` (Notre liste de tâches et les exigences du projet).
3. `information/AI_RULES.md` (Nos règles strictes de collaboration, de non-collision et de documentation).

Une fois le contexte assimilé, ta mission se divise en DEUX parties :

### PARTIE 1 : Le fichier d'initialisation (`init.md`)
Rédige un guide d'initialisation complet pour notre stack (Next.js App Router, TypeScript, Tailwind CSS + Supabase). Il doit contenir :
1. Les commandes de setup Next.js et la configuration Supabase (`.env.local`).
2. L'arborescence des dossiers stricte pour isoler les modules (ex: `/src/modules/auth`, `/src/modules/pedagogy`).
3. Les premières instructions SQL pour Supabase afin de créer la table `User` et la liaison avec les Profils (comme défini dans `base.md`).
4. Les commandes Git pour le setup initial et la création des branches par les développeurs.

### PARTIE 2 : Les fichiers de spécifications "Ready to Vibe Code"
Afin de répartir le travail entre les 4 membres de l'équipe sans aucune collision, je veux que tu génères le contenu de fichiers `.md` distincts. Ces fichiers seront placés dans un dossier `/docs/features/`.
Génère un fichier par module (ex: `01_auth_profiles.md`, `02_class_pedagogy.md`, `03_career_alternance.md`, `04_support_faq.md`). 

Pour CHAQUE fichier généré, tu dois IMPÉRATIVEMENT inclure :
- Le développeur assigné (Dev 1, Dev 2, Dev 3, ou Dev 4).
- L'objectif de la fonctionnalité (en lien avec le `backlog.md`).
- Les tables/modèles Supabase spécifiques à ce module.
- Les composants UI et les pages Next.js à créer.
- La logique métier et les restrictions de sécurité (Row Level Security Supabase).
- Un encart strict "RÈGLES VIBE CODING & LIMITES" rappelant à l'IA locale de ce développeur ce qu'elle NE DOIT SURTOUT PAS modifier dans les autres modules.

Fournis-moi l'ensemble de ces contenus formatés en blocs de code Markdown distincts pour que je puisse facilement les copier-coller pour mon équipe.