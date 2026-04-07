# Module Support Administratif & FAQ - Spécifications de Développement

**Assigné à :** Dev 4 (partagé avec Module 5)
**Branche Git :** `feat/T04-support-faq-communication`
**Règle absolue :** Ce module est en lecture seule vis-à-vis de tous les autres modules. Il ne lit que l'identité de l'utilisateur via `getCurrentUserProfile()`. Interdiction de toucher aux modules 1, 2, 3 et 6.

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Section 4) et `backlog.md` (US22, US24, US25, US26) :

- Système de tickets traçable : soumission, suivi, résolution.
- Droits étendus pour les Délégués (ouverture de ticket "au nom de la classe").
- Suggestion automatique d'articles FAQ lors de la rédaction d'un ticket.
- Conversion en 1 clic d'un ticket résolu en article de la FAQ publique.
- Base de connaissances FAQ publique avec moteur de recherche.
- Tableau de bord Kanban pour l'administration (À faire / En cours / Terminé).

---

## 2. Base de Données (Supabase)

### 2.1 Tables à créer

```sql
-- -----------------------------------------------------------
-- TABLE : Ticket
-- -----------------------------------------------------------
CREATE TABLE public.tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet         TEXT NOT NULL,
  description   TEXT NOT NULL,
  categorie     TEXT NOT NULL CHECK (categorie IN ('pedagogie', 'batiment', 'informatique', 'autre')),
  statut        TEXT NOT NULL DEFAULT 'ouvert'
                  CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  auteur_id     UUID NOT NULL REFERENCES auth.users(id),
  -- Si ouvert "au nom de la classe" par un délégué :
  au_nom_de_classe BOOLEAN DEFAULT FALSE,
  class_id      UUID REFERENCES public.classes(id),
  assigne_a     UUID REFERENCES auth.users(id),   -- AdminProfile
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : TicketMessage — fil de discussion d'un ticket
-- -----------------------------------------------------------
CREATE TABLE public.ticket_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : FAQ_Article
-- -----------------------------------------------------------
CREATE TABLE public.faq_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  reponse     TEXT NOT NULL,
  categorie   TEXT NOT NULL CHECK (categorie IN ('pedagogie', 'batiment', 'informatique', 'autre')),
  publie      BOOLEAN DEFAULT TRUE,
  auteur_id   UUID NOT NULL REFERENCES auth.users(id),
  -- Ticket source si converti depuis un ticket résolu
  source_ticket_id UUID REFERENCES public.tickets(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Row Level Security (RLS)

```sql
ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles    ENABLE ROW LEVEL SECURITY;

-- Tickets : chaque utilisateur voit ses propres tickets
CREATE POLICY "Voir ses tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = auteur_id);

-- Tickets : les admins voient tous les tickets
CREATE POLICY "Admin voit tous les tickets" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Tickets : création par tout utilisateur connecté
CREATE POLICY "Créer un ticket" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = auteur_id);

-- Tickets : mise à jour du statut par admin uniquement
CREATE POLICY "Admin met à jour statut" ON public.tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Messages ticket : visibles par l'auteur du ticket et les admins
CREATE POLICY "Lire messages ticket" ON public.ticket_messages
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.auteur_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Messages ticket : envoi par auteur du ticket ou admin
CREATE POLICY "Répondre à un ticket" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id AND t.auteur_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    )
  );

-- FAQ : articles publiés visibles par tous
CREATE POLICY "FAQ publique" ON public.faq_articles
  FOR SELECT USING (publie = TRUE);

-- FAQ : admins voient tout (y compris non publiés)
CREATE POLICY "Admin voit toute la FAQ" ON public.faq_articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- FAQ : création et édition par admin uniquement
CREATE POLICY "Admin gère la FAQ" ON public.faq_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/support/actions.ts` | `createTicket(data)` | Soumission d'un ticket |
| `src/modules/support/actions.ts` | `getMyTickets()` | Tickets de l'utilisateur connecté |
| `src/modules/support/actions.ts` | `getAllTickets()` | Tous les tickets (admin uniquement) |
| `src/modules/support/actions.ts` | `updateTicketStatus(ticketId, statut)` | Changer statut (admin) |
| `src/modules/support/actions.ts` | `assignTicket(ticketId, adminId)` | Assigner à un admin |
| `src/modules/support/actions.ts` | `addTicketMessage(ticketId, contenu)` | Répondre dans le fil |
| `src/modules/support/actions.ts` | `getTicketMessages(ticketId)` | Historique du fil |
| `src/modules/support/actions.ts` | `searchFaqArticles(query)` | Recherche plein texte FAQ |
| `src/modules/support/actions.ts` | `getFaqArticles(categorie?)` | Liste FAQ (avec filtre optionnel) |
| `src/modules/support/actions.ts` | `convertTicketToFaq(ticketId)` | Conversion ticket résolu → FAQ |
| `src/modules/support/actions.ts` | `createFaqArticle(data)` | Création manuelle d'un article FAQ |

### 3.2 Pages Next.js

| Chemin | Type | Rôles autorisés |
|---|---|---|
| `src/app/faq/page.tsx` | Server | Public (tous) |
| `src/app/dashboard/support/page.tsx` | Server | Tous les utilisateurs connectés |
| `src/app/dashboard/support/nouveau/page.tsx` | Server | Tous les utilisateurs connectés |
| `src/app/dashboard/support/[ticketId]/page.tsx` | Server | Auteur du ticket + admins |
| `src/app/dashboard/support/admin/page.tsx` | Server | Admin uniquement |

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/support/components/TicketForm.tsx` | Formulaire de soumission de ticket |
| `src/modules/support/components/FaqSuggestions.tsx` | Suggestions FAQ en temps réel (pendant la saisie) |
| `src/modules/support/components/TicketList.tsx` | Liste des tickets de l'utilisateur |
| `src/modules/support/components/TicketThread.tsx` | Fil de discussion d'un ticket |
| `src/modules/support/components/TicketStatusBadge.tsx` | Badge coloré de statut |
| `src/modules/support/components/KanbanBoard.tsx` | Tableau Kanban admin (À faire / En cours / Terminé) |
| `src/modules/support/components/KanbanCard.tsx` | Carte ticket dans le Kanban |
| `src/modules/support/components/FaqPage.tsx` | Page FAQ complète avec recherche |
| `src/modules/support/components/FaqArticleCard.tsx` | Carte d'un article FAQ |
| `src/modules/support/components/ConvertToFaqButton.tsx` | Bouton conversion ticket → FAQ (admin) |

