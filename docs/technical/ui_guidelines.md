# UI Guidelines — Hub École

**Ref :** US09, US25

> Ce document est la référence visuelle pour tous les développeurs et les modèles IA.
> Aucun composant ne doit s'écarter de ces règles sans validation du Tech Lead.

---

## 1. Palette de couleurs

```css
/* Couleurs primaires */
--color-primary:     #3B82F6;  /* blue-500 — actions principales */
--color-primary-dark:#1D4ED8;  /* blue-700 — hover */

/* Couleurs sémantiques */
--color-success:     #22C55E;  /* green-500 — présent, validé, succès */
--color-warning:     #F59E0B;  /* amber-500 — en cours, en attente */
--color-danger:      #EF4444;  /* red-500 — absent, refusé, erreur */
--color-info:        #06B6D4;  /* cyan-500 — information neutre */

/* Fonds */
--color-bg:          #F9FAFB;  /* gray-50 — fond général */
--color-surface:     #FFFFFF;  /* white — cartes, modals */
--color-border:      #E5E7EB;  /* gray-200 — bordures */

/* Texte */
--color-text:        #111827;  /* gray-900 — texte principal */
--color-text-muted:  #6B7280;  /* gray-500 — texte secondaire */

/* Modules spécifiques */
--color-retro-positive: #DCFCE7; /* green-100 — post-its positifs */
--color-retro-negative: #FEE2E2; /* red-100 — post-its négatifs */
--color-retro-idea:     #FEF9C3; /* yellow-100 — post-its idées */
```

---

## 2. Typographie

| Usage | Classe Tailwind | Taille |
|-------|----------------|--------|
| Titre de page | `text-2xl font-bold text-gray-900` | 24px |
| Titre de section | `text-lg font-semibold text-gray-800` | 18px |
| Texte courant | `text-sm text-gray-700` | 14px |
| Texte secondaire | `text-sm text-gray-500` | 14px |
| Label de formulaire | `text-sm font-medium text-gray-700` | 14px |
| Texte d'erreur | `text-sm text-red-600` | 14px |

---

## 3. Composants récurrents

### Bouton primaire
```tsx
<button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Action
</button>
```

### Bouton secondaire
```tsx
<button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
  Annuler
</button>
```

### Bouton danger
```tsx
<button className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
  Supprimer
</button>
```

### Badge de statut
```tsx
// Statut ticket / présence
const badgeColors = {
  ouvert:    "bg-red-100 text-red-700",
  en_cours:  "bg-amber-100 text-amber-700",
  resolu:    "bg-green-100 text-green-700",
  present:   "bg-green-100 text-green-700",
  en_retard: "bg-amber-100 text-amber-700",
  absent:    "bg-red-100 text-red-700",
}
<span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[statut]}`}>
  {statut}
</span>
```

### Carte (Card)
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
  {children}
</div>
```

### Input texte
```tsx
<input
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

### Message d'erreur formulaire
```tsx
<p className="mt-1 text-sm text-red-600">{error}</p>
```

### État vide
```tsx
<div className="text-center py-12">
  <p className="text-gray-400 text-sm">Aucun élément à afficher.</p>
</div>
```

### Skeleton loader
```tsx
<div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
```

---

## 4. Navigation

### Layout dashboard
```
┌─────────────────────────────────────────────┐
│  [Logo Hub École]    [Nom utilisateur ▼]    │  ← Header fixe (h-16)
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │   Contenu principal              │
│ (w-64)   │   (flex-1, overflow-y-auto)      │
│          │                                  │
│ - Module │                                  │
│ - Module │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Sidebar — liens par rôle

| Rôle | Liens visibles |
|------|---------------|
| Élève temps plein | Cours, Notes, Support, Carrière (Job Board) |
| Élève alternant | Cours, Notes, Support, Alternance (Tripartite + Livret) |
| Professeur | Cours, Notes, Appel QR, Projets, Com. Interne |
| Admin | Support (Kanban), FAQ, Com. Interne, Annuaire |
| Entreprise | Tripartite, Livret alternant |

---

## 5. Formulaires

- Toujours afficher les erreurs **sous le champ concerné** (pas en haut de page)
- Label au-dessus de l'input, jamais placeholder seul
- Bouton de soumission désactivé pendant le loading (`disabled + opacity-50`)
- Feedback de succès : toast en bas de l'écran (vert, 3 secondes)
- Feedback d'erreur critique : toast rouge ou message inline

---

## 6. Accessibilité minimale

- Tous les boutons ont un texte lisible (pas d'icône seule sans `aria-label`)
- Contraste minimum : 4.5:1 pour le texte courant
- Navigation clavier : focus visible sur tous les éléments interactifs (`focus:ring-2`)
- Les erreurs de formulaire sont annoncées via `aria-live="polite"`
- Images décoratives : `alt=""`

---

## 7. Comportements des états

| État | Comportement |
|------|-------------|
| **Loading** | Skeleton loader ou spinner dans le bouton |
| **Vide** | Message "Aucun élément" centré, pas de page blanche |
| **Erreur réseau** | Toast rouge "Une erreur est survenue. Réessaie." |
| **Erreur validation** | Message rouge sous le champ, champ bordé en rouge |
| **Succès action** | Toast vert, donnée mise à jour en temps réel (optimistic UI si possible) |
| **Accès interdit** | Redirection silencieuse (404 ou login), jamais de message "Accès refusé" |

---

## 8. Responsive

- Mobile first : les pages doivent fonctionner sur écran 375px (iPhone SE)
- La sidebar devient un menu hamburger sur mobile (`md:hidden`)
- Le QR Code en plein écran doit s'adapter à la résolution du projecteur (min 300×300px)
- Les tableaux de notes utilisent `overflow-x-auto` sur mobile
