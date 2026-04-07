# Module Carrière & Alternance - Spécifications de Développement

**Assigné à :** Dev 3
**Branche Git :** `feat/T03-career-alternance`
**Règle absolue :** Ce module est conditionné par le champ `type_parcours` de `StudentProfile`. Tu ne peux pas lire ce champ directement — tu dois passer par `getCurrentUserProfile()` du Module 1. Interdiction de modifier les modules 1, 2, 4, 5 et 6.

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Section 3A & 3B) et `backlog.md` (US22, US23, US24) :

**Parcours "Temps Plein" :**
- Job Board : liste des offres de stages et d'alternances postées par le pôle commercial (AdminProfile).
- Événements : calendrier d'inscription aux forums, ateliers CV.

**Parcours "Alternant" :**
- Espace Tripartite : chat privé à 3 (Élève + Référent école + Maître d'apprentissage entreprise).
- Livret d'Apprentissage : upload de rendus (fiches, diaporamas) par l'élève.
- Workflow de validation : dépôt → notification → validation + notation par le référent ou le maître.

> L'affichage est conditionné au `type_parcours` : un élève `temps_plein` ne voit jamais l'espace tripartite et vice-versa.

---

## 2. Base de Données (Supabase)

### 2.1 Tables à créer

```sql
-- -----------------------------------------------------------
-- TABLE : JobOffer (Parcours Temps Plein)
-- -----------------------------------------------------------
CREATE TABLE public.job_offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  entreprise    TEXT NOT NULL,
  description   TEXT,
  type_contrat  TEXT NOT NULL CHECK (type_contrat IN ('stage', 'alternance', 'cdi', 'cdd')),
  localisation  TEXT,
  lien_candidature TEXT,
  publie_par    UUID NOT NULL REFERENCES auth.users(id),  -- AdminProfile
  actif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : Event (Parcours Temps Plein)
-- -----------------------------------------------------------
CREATE TABLE public.career_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  description TEXT,
  lieu        TEXT,
  date_debut  TIMESTAMPTZ NOT NULL,
  date_fin    TIMESTAMPTZ,
  publie_par  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : EventRegistration — inscriptions aux événements
-- -----------------------------------------------------------
CREATE TABLE public.event_registrations (
  event_id   UUID REFERENCES public.career_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, student_id)
);

-- -----------------------------------------------------------
-- TABLE : TripartiteChat — espace tripartite (Parcours Alternant)
-- -----------------------------------------------------------
CREATE TABLE public.tripartite_chats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES auth.users(id),
  referent_id     UUID NOT NULL REFERENCES auth.users(id),   -- AdminProfile
  maitre_id       UUID NOT NULL REFERENCES auth.users(id),   -- CompanyProfile
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : TripartiteMessage
-- -----------------------------------------------------------
CREATE TABLE public.tripartite_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES public.tripartite_chats(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : ApprenticeshipEntry — Livret d'apprentissage
-- -----------------------------------------------------------
CREATE TABLE public.apprenticeship_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES auth.users(id),
  chat_id      UUID NOT NULL REFERENCES public.tripartite_chats(id),
  titre        TEXT NOT NULL,
  description  TEXT,
  fichier_url  TEXT NOT NULL,   -- URL Supabase Storage
  statut       TEXT NOT NULL DEFAULT 'soumis'
                 CHECK (statut IN ('soumis', 'en_revision', 'valide', 'refuse')),
  note         NUMERIC(5,2) CHECK (note BETWEEN 0 AND 20),
  valide_par   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Row Level Security (RLS)

```sql
ALTER TABLE public.job_offers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tripartite_chats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tripartite_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeship_entries ENABLE ROW LEVEL SECURITY;

-- Job offers : visibles par tous les utilisateurs connectés
CREATE POLICY "Offres visibles" ON public.job_offers
  FOR SELECT USING (auth.uid() IS NOT NULL AND actif = TRUE);

-- Job offers : création par admin uniquement
CREATE POLICY "Admin publie offres" ON public.job_offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Events : visibles par tous
CREATE POLICY "Events visibles" ON public.career_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Inscriptions : un élève gère ses propres inscriptions
CREATE POLICY "Inscription propre" ON public.event_registrations
  FOR ALL USING (auth.uid() = student_id);

-- Tripartite : accessible uniquement aux 3 participants
CREATE POLICY "Accès tripartite" ON public.tripartite_chats
  FOR SELECT USING (
    auth.uid() IN (student_id, referent_id, maitre_id)
  );

-- Messages tripartite : idem
CREATE POLICY "Messages tripartite" ON public.tripartite_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.student_id, tc.referent_id, tc.maitre_id)
    )
  );

