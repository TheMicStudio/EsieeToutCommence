# Module Pédagogie & Espace Classe - Spécifications de Développement

**Assigné à :** Dev 2
**Branche Git :** `feat/T02-pedagogy-espace-classe`
**Règle absolue :** Interdiction stricte de modifier les tables `user_roles`, `student_profiles`, `teacher_profiles` ou tout fichier appartenant à `src/modules/auth/`. Pour identifier l'utilisateur connecté, utiliser **uniquement** `getCurrentUserProfile()` importé depuis `src/modules/auth/actions.ts`.

---

## Design & Templates

> **Avant de coder toute page ou composant**, consulter :
> - [`docs/templates/README.md`](../templates/README.md) — charte graphique, palette, typographie Outfit, règles responsive
> - [`docs/templates/pedagogie/`](../templates/pedagogie/) — maquettes liste cours, détail cours, espace classe
> - [`docs/templates/global/`](../templates/global/) — layout dashboard (sidebar + header)
> - [`docs/technical/ui_guidelines.md`](../technical/ui_guidelines.md) — tokens shadcn, composants, états UI

**Exigences responsive :**
- Mobile : liste cours en cartes pleine largeur, 1 colonne
- Tablet : grille 2 colonnes (`grid-cols-2`)
- Desktop : grille 3 colonnes (`grid-cols-3`), sidebar fixe

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Section 2) et `backlog.md` (US22, US23, US24, US25) :

- Créer et gérer les classes (`Class`).
- Permettre aux professeurs d'uploader des supports de cours (`CourseMaterial`).
- Gérer les notes par élève et calculer les moyennes automatiquement (`Grade`).
- Mettre en place un chat de classe avec deux canaux par défaut ("Général" et "Entraide élèves").
- Isolation stricte : un élève ne voit que sa classe, un prof ne voit que ses classes assignées.

---

## 2. Base de Données (Supabase)

### 2.1 Tables à créer

```sql
-- -----------------------------------------------------------
-- TABLE : Class
-- -----------------------------------------------------------
CREATE TABLE public.classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        TEXT NOT NULL,           -- ex: "Bachelor 3 IT"
  annee      INT  NOT NULL,           -- ex: 2025
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : ClassMember — liaison élève ↔ classe
-- -----------------------------------------------------------
CREATE TABLE public.class_members (
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- -----------------------------------------------------------
-- TABLE : TeacherClass — liaison prof ↔ classe
-- -----------------------------------------------------------
CREATE TABLE public.teacher_classes (
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere    TEXT NOT NULL,
  PRIMARY KEY (class_id, teacher_id, matiere)
);

-- -----------------------------------------------------------
-- TABLE : CourseMaterial
-- -----------------------------------------------------------
CREATE TABLE public.course_materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES auth.users(id),
  titre       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'lien')),
  url         TEXT NOT NULL,
  matiere     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : Grade
-- -----------------------------------------------------------
CREATE TABLE public.grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES auth.users(id),
  class_id    UUID NOT NULL REFERENCES public.classes(id),
  matiere     TEXT NOT NULL,
  examen      TEXT NOT NULL,           -- Intitulé de l'examen
  note        NUMERIC(5,2) NOT NULL CHECK (note BETWEEN 0 AND 20),
  coefficient NUMERIC(3,1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : ClassChannel — canaux de chat par classe
-- -----------------------------------------------------------
CREATE TABLE public.class_channels (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id  UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  nom       TEXT NOT NULL,            -- "Général" ou "Entraide élèves"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : ClassMessage
-- -----------------------------------------------------------
CREATE TABLE public.class_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.class_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Row Level Security (RLS)

```sql
ALTER TABLE public.classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages   ENABLE ROW LEVEL SECURITY;

-- Helper : est-ce que l'utilisateur est membre de cette classe ?
CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND student_id = auth.uid()
  );
$$;

-- Helper : est-ce que l'utilisateur est prof de cette classe ?
CREATE OR REPLACE FUNCTION public.is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE class_id = p_class_id AND teacher_id = auth.uid()
  );
