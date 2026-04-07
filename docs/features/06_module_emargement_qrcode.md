# Module Émargement & QR Code - Spécifications de Développement

**Assigné à :** Dev 2 (partagé avec Module 2)
**Branche Git :** `feat/T02-pedagogy-espace-classe`
**Règle absolue :** Ce module s'appuie sur les classes du Module 2 (`classes`, `class_members`, `teacher_classes`) en lecture seule via des FK en base de données. Toute interaction avec ces tables se fait uniquement via des Server Actions, jamais par import direct de code du Module 2. Interdiction de modifier les modules 1, 3, 4 et 5.

---

## Design & Templates

> **Avant de coder toute page ou composant**, consulter :
> - [`docs/templates/README.md`](../templates/README.md) — charte graphique, palette, typographie Outfit, règles responsive
> - [`docs/templates/emargement/`](../templates/emargement/) — maquettes affichage QR code, liste présences, tableau de bord émargement
> - [`docs/templates/global/`](../templates/global/) — layout dashboard (sidebar + header)
> - [`docs/technical/ui_guidelines.md`](../technical/ui_guidelines.md) — tokens shadcn, composants, états UI

**Exigences responsive :**
- Mobile : QR code centré pleine largeur, grand et lisible (min `256×256px`)
- Tablet/Desktop : QR code à gauche, liste présences à droite en temps réel

---

## 1. Objectifs & Backlog

Basé sur `base.md` (Pôle Présence & Émargement Numérique) et `backlog.md` (US22, US24) :

- **Vue Professeur :** Générer un QR Code dynamique lié à une session de cours, expiration paramétrable (5 ou 10 min), affichage plein écran avec compteur en temps réel des présences.
- **Vue Élève :** Scanner le QR Code (caméra) pour pointer sa présence. Un seul scan par appareil par session.
- **Reporting Admin :** Après fermeture de session, générer la liste des absents pour l'administration.
- **Anti-fraude :** Le jeton QR expire, un `device_fingerprint` limite les scans multiples.

---

## 2. Base de Données (Supabase)

### 2.1 Tables à créer

```sql
-- -----------------------------------------------------------
-- TABLE : AttendanceSession — une session d'appel par cours
-- -----------------------------------------------------------
CREATE TABLE public.attendance_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id      UUID NOT NULL REFERENCES auth.users(id),
  code_unique     UUID NOT NULL DEFAULT gen_random_uuid(),  -- Token dans le QR Code
  expiration      TIMESTAMPTZ NOT NULL,                     -- NOW() + 5 ou 10 min
  statut          TEXT NOT NULL DEFAULT 'ouvert'
                    CHECK (statut IN ('ouvert', 'ferme')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : AttendanceRecord — un pointage par élève par session
-- -----------------------------------------------------------
CREATE TABLE public.attendance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES auth.users(id),
  statut_presence   TEXT NOT NULL DEFAULT 'present'
                      CHECK (statut_presence IN ('present', 'en_retard')),
  heure_pointage    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_fingerprint TEXT NOT NULL,                         -- Anti-fraude
  UNIQUE (session_id, student_id),                         -- 1 seul scan par élève
  UNIQUE (session_id, device_fingerprint)                  -- 1 seul scan par appareil
);
```

### 2.2 Row Level Security (RLS)

```sql
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records  ENABLE ROW LEVEL SECURITY;

-- Sessions : un prof voit ses propres sessions
CREATE POLICY "Prof voit ses sessions" ON public.attendance_sessions
  FOR SELECT USING (auth.uid() = teacher_id);

-- Sessions : les admins voient toutes les sessions
CREATE POLICY "Admin voit toutes les sessions" ON public.attendance_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Sessions : création réservée aux profs de la classe
CREATE POLICY "Prof crée une session" ON public.attendance_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM public.teacher_classes
      WHERE teacher_id = auth.uid() AND class_id = attendance_sessions.class_id
    )
  );

-- Sessions : fermeture uniquement par le prof propriétaire
CREATE POLICY "Prof ferme sa session" ON public.attendance_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Records : un élève voit ses propres pointages
CREATE POLICY "Eleve voit ses pointages" ON public.attendance_records
  FOR SELECT USING (auth.uid() = student_id);

-- Records : les profs voient les pointages de leurs sessions
CREATE POLICY "Prof voit les pointages de sa session" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
  );

-- Records : les admins voient tout
CREATE POLICY "Admin voit tous les pointages" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Records : un élève peut pointer UNE SEULE FOIS par session
-- (Le UNIQUE en base + la RLS ci-dessous)
CREATE POLICY "Pointage élève" ON public.attendance_records
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    -- La session doit être ouverte et non expirée
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND s.statut = 'ouvert'
        AND s.expiration > NOW()
    ) AND
    -- L'élève doit être membre de la classe
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      JOIN public.class_members cm ON cm.class_id = s.class_id
      WHERE s.id = session_id AND cm.student_id = auth.uid()
    )
  );
```