-- Livret : lecture par les 3 participants du chat
CREATE POLICY "Lecture livret" ON public.apprenticeship_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.student_id, tc.referent_id, tc.maitre_id)
    )
  );

-- Livret : upload uniquement par l'élève
CREATE POLICY "Upload livret" ON public.apprenticeship_entries
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Livret : validation par référent ou maître
CREATE POLICY "Validation livret" ON public.apprenticeship_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.referent_id, tc.maitre_id)
    )
  );
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/career/actions.ts` | `getJobOffers()` | Liste les offres actives |
| `src/modules/career/actions.ts` | `publishJobOffer(data)` | Admin publie une offre |
| `src/modules/career/actions.ts` | `getCareerEvents()` | Liste les événements |
| `src/modules/career/actions.ts` | `registerToEvent(eventId)` | Inscription à un événement |
| `src/modules/career/actions.ts` | `getMyTripartiteChat()` | Chat tripartite de l'élève connecté |
| `src/modules/career/actions.ts` | `sendTripartiteMessage(chatId, contenu)` | Envoi message tripartite |
| `src/modules/career/actions.ts` | `uploadApprenticeshipEntry(data, file)` | Dépôt d'un rendu |
| `src/modules/career/actions.ts` | `validateEntry(entryId, note, statut)` | Validation par référent/maître |
| `src/modules/career/actions.ts` | `getMyEntries()` | Rendus de l'élève connecté |

### 3.2 Pages Next.js

| Chemin | Type | Condition d'affichage |
|---|---|---|
| `src/app/dashboard/carriere/page.tsx` | Server | Tous les élèves |
| `src/app/dashboard/carriere/job-board/page.tsx` | Server | `type_parcours = temps_plein` |
| `src/app/dashboard/carriere/evenements/page.tsx` | Server | `type_parcours = temps_plein` |
| `src/app/dashboard/carriere/tripartite/page.tsx` | Server | `type_parcours = alternant` |
| `src/app/dashboard/carriere/livret/page.tsx` | Server | `type_parcours = alternant` |

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/career/components/CareerRouter.tsx` | Routeur conditionnel selon `type_parcours` |
| `src/modules/career/components/JobOfferCard.tsx` | Carte d'offre d'emploi |
| `src/modules/career/components/JobBoard.tsx` | Liste des offres avec filtres |
| `src/modules/career/components/PublishJobForm.tsx` | Formulaire publication offre (admin) |
| `src/modules/career/components/EventCalendar.tsx` | Calendrier des événements |
| `src/modules/career/components/EventCard.tsx` | Carte événement + bouton inscription |
| `src/modules/career/components/TripartiteChat.tsx` | Chat à 3 temps réel (Client Component) |
| `src/modules/career/components/ApprenticeshipList.tsx` | Liste des rendus du livret |
| `src/modules/career/components/UploadEntryForm.tsx` | Formulaire dépôt de rendu (élève) |
| `src/modules/career/components/ValidationPanel.tsx` | Panel validation + notation (référent/maître) |

### 3.4 Types TypeScript

Fichier : `src/modules/career/types/index.ts`