$$;

-- classes : lisibles par membres et profs
CREATE POLICY "Classe accessible" ON public.classes
  FOR SELECT USING (
    public.is_class_member(id) OR public.is_class_teacher(id)
  );

-- course_materials : lisibles par membres et profs de la classe
CREATE POLICY "Cours accessible à la classe" ON public.course_materials
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- course_materials : création réservée aux profs de la classe
CREATE POLICY "Ajout cours par prof" ON public.course_materials
  FOR INSERT WITH CHECK (
    public.is_class_teacher(class_id) AND auth.uid() = teacher_id
  );

-- grades : un élève ne voit que ses propres notes
CREATE POLICY "Eleve voit ses notes" ON public.grades
  FOR SELECT USING (auth.uid() = student_id);

-- grades : un prof voit et crée les notes de ses classes
CREATE POLICY "Prof gère les notes de sa classe" ON public.grades
  FOR ALL USING (auth.uid() = teacher_id);

-- messages : lisibles par membres de la classe du canal
CREATE POLICY "Messages accessibles à la classe" ON public.class_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_channels cc
      WHERE cc.id = channel_id
      AND (public.is_class_member(cc.class_id) OR public.is_class_teacher(cc.class_id))
    )
  );

-- messages : envoyables par membres et profs
CREATE POLICY "Envoi message" ON public.class_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND EXISTS (
      SELECT 1 FROM public.class_channels cc
      WHERE cc.id = channel_id
      AND (public.is_class_member(cc.class_id) OR public.is_class_teacher(cc.class_id))
    )
  );
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/pedagogy/actions.ts` | `getMyClass()` | Retourne la classe de l'élève connecté |
| `src/modules/pedagogy/actions.ts` | `getMyTeacherClasses()` | Retourne les classes du prof connecté |
| `src/modules/pedagogy/actions.ts` | `getCourseMaterials(classId)` | Supports de cours d'une classe |
| `src/modules/pedagogy/actions.ts` | `addCourseMaterial(data)` | Ajout d'un support (prof uniquement) |
| `src/modules/pedagogy/actions.ts` | `getMyGrades()` | Notes de l'élève connecté |
| `src/modules/pedagogy/actions.ts` | `getClassGrades(classId, matiere)` | Grille notes (prof uniquement) |
| `src/modules/pedagogy/actions.ts` | `addGrade(data)` | Saisie note (prof uniquement) |
| `src/modules/pedagogy/actions.ts` | `computeAverage(studentId, classId)` | Calcul moyenne pondérée par matière |
| `src/modules/pedagogy/actions.ts` | `getClassChannels(classId)` | Canaux de chat de la classe |
| `src/modules/pedagogy/actions.ts` | `getChannelMessages(channelId)` | Historique messages |
| `src/modules/pedagogy/actions.ts` | `sendMessage(channelId, contenu)` | Envoi d'un message |

### 3.2 Pages Next.js

| Chemin | Type | Description |
|---|---|---|
| `src/app/dashboard/pedagogie/page.tsx` | Server | Hub pédagogique — vue selon rôle |
| `src/app/dashboard/pedagogie/cours/page.tsx` | Server | Liste des supports de cours |
| `src/app/dashboard/pedagogie/notes/page.tsx` | Server | Carnet de notes (élève) ou grille (prof) |
| `src/app/dashboard/pedagogie/chat/page.tsx` | Server | Chat de classe |

### 3.3 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/pedagogy/components/CoursMaterialList.tsx` | Liste chronologique des supports |
| `src/modules/pedagogy/components/AddCoursMaterialForm.tsx` | Formulaire upload support (prof) |
| `src/modules/pedagogy/components/GradeBook.tsx` | Carnet de notes élève (lecture) |
| `src/modules/pedagogy/components/GradeGrid.tsx` | Grille de saisie rapide (prof) |
| `src/modules/pedagogy/components/AverageWidget.tsx` | Affichage moyenne par matière |
| `src/modules/pedagogy/components/ClassChat.tsx` | Interface chat temps réel (Supabase Realtime) |
| `src/modules/pedagogy/components/MessageBubble.tsx` | Bulle de message individuelle |

