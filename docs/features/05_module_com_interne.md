# Module Communication Interne (Staff Only) - Spécifications de Développement

**Assigné à :** Dev 4 (partagé avec Module 4)
**Branche Git :** `feat/T04-support-faq-communication`
**Règle absolue :** Ce module est strictement réservé aux profils `TeacherProfile` et `AdminProfile`. Toute tentative d'accès par un `eleve` ou `entreprise` doit être bloquée au niveau du middleware ET des policies RLS. Interdiction de modifier les modules 1, 2, 3 et 6.

---

## Design & Templates

> **Avant de coder toute page ou composant**, consulter :
> - [`docs/templates/README.md`](../templates/README.md) — charte graphique, palette, typographie Outfit, règles responsive
> - [`docs/templates/com_interne/`](../templates/com_interne/) — maquettes fil d'actualité, formulaire annonce, badges rôles
> - [`docs/templates/global/`](../templates/global/) — layout dashboard (sidebar + header)
> - [`docs/technical/ui_guidelines.md`](../technical/ui_guidelines.md) — tokens shadcn, composants, états UI

**Exigences responsive :**
- Mobile : fil d'annonces en liste pleine largeur, bouton flottant "+" pour créer
- Desktop : fil centré `max-w-2xl`, éditeur de texte en modale (`Dialog`)

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Section 5) et `backlog.md` (US22, US24) :

- Espace de chat sécurisé et privé pour les professeurs et l'administration.
- Création de canaux thématiques par les admins (ex: "Conseil de classe", "Infos Direction").
- Annuaire staff interne : liste des contacts profs + admins pour mise en relation rapide.
- Accès strictement restreint — aucun élève ni entreprise ne doit voir ce module.

---

## 2. Base de Données (Supabase)

### 2.1 Tables à créer