```typescript
export interface JobOffer {
  id: string;
  titre: string;
  entreprise: string;
  description?: string;
  type_contrat: 'stage' | 'alternance' | 'cdi' | 'cdd';
  localisation?: string;
  lien_candidature?: string;
  publie_par: string;
  actif: boolean;
  created_at: string;
}

export interface CareerEvent {
  id: string;
  titre: string;
  description?: string;
  lieu?: string;
  date_debut: string;
  date_fin?: string;
}

export interface TripartiteChat {
  id: string;
  student_id: string;
  referent_id: string;
  maitre_id: string;
}

export interface TripartiteMessage {
  id: string;
  chat_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface ApprenticeshipEntry {
  id: string;
  student_id: string;
  chat_id: string;
  titre: string;
  description?: string;
  fichier_url: string;
  statut: 'soumis' | 'en_revision' | 'valide' | 'refuse';
  note?: number;
  valide_par?: string;
  created_at: string;
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter toutes les tables de ce module dans Supabase Studio. Appliquer toutes les policies RLS. Tester manuellement avec un user `temps_plein` et un user `alternant`.
- [ ] **Étape 2 — Supabase Storage** : Créer un bucket `apprenticeship-files` dans Supabase Storage. Le rendre privé (accès signé uniquement). Définir la policy : seul l'élève propriétaire peut uploader, les 3 participants peuvent lire.
- [ ] **Étape 3 — Types** : Créer `src/modules/career/types/index.ts`.
- [ ] **Étape 4 — Action `getMyTripartiteChat`** : Appeler `getCurrentUserProfile()`. Si `type_parcours !== 'alternant'`, retourner `null` immédiatement. Sinon, requêter `tripartite_chats` pour trouver le chat de cet élève.
- [ ] **Étape 5 — Composant `CareerRouter`** : Server Component. Appeler `getCurrentUserProfile()`. Selon `type_parcours`, afficher soit le Job Board + Événements, soit le chat Tripartite + Livret. Si l'utilisateur n'est pas `eleve`, afficher une vue admin adaptée.
- [ ] **Étape 6 — Job Board** : `getJobOffers()` + `JobOfferCard.tsx`. Filtres côté client : par type de contrat. `PublishJobForm.tsx` visible uniquement si rôle `admin`.
- [ ] **Étape 7 — Événements** : `getCareerEvents()` + `EventCalendar.tsx`. `registerToEvent()` appelle l'action et optimistic UI met à jour le bouton "Inscrit".
- [ ] **Étape 8 — Chat Tripartite** : `TripartiteChat.tsx` (Client Component). Abonnement `supabase.channel()` sur `tripartite_messages`. Afficher le nom de l'auteur (via `author_id`, résoudre depuis les profils). Distinguer visuellement les 3 participants par couleur.
- [ ] **Étape 9 — Livret d'apprentissage** : `UploadEntryForm.tsx` — input fichier + titre + description. Upload vers Supabase Storage, puis insert dans `apprenticeship_entries` avec l'URL signée. `ApprenticeshipList.tsx` — liste les rendus avec leur statut (badge coloré).
- [ ] **Étape 10 — Workflow validation** : `ValidationPanel.tsx` visible si rôle `admin` ou `entreprise` ET participant du chat. Bouton "Valider" → appel `validateEntry(entryId, note, 'valide')`. Bouton "Refuser" → `validateEntry(entryId, null, 'refuse')`. Afficher un toast de confirmation.
- [ ] **Étape 11 — Commit** : `git commit -m "feat(career): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** lire directement `student_profiles` — passer par `getCurrentUserProfile()` du Module 1.
- **NE PAS** modifier les tables du Module 2 (`grades`, `classes`, `course_materials`).
- **NE PAS** créer des routes dans `/dashboard/pedagogie/` ou `/dashboard/support/`.
- **NE PAS** exposer le chat tripartite à des utilisateurs qui ne sont pas les 3 participants désignés.
- **NE PAS** stocker les fichiers uploadés en base64 en base de données — obligatoirement Supabase Storage.
- **Dépendance autorisée vers Module 1 uniquement :** `import { getCurrentUserProfile } from '@/modules/auth/actions'`.
