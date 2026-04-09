# Templates & Références Design

Ce dossier contient les **maquettes, captures d'écran et inspirations visuelles** servant de référence pour l'implémentation UI du projet EsieeToutCommence.

---

## Comment utiliser ce dossier

1. **Dépose ici** toute image de référence (screenshot Figma, inspiration web, wireframe, maquette exportée).
2. **Nomme le fichier** avec le module concerné : `auth_login.png`, `dashboard_etudiant.png`, `retro_board.png`, etc.
3. **Référence l'image** dans le fichier de spec du module correspondant (`docs/features/0X_module_*.md`).

> Les développeurs **doivent consulter ces templates** avant de coder une page ou un composant.
> L'objectif est un rendu **propre, responsive, cohérent** avec la charte graphique.

---

## Structure recommandée

```
docs/templates/
├── README.md               ← ce fichier
├── global/
│   ├── layout_dashboard.png     ← layout général (sidebar + header + main)
│   ├── layout_mobile.png        ← version mobile (menu hamburger)
│   └── design_system.png        ← aperçu palette + typographie
├── auth/
│   ├── login.png
│   └── profil.png
├── pedagogie/
│   ├── cours_liste.png
│   └── cours_detail.png
├── carriere/
│   └── offres_liste.png
├── support/
│   └── ticket_liste.png
├── com_interne/
│   └── fil_actualite.png
├── emargement/
│   └── qrcode_scan.png
└── projets/
    ├── groupe_liste.png
    └── retro_board.png
```

---

## Charte de référence

### Typographie — Outfit
| Élément | Classe | Poids |
|---------|--------|-------|
| Titre de page (H1) | `text-4xl font-bold` | 700 |
| Titre de section (H2) | `text-2xl font-semibold` | 600 |
| Titre de carte (H3) | `text-xl font-medium` | 500 |
| Corps de texte | `text-base font-normal` | 400 |
| Label / Badge | `text-sm font-medium` | 500 |
| Texte secondaire | `text-sm text-muted-foreground` | 400 |

### Palette
| Couleur | Hex | Token | Usage type |
|---------|-----|-------|------------|
| Bright Teal Blue | `#0471a6` | `bg-primary` | Boutons CTA, liens actifs |
| Ocean Blue | `#3685b5` | `ring` | Focus, hover |
| Wisteria Blue | `#89aae6` | `bg-secondary` | Tags, badges info |
| Dusty Mauve | `#ac80a0` | `bg-accent` | Accents, déco |
| Ink Black | `#061826` | fond dark | Mode sombre |

### Breakpoints responsive
| Breakpoint | Tailwind | Comportement |
|------------|---------|-------------|
| Mobile | `< sm` (640px) | Sidebar → menu hamburger (`Sheet`), 1 colonne |
| Tablet | `sm` → `lg` (640–1024px) | Layout hybride, sidebar réduite |
| Desktop | `> lg` (1024px+) | Sidebar fixe `w-64`, grilles multi-colonnes |

---

## Règles d'implémentation

- **Mobile-first** : coder d'abord le mobile, puis étendre avec `sm:`, `md:`, `lg:`.
- **Jamais de px hardcodés** : utiliser les espacements Tailwind (`p-4`, `gap-6`, `space-y-2`).
- **Jamais de couleurs hardcodées** : utiliser les tokens shadcn (`bg-primary`, `text-muted-foreground`).
- **Images** : toujours avec `next/image` pour l'optimisation automatique.
- **Icônes** : exclusivement `lucide-react` (inclus avec shadcn).
- **Composants** : chercher dans shadcn avant de créer un custom (`npx shadcn@latest add <composant>`).
