# UI Guidelines — Hub École

**Ref :** US09, US25
**Library de composants :** shadcn/ui (installée, composants dans `src/components/ui/`)

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

## 2. Composants shadcn à installer par module

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

## 3. Palette de couleurs (tokens shadcn)

Utiliser les tokens CSS shadcn, jamais des couleurs Tailwind hardcodées :

| Token | Usage |
|-------|-------|
| `bg-background` | Fond général |
| `bg-card` | Fond des cartes |
| `text-foreground` | Texte principal |
| `text-muted-foreground` | Texte secondaire |
| `bg-primary` | Actions principales |
| `bg-destructive` | Danger / Supprimer |
| `border` | Bordures |

**Couleurs sémantiques projet** (à ajouter dans `src/app/globals.css`) :
```css
:root {
  --color-retro-positive: oklch(0.96 0.05 142);
  --color-retro-negative: oklch(0.96 0.05 27);
  --color-retro-idea:     oklch(0.98 0.07 90);
}
```

---

## 4. Conventions d'utilisation shadcn

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

## 5. Layout dashboard

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

## 6. États UI

| État | Solution shadcn |
|------|----------------|
| Loading | `Skeleton` ou `Button disabled` + spinner |
| Vide | Div centrée `text-muted-foreground` |
| Erreur réseau | `toast.error()` |
| Erreur validation | `<p className="text-sm text-destructive">` |
| Succès | `toast.success()` |
| Confirmation destructive | `AlertDialog` |