---

## 3. Architecture Next.js (App Router)

### 3.1 Server Actions

| Fichier | Fonction | Description |
|---|---|---|
| `src/modules/attendance/actions.ts` | `createAttendanceSession(classId, durationMin)` | Ouvre une session (prof) |
| `src/modules/attendance/actions.ts` | `closeAttendanceSession(sessionId)` | Ferme la session (prof) |
| `src/modules/attendance/actions.ts` | `getSessionByCode(codeUnique)` | Valide un QR Code scanné |
| `src/modules/attendance/actions.ts` | `checkIn(codeUnique, deviceFingerprint)` | Pointe la présence (élève) |
| `src/modules/attendance/actions.ts` | `getSessionRecords(sessionId)` | Liste les présents (prof/admin) |
| `src/modules/attendance/actions.ts` | `getAbsentees(sessionId)` | Génère la liste des absents |
| `src/modules/attendance/actions.ts` | `getMyAttendanceHistory()` | Historique de présence (élève) |

### 3.2 API Route (pour le scan QR)

> Le scan QR depuis la caméra nécessite une URL accessible par le mobile. Utiliser une **API Route** et non une Server Action pour ce cas précis.

| Fichier | Méthode | Description |
|---|---|---|
| `src/app/api/attendance/checkin/route.ts` | `POST` | Reçoit `{ codeUnique, deviceFingerprint }`, valide, insère le record |

### 3.3 Pages Next.js

| Chemin | Type | Rôles |
|---|---|---|
| `src/app/dashboard/emargement/page.tsx` | Server | Prof et Admin |
| `src/app/dashboard/emargement/session/[sessionId]/page.tsx` | Server | Prof (vue QR Code) |
| `src/app/dashboard/emargement/scan/page.tsx` | Client | Élève (scanner caméra) |
| `src/app/dashboard/emargement/rapport/[sessionId]/page.tsx` | Server | Prof et Admin |

### 3.4 Composants UI

| Chemin | Description |
|---|---|
| `src/modules/attendance/components/StartSessionForm.tsx` | Choix classe + durée, bouton "Lancer l'appel" |
| `src/modules/attendance/components/QrCodeDisplay.tsx` | QR Code plein écran + timer dégressif + compteur présents |
| `src/modules/attendance/components/AttendanceCounter.tsx` | Compteur temps réel (Supabase Realtime) |
| `src/modules/attendance/components/QrScanner.tsx` | Caméra + scan QR (Client Component, lib: `@zxing/browser`) |
| `src/modules/attendance/components/CheckInResult.tsx` | Message de confirmation / erreur après scan |
| `src/modules/attendance/components/AttendanceReport.tsx` | Tableau présents / absents après fermeture |
| `src/modules/attendance/components/AbsencesList.tsx` | Liste exportable des absents |

### 3.5 Types TypeScript

Fichier : `src/modules/attendance/types/index.ts`

```typescript
export type SessionStatut = 'ouvert' | 'ferme';
export type PresenceStatut = 'present' | 'en_retard';

export interface AttendanceSession {
  id: string;
  class_id: string;
  teacher_id: string;
  code_unique: string;
  expiration: string;
  statut: SessionStatut;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  statut_presence: PresenceStatut;
  heure_pointage: string;
  device_fingerprint: string;
}

export interface AttendanceReport {
  session: AttendanceSession;
  presents: AttendanceRecord[];
  absents: { student_id: string; nom: string; prenom: string }[];
  taux_presence: number; // en %
}
```

---

## 4. Checklist d'Exécution pas-à-pas