### 3.4 Types TypeScript

Fichier : `src/modules/support/types/index.ts`

```typescript
export type TicketStatut = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
export type TicketCategorie = 'pedagogie' | 'batiment' | 'informatique' | 'autre';

export interface Ticket {
  id: string;
  sujet: string;
  description: string;
  categorie: TicketCategorie;
  statut: TicketStatut;
  auteur_id: string;
  au_nom_de_classe: boolean;
  class_id?: string;
  assigne_a?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface FaqArticle {
  id: string;
  question: string;
  reponse: string;
  categorie: TicketCategorie;
  publie: boolean;
  auteur_id: string;
  source_ticket_id?: string;
  created_at: string;
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter les tables `tickets`, `ticket_messages`, `faq_articles` dans Supabase Studio. Appliquer toutes les policies RLS. Tester avec un user `eleve` (ne voit que ses tickets) et un user `admin` (voit tout).
- [ ] **Étape 2 — Types** : Créer `src/modules/support/types/index.ts`.
- [ ] **Étape 3 — Action `searchFaqArticles`** : Utiliser la recherche plein texte Supabase : `supabase.from('faq_articles').select('*').textSearch('question', query)`. Cette action est appelée côté client avec debounce (300ms).
- [ ] **Étape 4 — Composant `TicketForm`** : Client Component. Champs : sujet (text), catégorie (select), description (textarea). Pendant la saisie du sujet, déclencher `searchFaqArticles(sujet)` avec debounce et afficher `FaqSuggestions` dans un panneau latéral. Si l'utilisateur est `delegue` (champ `role_secondaire` de StudentProfile), afficher une checkbox "Ouvrir au nom de ma classe".
- [ ] **Étape 5 — Soumission ticket** : Action `createTicket(data)`. Vérifier côté serveur que `auteur_id = auth.uid()`. Si `au_nom_de_classe = true`, vérifier que le demandeur a bien `role_secondaire = 'delegue'`. Rediriger vers `/dashboard/support` après succès.
- [ ] **Étape 6 — Page "Mes tickets"** : `TicketList.tsx` — liste avec `TicketStatusBadge.tsx` (vert=résolu, orange=en cours, rouge=ouvert). Clic sur un ticket → page `/dashboard/support/[ticketId]`.
- [ ] **Étape 7 — Page ticket individuel** : `TicketThread.tsx` — affiche le ticket + le fil de messages. Champ de réponse en bas. Appel `addTicketMessage()` au submit. Si admin, afficher les boutons de changement de statut.
- [ ] **Étape 8 — Tableau Kanban admin** : Page `/dashboard/support/admin`. `getAllTickets()` regroupés par statut. `KanbanBoard.tsx` avec 3 colonnes. Chaque `KanbanCard.tsx` affiche sujet, auteur, catégorie, date. Glisser-déposer optionnel (si le temps le permet — utiliser `@dnd-kit` ou solution simple avec boutons).
- [ ] **Étape 9 — Conversion ticket → FAQ** : `ConvertToFaqButton.tsx` visible si statut = `resolu` et rôle = `admin`. Au clic, appel `convertTicketToFaq(ticketId)` qui crée un `faq_articles` avec `source_ticket_id` et redirige vers la FAQ pour vérification.
- [ ] **Étape 10 — Page FAQ publique** : `/faq/page.tsx` — pas de protection auth. `getFaqArticles()` avec filtre par catégorie. Barre de recherche qui appelle `searchFaqArticles()`. Afficher par catégories avec accordéon ou liste filtrée.
- [ ] **Étape 11 — Commit** : `git commit -m "feat(support): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** modifier `classes`, `grades`, `course_materials` — appartiennent au Module 2.
- **NE PAS** créer de routes dans `/dashboard/pedagogie/`, `/dashboard/carriere/`, `/dashboard/com/`.
- **NE PAS** implémenter le drag-and-drop si cela nécessite une dépendance npm lourde non approuvée — utiliser des boutons simples à la place.
- **NE PAS** stocker le contenu HTML brut dans `faq_articles.reponse` — markdown uniquement (utiliser `react-markdown` pour le rendu).
- **La page `/faq` est publique** : elle ne doit pas importer `getCurrentUserProfile()` ni dépendre de l'auth.
- **Dépendance autorisée vers Module 1 uniquement :** `import { getCurrentUserProfile } from '@/modules/auth/actions'`.
- **Référence autorisée vers Module 2 :** La colonne `class_id` dans `tickets` référence `public.classes(id)` — c'est une FK en base de données uniquement, pas d'import de code du Module 2.