```sql
-- -----------------------------------------------------------
-- TABLE : StaffChannel — canaux de discussion staff
-- -----------------------------------------------------------
CREATE TABLE public.staff_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  description TEXT,
  cree_par    UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : StaffMessage
-- -----------------------------------------------------------
CREATE TABLE public.staff_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.staff_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Helper SQL : vérifier si l'utilisateur est staff

```sql
-- Fonction réutilisable dans les policies RLS
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (
    EXISTS (SELECT 1 FROM public.teacher_profiles WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );
$$;
```

### 2.3 Row Level Security (RLS)

```sql
ALTER TABLE public.staff_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

-- Canaux : lecture réservée au staff
CREATE POLICY "Staff lit les canaux" ON public.staff_channels
  FOR SELECT USING (public.is_staff());

-- Canaux : création réservée aux admins
CREATE POLICY "Admin crée les canaux" ON public.staff_channels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Canaux : suppression réservée aux admins
CREATE POLICY "Admin supprime les canaux" ON public.staff_channels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Messages : lecture réservée au staff
CREATE POLICY "Staff lit les messages" ON public.staff_messages
  FOR SELECT USING (public.is_staff());

-- Messages : envoi réservé au staff
CREATE POLICY "Staff envoie des messages" ON public.staff_messages
  FOR INSERT WITH CHECK (
    public.is_staff() AND auth.uid() = author_id
  );

-- Messages : suppression uniquement par l'auteur ou un admin
CREATE POLICY "Suppression message staff" ON public.staff_messages
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/communication/actions.ts` | `getStaffChannels()` | Liste des canaux (staff uniquement) |
| `src/modules/communication/actions.ts` | `createStaffChannel(nom, description)` | Créer un canal (admin uniquement) |
| `src/modules/communication/actions.ts` | `deleteStaffChannel(channelId)` | Supprimer un canal (admin uniquement) |
| `src/modules/communication/actions.ts` | `getChannelMessages(channelId)` | Historique des messages d'un canal |
| `src/modules/communication/actions.ts` | `sendStaffMessage(channelId, contenu)` | Envoyer un message |
| `src/modules/communication/actions.ts` | `getStaffDirectory()` | Annuaire de tous les profs et admins |

### 3.2 Pages Next.js

| Chemin | Type | Rôles autorisés |
|---|---|---|
| `src/app/dashboard/communication/page.tsx` | Server | `professeur` + `admin` uniquement |
| `src/app/dashboard/communication/[channelId]/page.tsx` | Server | `professeur` + `admin` uniquement |
| `src/app/dashboard/communication/annuaire/page.tsx` | Server | `professeur` + `admin` uniquement |

> **Important :** La page racine `dashboard/communication/page.tsx` doit vérifier le rôle côté serveur et retourner un `notFound()` ou rediriger si l'utilisateur n'est pas staff.

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/communication/components/StaffChatLayout.tsx` | Layout : sidebar canaux + zone de messages |
| `src/modules/communication/components/ChannelList.tsx` | Liste des canaux avec indicateur de messages non lus |
| `src/modules/communication/components/CreateChannelForm.tsx` | Formulaire création de canal (admin only) |
| `src/modules/communication/components/StaffMessageThread.tsx` | Fil de messages d'un canal (Client Component, temps réel) |
| `src/modules/communication/components/MessageComposer.tsx` | Zone de saisie et envoi de message |
| `src/modules/communication/components/StaffDirectoryList.tsx` | Annuaire staff filtrable par rôle |
| `src/modules/communication/components/StaffContactCard.tsx` | Carte de contact staff (nom, prénom, rôle, matières) |

### 3.4 Types TypeScript

Fichier : `src/modules/communication/types/index.ts`

```typescript
export interface StaffChannel {
  id: string;
  nom: string;
  description?: string;
  cree_par: string;
  created_at: string;
}

export interface StaffMessage {
  id: string;
  channel_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface StaffContact {
  id: string;
  nom: string;
  prenom: string;
  role: 'professeur' | 'admin';
  // Selon le rôle :
  matieres_enseignees?: string[];   // TeacherProfile
  fonction?: string;                 // AdminProfile
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter les tables `staff_channels` et `staff_messages` dans Supabase Studio. Créer la fonction helper `is_staff()`. Appliquer les policies RLS. Tester avec un user `eleve` — il ne doit rien voir.
- [ ] **Étape 2 — Seed de canaux par défaut** : Créer via Supabase Studio (ou une action `seed`) 2 canaux initiaux : "Conseil de classe" et "Infos Direction".
- [ ] **Étape 3 — Types** : Créer `src/modules/communication/types/index.ts`.
- [ ] **Étape 4 — Guard de route** : Dans `src/app/dashboard/communication/page.tsx`, appeler `getCurrentUserProfile()`. Si le rôle n'est pas `professeur` ou `admin`, appeler `notFound()` de Next.js pour retourner une 404 propre. Ne jamais afficher un message "Accès refusé" qui révèle l'existence de la section.
- [ ] **Étape 5 — Action `getStaffChannels`** : Utiliser `createClient()` de `src/lib/supabase/server.ts`. Requête simple sur `staff_channels`. La RLS Supabase bloque automatiquement les non-staff.
- [ ] **Étape 6 — Layout du chat** : `StaffChatLayout.tsx` — sidebar à gauche avec `ChannelList.tsx`, zone principale à droite avec `StaffMessageThread.tsx`. Navigation entre canaux via les paramètres de route `[channelId]`.
- [ ] **Étape 7 — Chat temps réel** : `StaffMessageThread.tsx` est un Client Component. Charger l'historique des messages côté serveur (passés en props). S'abonner à `supabase.channel('staff-messages').on('postgres_changes', ...)` pour les nouveaux messages. `MessageComposer.tsx` appelle `sendStaffMessage()` au submit et vide le champ.
- [ ] **Étape 8 — Création de canal** : `CreateChannelForm.tsx` visible uniquement si rôle `admin`. Bouton "+" dans la sidebar. Formulaire modal avec champ nom + description. Appel `createStaffChannel()`. Revalider le cache Next.js avec `revalidatePath('/dashboard/communication')`.
- [ ] **Étape 9 — Annuaire Staff** : Action `getStaffDirectory()` — requête sur `teacher_profiles` et `admin_profiles`, les merge en une liste de `StaffContact[]` triée par nom. `StaffDirectoryList.tsx` avec filtre par rôle (onglets "Profs" / "Admin"). `StaffContactCard.tsx` affiche les matières pour les profs et la fonction pour les admins.
- [ ] **Étape 10 — Commit** : `git commit -m "feat(communication): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** créer de tables ou colonnes dans les modules 2, 3 ou 4.
- **NE PAS** exposer les canaux staff dans le dashboard d'un élève ou d'une entreprise — même partiellement.
- **NE PAS** utiliser `dangerouslySetInnerHTML` pour le rendu du contenu des messages — risque XSS.
- **NE PAS** afficher `StaffDirectoryList` sur une page publique ou accessible sans auth.
- **NE PAS** permettre aux professeurs de supprimer des canaux — droit admin uniquement.
- **La fonction `is_staff()` appartient à ce module** — ne pas l'utiliser dans les autres modules SQL. Si un autre module a besoin d'une vérification similaire, il crée sa propre fonction.
- **Dépendance autorisée vers Module 1 uniquement :** `import { getCurrentUserProfile } from '@/modules/auth/actions'`.