- [ ] **Étape 1 — SQL** : Exécuter `attendance_sessions` et `attendance_records` dans Supabase Studio. Vérifier les contraintes `UNIQUE` sur `(session_id, student_id)` et `(session_id, device_fingerprint)`. Appliquer les RLS.
- [ ] **Étape 2 — Types** : Créer `src/modules/attendance/types/index.ts`.
- [ ] **Étape 3 — Action `createAttendanceSession`** : Vérifier que le prof est assigné à la classe (`teacher_classes`). Calculer `expiration = NOW() + durationMin * INTERVAL '1 minute'`. Insérer dans `attendance_sessions`. Retourner la session créée avec son `code_unique`.
- [ ] **Étape 4 — Génération QR Code** : Installer `qrcode.react` (`npm install qrcode.react`). Dans `QrCodeDisplay.tsx` (Client Component), générer un QR Code dont la valeur est l'URL de scan : `https://[domain]/dashboard/emargement/scan?code=[code_unique]`. Afficher un countdown basé sur `expiration`. S'abonner à `attendance_records` via Supabase Realtime pour le compteur.
- [ ] **Étape 5 — `AttendanceCounter`** : Client Component, s'abonne à `supabase.channel('presence-[sessionId]').on('postgres_changes', { event: 'INSERT', table: 'attendance_records', filter: 'session_id=eq.[sessionId]' }, callback)`. Affiche `X / Y élèves présents`.
- [ ] **Étape 6 — Action `closeAttendanceSession`** : Met `statut = 'ferme'`. Appelle `getAbsentees()` qui fait un LEFT JOIN entre `class_members` et `attendance_records` pour trouver qui n'a pas pointé. Retourner le rapport complet.
- [ ] **Étape 7 — Scan QR côté élève** : Page `/dashboard/emargement/scan` est un Client Component. Installer `@zxing/browser`. `QrScanner.tsx` ouvre la caméra, décode le QR, extrait `code_unique`. Générer un `deviceFingerprint` (ex: `navigator.userAgent + screen.width + screen.height` hashé avec `crypto.subtle`). Appeler `POST /api/attendance/checkin` avec `{ codeUnique, deviceFingerprint }`.
- [ ] **Étape 8 — API Route `/api/attendance/checkin`** : Valider la session (existe, statut ouvert, non expirée). Insérer dans `attendance_records`. En cas de doublon (UNIQUE constraint), retourner `{ error: 'Déjà pointé' }`. Si expirée : `{ error: 'Session expirée' }`. Si succès : `{ success: true, statut: 'present' }`. `CheckInResult.tsx` affiche le message adapté.
- [ ] **Étape 9 — Rapport de présence** : Page `/dashboard/emargement/rapport/[sessionId]`. `AttendanceReport.tsx` — 2 colonnes : présents (avec heure de pointage) et absents. `AbsencesList.tsx` — bouton "Exporter CSV" qui génère un fichier téléchargeable côté client (`Blob` + `URL.createObjectURL`).
- [ ] **Étape 10 — Gestion de l'expiration** : Si un élève essaie de scanner après expiration, l'API Route retourne une erreur. La page scan vérifie aussi côté client l'état de la session avant d'ouvrir la caméra. Pas de cron job nécessaire — l'expiration est vérifiée à chaque requête.
- [ ] **Étape 11 — Commit** : `git commit -m "feat(attendance): [description] (Ref: US24)"`. 1 commit par étape.

---

## 5. Limites et Anti-Collisions

- **NE PAS** modifier les tables `classes`, `class_members`, `teacher_classes` — appartiennent au Module 2. Utiliser uniquement des FK en base de données vers ces tables.
- **NE PAS** importer de code depuis `src/modules/pedagogy/` — utiliser les données via les actions de ce module uniquement.
- **NE PAS** stocker de données biométriques ou de géolocalisation dans `device_fingerprint` — uniquement des données techniques non sensibles (user-agent, résolution).
- **NE PAS** afficher la liste des présents à un élève — vue réservée au prof et à l'admin.
- **NE PAS** laisser le QR Code accessible en dehors de la session du prof (pas de lien partageable permanent).
- **La lib `@zxing/browser` doit être installée localement** — ne pas passer par un CDN externe.
- **Dépendances autorisées :**
  - `import { getCurrentUserProfile } from '@/modules/auth/actions'` (Module 1)
  - `qrcode.react` (npm)
  - `@zxing/browser` (npm)
