# Architecture Technique — Hub École

**Ref :** US10, US11, US12

---

## 1. Justification de la stack (US11)

| Critère | Next.js 16 | Supabase | Tailwind CSS v4 | Docker |
|---------|-----------|----------|-----------------|--------|
| Rapidité d'apprentissage | ✅ React connu de l'équipe | ✅ Interface Studio intuitive | ✅ Utility-first, pas de CSS à écrire | ✅ Standard industrie |
| Maintenabilité | ✅ App Router = structure claire | ✅ RLS = sécurité déclarative | ✅ Classes lisibles | ✅ Environnement reproductible |
| Déploiement | ✅ Vercel ou Docker | ✅ Cloud managé | — | ✅ Portable partout |
| Sécurité | ✅ Server Actions (pas d'API exposée) | ✅ RLS natif PostgreSQL | — | ✅ User non-root |
| Alternatives écartées | Remix (moins mature), SvelteKit (courbe d'apprentissage) | Firebase (NoSQL = schéma flou), PocketBase (communauté plus petite) | MUI (trop lourd), CSS Modules (verbeux) | — |

---

## 2. Architecture globale (US10)

```mermaid
graph TB
    subgraph Client["Navigateur / Mobile"]
        UI[Pages Next.js<br/>React Server Components]
        CC[Client Components<br/>Realtime / Scan QR]
    end

    subgraph Server["Serveur Next.js App Router"]
        SA[Server Actions<br/>src/modules/*/actions.ts]
        MW[Middleware Auth<br/>src/middleware.ts]
        API[API Routes<br/>src/app/api/*]
    end

    subgraph Supabase["Supabase Cloud"]
        AUTH[Auth<br/>auth.users]
        DB[(PostgreSQL<br/>+ RLS)]
        RT[Realtime<br/>Websockets]
        ST[Storage<br/>Fichiers / Rendus]
    end

    UI --> SA
    CC --> API
    SA --> MW
    MW --> AUTH
    SA --> DB
    CC --> RT
    API --> DB
    SA --> ST

    style Client fill:#dbeafe
    style Server fill:#dcfce7
    style Supabase fill:#fef9c3
```

### Responsabilités des blocs

| Bloc | Responsabilité | Ne fait PAS |
|------|---------------|-------------|
| **Pages (RSC)** | Fetch des données, rendu HTML initial | Logique métier, appels directs à la DB |
| **Server Actions** | Logique métier, validation, accès DB | Rendu UI |
| **Middleware** | Vérification session auth sur chaque requête | Logique métier |
| **Client Components** | Interactivité, Realtime, caméra QR | Accès direct à la DB |
| **API Routes** | Endpoints mobiles (scan QR) | Pages ou navigation |
| **Supabase RLS** | Sécurité des données à la source | Logique applicative |

---

## 3. Séparation des modules (anti-collision)

```mermaid
graph LR
    AUTH["Module Auth<br/>(Dev 1)"]
    PED["Module Pédagogie<br/>(Dev 2)"]
    CAR["Module Carrière<br/>(Dev 3)"]
    SUP["Module Support<br/>(Dev 4)"]
    COM["Module Com Interne<br/>(Dev 4)"]
    ATT["Module Émargement<br/>(Dev 2)"]
    PRJ["Module Projets<br/>(Dev 3)"]

    AUTH -->|getCurrentUserProfile| PED
    AUTH -->|getCurrentUserProfile| CAR
    AUTH -->|getCurrentUserProfile| SUP
    AUTH -->|getCurrentUserProfile| COM
    AUTH -->|getCurrentUserProfile| ATT
    AUTH -->|getCurrentUserProfile| PRJ

    PED -->|FK SQL class_id| ATT
    PED -->|FK SQL class_id| PRJ
    PED -->|FK SQL class_id| SUP

    style AUTH fill:#fca5a5
    style PED fill:#86efac
    style CAR fill:#93c5fd
    style SUP fill:#fcd34d
    style COM fill:#f9a8d4
    style ATT fill:#6ee7b7
    style PRJ fill:#a5b4fc
```

**Règle :** Les flèches pleines = seul export de code autorisé (`getCurrentUserProfile`). Les flèches SQL = clés étrangères en base uniquement, pas d'import de code.

---

## 4. Diagramme de séquence — Connexion et routage (US12)

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant MW as Middleware
    participant SA as Server Action (auth)
    participant SB as Supabase Auth
    participant DB as PostgreSQL

    U->>MW: GET /dashboard
    MW->>SB: getUser() — vérifier session
    SB-->>MW: null (non connecté)
    MW-->>U: redirect /auth/login

    U->>SA: signIn(email, password)
    SA->>SB: signInWithPassword()
    SB-->>SA: { user, session }
    SA->>DB: SELECT role FROM user_roles WHERE id = user.id
    DB-->>SA: { role: 'eleve' }
    SA->>DB: SELECT * FROM student_profiles WHERE id = user.id
    DB-->>SA: { StudentProfile }
    SA-->>U: redirect /dashboard

    U->>MW: GET /dashboard
    MW->>SB: getUser()
    SB-->>MW: { user } (connecté)
    MW-->>U: 200 OK — afficher dashboard
```

---

## 5. Diagramme de séquence — Scan QR Émargement (US12)

```mermaid
sequenceDiagram
    actor P as Professeur
    actor E as Élève (mobile)
    participant SA as Server Action
    participant API as API Route /checkin
    participant DB as PostgreSQL

    P->>SA: createAttendanceSession(classId, 10min)
    SA->>DB: INSERT attendance_sessions (expiration = NOW()+10min)
    DB-->>SA: { session.code_unique }
    SA-->>P: Afficher QR Code plein écran

    E->>E: Scanner le QR Code (caméra)
    E->>API: POST /api/attendance/checkin { code_unique, device_fingerprint }
    API->>DB: SELECT session WHERE code_unique = ? AND statut = 'ouvert' AND expiration > NOW()
    DB-->>API: { session }
    API->>DB: INSERT attendance_records (UNIQUE session_id + student_id)
    DB-->>API: success
    API-->>E: { success: true, statut: 'present' }

    Note over P: Compteur temps réel via Supabase Realtime
    DB-->>P: postgres_changes INSERT → compteur +1
```

---

## 6. Modèle de données simplifié

```mermaid
erDiagram
    auth_users ||--o| user_roles : "1:1"
    auth_users ||--o| student_profiles : "1:1"
    auth_users ||--o| teacher_profiles : "1:1"
    auth_users ||--o| admin_profiles : "1:1"
    auth_users ||--o| company_profiles : "1:1"

    classes ||--o{ class_members : "contient"
    classes ||--o{ teacher_classes : "assignés"
    classes ||--o{ course_materials : "ressources"
    classes ||--o{ grades : "notes"
    classes ||--o{ attendance_sessions : "appels"
    classes ||--o{ project_weeks : "semaines"

    project_weeks ||--o{ project_groups : "groupes"
    project_weeks ||--|| retro_boards : "rétro"
    project_groups ||--o{ group_members : "membres"
    retro_boards ||--o{ retro_postits : "post-its"

    tickets ||--o{ ticket_messages : "fil"
    faq_articles }o--o| tickets : "converti depuis"

    tripartite_chats ||--o{ tripartite_messages : "messages"
    tripartite_chats ||--o{ apprenticeship_entries : "livret"
```