### 3.4 Types TypeScript

Fichier : `src/modules/pedagogy/types/index.ts`

```typescript
export interface Class {
  id: string;
  nom: string;
  annee: number;
}

export interface CourseMaterial {
  id: string;
  class_id: string;
  teacher_id: string;
  titre: string;
  type: 'video' | 'pdf' | 'lien';
  url: string;
  matiere: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  matiere: string;
  examen: string;
  note: number;
  coefficient: number;
  created_at: string;
}

export interface ClassChannel {
  id: string;
  class_id: string;
  nom: string;
}

export interface ClassMessage {
  id: string;
  channel_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
}

export interface AverageByMatiere {
  matiere: string;
  moyenne: number;
  total_coefficients: number;
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter les tables `classes`, `class_members`, `teacher_classes`, `course_materials`, `grades`, `class_channels`, `class_messages` dans Supabase Studio. Créer les fonctions helpers RLS. Vérifier sans erreur.
- [ ] **Étape 2 — Seed de données** : Créer manuellement dans Supabase Studio 1 classe, 2 élèves membres, 1 prof assigné. Vérifier que les RLS bloquent correctement les accès croisés.
- [ ] **Étape 3 — Types** : Créer `src/modules/pedagogy/types/index.ts` avec les interfaces ci-dessus.
- [ ] **Étape 4 — Action `getMyClass`** : Importer `getCurrentUserProfile()` depuis `src/modules/auth/actions.ts`. Vérifier que le rôle est `eleve`. Requêter `class_members` pour trouver la classe. Si non trouvée, retourner `null`.
- [ ] **Étape 5 — Actions supports de cours** : Implémenter `getCourseMaterials(classId)` et `addCourseMaterial(data)`. Vérifier côté serveur que l'utilisateur est bien prof de la classe avant l'insert.
- [ ] **Étape 6 — Actions notes** : Implémenter `getMyGrades()`, `getClassGrades()`, `addGrade()`. Implémenter `computeAverage()` : `SUM(note * coefficient) / SUM(coefficient)` groupé par matière.
- [ ] **Étape 7 — Page supports de cours** : `CourseMaterialList.tsx` — affichage chronologique avec icône selon le type (PDF, vidéo, lien). `AddCoursMaterialForm.tsx` visible uniquement si rôle `professeur`.
- [ ] **Étape 8 — Page notes élève** : `GradeBook.tsx` — tableau par matière avec toutes les notes et la moyenne calculée côté serveur. `AverageWidget.tsx` — encart visuel de la moyenne générale.
- [ ] **Étape 9 — Page notes prof** : `GradeGrid.tsx` — liste des élèves de la classe avec input numérique pour saisir/modifier une note. Appel `addGrade` au submit.
- [ ] **Étape 10 — Chat temps réel** : Utiliser `supabase.channel()` et `postgres_changes` pour s'abonner aux nouveaux messages du canal. `ClassChat.tsx` est un Client Component. Charger l'historique côté serveur, s'abonner côté client. Créer les 2 canaux par défaut ("Général", "Entraide élèves") lors de la création d'une classe (trigger SQL ou action dédiée).
- [ ] **Étape 11 — Commit** : `git commit -m "feat(pedagogy): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** modifier `user_roles`, `student_profiles`, `teacher_profiles` — appartiennent au Module 1.
- **NE PAS** importer depuis `src/modules/career/`, `src/modules/support/`, `src/modules/communication/`, `src/modules/attendance/`.
- **NE PAS** créer de routes d'API publiques — utiliser uniquement des Server Actions.
- **NE PAS** afficher la moyenne générale de classe avec les noms des élèves — vue anonymisée obligatoire (règle `base.md`).
- **NE PAS** uploader des fichiers directement dans Next.js — utiliser Supabase Storage pour les PDFs (URL publique signée).
- **L'unique dépendance autorisée vers le Module 1 :** `import { getCurrentUserProfile } from '@/modules/auth/actions'`.
