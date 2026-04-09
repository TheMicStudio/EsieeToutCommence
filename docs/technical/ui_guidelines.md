# UI Guidelines — EsieeToutCommence

**Ref :** US09, US25
**Library de composants :** shadcn/ui (installée, composants dans `src/components/ui/`)
**Templates & maquettes :** [`docs/templates/`](../templates/README.md) — consulter avant de coder toute page ou composant.

> **Règle fondamentale :** Tout écran doit être **responsive mobile-first** et visuellement conforme aux templates déposés dans `docs/templates/`. En l'absence de template, s'inspirer de la structure décrite dans ce document.

---

## 1. Stack UI

| Outil | Rôle |
|-------|------|
| **shadcn/ui** | Composants de base (Button, Card, Input, Badge, Dialog…) |
| **Tailwind CSS v4** | Styles utilitaires et personnalisation |
| **Lucide React** | Icônes (inclus avec shadcn) |
| **class-variance-authority** | Variantes de composants |

> **Règle :** Toujours chercher le composant dans shadcn avant d'en créer un custom.
> Commande pour ajouter un composant : `npx shadcn@latest add <composant>`

---

## 2. Typographie

### Font : Outfit (Google Fonts)

Chargée via `next/font/google` dans `src/app/layout.tsx` — auto-hébergée, aucune requête externe au runtime.

```tsx
import { Outfit } from "next/font/google"
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
```

| Usage | Classe Tailwind | Poids recommandé |
|-------|----------------|-----------------|
| Titres H1 | `text-4xl font-bold` | 700 |
| Titres H2 | `text-2xl font-semibold` | 600 |
| Titres H3 | `text-xl font-medium` | 500 |
| Corps | `text-base font-normal` | 400 |
| Labels / Badges | `text-sm font-medium` | 500 |
| Texte secondaire | `text-sm text-muted-foreground` | 400 |

> **Règle :** Ne jamais importer d'autres fonts. Toute l'UI utilise Outfit via `font-sans`.

---

## 3. Palette de couleurs

### Couleurs de la marque

| Nom | Hex | Rôle dans l'UI |
|-----|-----|----------------|
| **Bright Teal Blue** | `#0471a6` | Primary — CTA, liens actifs, focus |
| **Ocean Blue** | `#3685b5` | Ring / outline, hover states |
| **Wisteria Blue** | `#89aae6` | Secondary — tags, éléments informatifs |
| **Dusty Mauve** | `#ac80a0` | Accent — éléments décoratifs, rétro |
| **Ink Black** | `#061826` | Fond dark mode, texte sur fond clair |

### Tokens shadcn → couleurs projet

| Token CSS | Light | Dark |
|-----------|-------|------|
| `--primary` | Bright Teal Blue `#0471a6` | Wisteria Blue `#89aae6` |
| `--secondary` | Wisteria Blue `#89aae6` | Bright Teal Blue `#0471a6` |
| `--accent` | Dusty Mauve `#ac80a0` | Dusty Mauve `#ac80a0` |
| `--ring` | Ocean Blue `#3685b5` | Wisteria Blue |
| `--background` (dark) | white | Ink Black `#061826` |
| `--chart-1..5` | Les 5 couleurs dans l'ordre | idem |

### Règle d'usage

**Toujours utiliser les tokens shadcn, jamais de couleurs Tailwind hardcodées.**

```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground">
<div className="border-border text-muted-foreground">

// ❌ Interdit
<div className="bg-blue-500 text-white">
<div className="border-gray-200 text-gray-500">
```

### Tokens courants

| Token | Usage |
|-------|-------|
| `bg-background` | Fond général |
| `bg-card` | Fond des cartes |
| `text-foreground` | Texte principal |
| `text-muted-foreground` | Texte secondaire |
| `bg-primary` | Actions principales (Bright Teal Blue) |
| `bg-secondary` | Éléments informatifs (Wisteria Blue) |
| `bg-accent` | Accents décoratifs (Dusty Mauve) |
| `bg-destructive` | Danger / Supprimer |
| `border-border` | Bordures |
| `ring` | Focus ring (Ocean Blue) |

### Couleurs sémantiques projet (rétro)

Définies dans `src/app/globals.css` :
```css
:root {
  --color-retro-positive: oklch(0.96 0.05 142);
  --color-retro-negative: oklch(0.96 0.05 27);
  --color-retro-idea:     oklch(0.98 0.07 90);
}
```

---

## 4. Composants shadcn à installer par module

### Tous les modules (base commune — à installer en premier)
```bash
npx shadcn@latest add button card input label badge toast
npx shadcn@latest add form select textarea checkbox
npx shadcn@latest add dialog sheet dropdown-menu
npx shadcn@latest add avatar separator skeleton
```

### Par module
```bash
# Dev 1 — Auth
npx shadcn@latest add tabs

# Dev 2 — Pédagogie + Émargement
npx shadcn@latest add table scroll-area progress

# Dev 3 — Carrière + Projets
npx shadcn@latest add tooltip

# Dev 4 — Support + Com Interne
npx shadcn@latest add alert
```

---

## 5. Conventions d'utilisation shadcn

### Boutons
```tsx
import { Button } from "@/components/ui/button"

<Button>Enregistrer</Button>
<Button variant="outline">Annuler</Button>
<Button variant="destructive">Supprimer</Button>
<Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</Button>
```

### Cartes
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader><CardTitle>Titre</CardTitle></CardHeader>
  <CardContent>Contenu</CardContent>
</Card>
```

### Badges de statut
```tsx
import { Badge } from "@/components/ui/badge"

const badgeVariant = {
  ouvert: "destructive", en_cours: "secondary", resolu: "default",
  present: "default", absent: "destructive",
} as const

<Badge variant={badgeVariant[statut]}>{statut}</Badge>
```

### Formulaires
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

---

## 6. Layout dashboard

```
┌─────────────────────────────────────────────┐
│  [Logo]              [Nom utilisateur ▼]    │  ← Header h-16, bg-card, border-b
├──────────┬──────────────────────────────────┤
│ Sidebar  │  <main> flex-1 overflow-y-auto   │
│  w-64    │  p-6                             │
│ bg-card  │                                  │
│ border-r │                                  │
└──────────┴──────────────────────────────────┘
```

Sidebar mobile → composant `Sheet` de shadcn.

---

## 7. États UI

| État | Solution shadcn |
|------|----------------|
| Loading | `Skeleton` ou `Button disabled` + spinner |
| Vide | Div centrée `text-muted-foreground` |
| Erreur réseau | `toast.error()` |
| Erreur validation | `<p className="text-sm text-destructive">` |
| Succès | `toast.success()` |
| Confirmation destructive | `AlertDialog` |
