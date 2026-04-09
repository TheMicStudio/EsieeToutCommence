# Contrat des Server Actions — EsieeToutCommence

**Ref :** US15

> Ce projet utilise les **Server Actions** de Next.js (pas d'API REST publique).
> Chaque action est typée TypeScript et appelée directement depuis les composants.
> La seule exception est `/api/attendance/checkin` (API Route, accessible mobile).

---

## Convention générale

Toutes les Server Actions retournent :

```typescript
// Succès
{ data: T }

// Erreur
{ error: string }
```

Les erreurs Supabase sont toujours interceptées et retournées en français.

---

## Module Auth (`src/modules/auth/actions.ts`)

### `getCurrentUserProfile()`
**Export public — consommable par tous les modules**

```typescript
// Retour
| { role: 'eleve';      profile: StudentProfile }
| { role: 'professeur'; profile: TeacherProfile }
| { role: 'admin';      profile: AdminProfile }
| { role: 'entreprise'; profile: CompanyProfile }
| null  // non connecté

// Erreurs possibles
// null si session expirée ou utilisateur non trouvé
```

---

### `signIn(email, password)`
```typescript
// Paramètres
email: string       // format email valide
password: string    // min 8 caractères

// Retour succès
{ data: { role: RolePrincipal } }

// Erreurs
"Email ou mot de passe incorrect"
"Compte désactivé"
```

---

### `signUp(email, password, role, profileData)`
```typescript
// Paramètres
email: string
password: string
role: 'eleve' | 'professeur' | 'admin' | 'entreprise'
profileData: StudentProfile | TeacherProfile | AdminProfile | CompanyProfile

// Retour succès
{ data: { userId: string } }

// Erreurs
"Cet email est déjà utilisé"
"Données de profil invalides"
```

---

### `signOut()`
```typescript
// Retour succès
{ data: true }
```

---

### `updateProfile(data)`
```typescript
// Paramètres
data: Partial<StudentProfile | TeacherProfile | AdminProfile | CompanyProfile>

// Retour succès
{ data: true }

// Erreurs
"Données invalides"
"Non autorisé"
```

---

## Module Pédagogie (`src/modules/pedagogy/actions.ts`)

### `getMyClass()`
```typescript
{ data: Class | null }
```

### `getCourseMaterials(classId: string)`
```typescript
{ data: CourseMaterial[] }
// Erreurs : "Classe introuvable" | "Accès non autorisé"
```

### `addCourseMaterial(data)`
```typescript
// Paramètres
{ classId: string; titre: string; type: 'video'|'pdf'|'lien'; url: string; matiere: string }
{ data: CourseMaterial }
// Erreurs : "Réservé aux professeurs" | "URL invalide"
```

### `getMyGrades()`
```typescript
{ data: Grade[] }
```

### `addGrade(data)`
```typescript
{ studentId: string; classId: string; matiere: string; examen: string; note: number; coefficient: number }
{ data: Grade }
// Erreurs : "Note hors plage 0-20" | "Réservé aux professeurs"
```

### `computeAverage(studentId, classId)`
```typescript
{ data: AverageByMatiere[] }
// Calcul : SUM(note * coefficient) / SUM(coefficient)
```

### `sendMessage(channelId: string, contenu: string)`
```typescript
{ data: ClassMessage }
// Erreurs : "Message vide" | "Canal introuvable"
```

---

## Module Carrière (`src/modules/career/actions.ts`)

### `getJobOffers()`
```typescript
{ data: JobOffer[] }  // actif = true uniquement
```

### `publishJobOffer(data)`
```typescript
// Réservé : role = 'admin'
{ data: JobOffer }
// Erreurs : "Réservé aux administrateurs"
```

### `registerToEvent(eventId: string)`
```typescript
{ data: true }
// Erreurs : "Déjà inscrit" | "Événement introuvable"
```

### `uploadApprenticeshipEntry(data, fileUrl)`
```typescript
// Réservé : type_parcours = 'alternant'
{ data: ApprenticeshipEntry }
// Erreurs : "Réservé aux alternants" | "Fichier manquant"
```

### `validateEntry(entryId, note, statut)`
```typescript
// Réservé : referent ou maitre du chat tripartite
statut: 'valide' | 'refuse'
note?: number  // requis si statut = 'valide'
{ data: true }
// Erreurs : "Non autorisé" | "Note hors plage"
```

---

## Module Support (`src/modules/support/actions.ts`)

### `createTicket(data)`
```typescript
{ sujet: string; description: string; categorie: TicketCategorie; auNomDeClasse?: boolean }
{ data: Ticket }
// Erreurs : "Sujet trop court (min 5 car.)" | "Droits de délégué requis"
```

### `updateTicketStatus(ticketId, statut)`
```typescript
// Réservé : role = 'admin'
statut: TicketStatut
{ data: true }
```

### `searchFaqArticles(query: string)`
```typescript
// Recherche plein texte (debounce 300ms côté client)
{ data: FaqArticle[] }
```

### `convertTicketToFaq(ticketId: string)`
```typescript
// Réservé : role = 'admin', statut ticket = 'resolu'
{ data: FaqArticle }
// Erreurs : "Ticket non résolu" | "Réservé aux administrateurs"
```

---

## Module Communication (`src/modules/communication/actions.ts`)

### `getStaffChannels()`
```typescript
// Réservé : is_staff() = true
{ data: StaffChannel[] }
```

### `createStaffChannel(nom, description?)`
```typescript
// Réservé : role = 'admin'
{ data: StaffChannel }
```

### `sendStaffMessage(channelId, contenu)`
```typescript
// Réservé : is_staff() = true
{ data: StaffMessage }
```

### `getStaffDirectory()`
```typescript
{ data: StaffContact[] }  // profs + admins fusionnés, triés par nom
```

---

## Module Émargement (`src/modules/attendance/actions.ts`)

### `createAttendanceSession(classId, durationMin)`
```typescript
// Réservé : role = 'professeur' assigné à la classe
durationMin: 5 | 10
{ data: AttendanceSession }
// Erreurs : "Durée invalide" | "Non assigné à cette classe"
```

### `closeAttendanceSession(sessionId)`
```typescript
{ data: AttendanceReport }  // présents + absents + taux
```

### `getAbsentees(sessionId)`
```typescript
{ data: { student_id: string; nom: string; prenom: string }[] }
```

---

## API Route — Scan QR (`src/app/api/attendance/checkin/route.ts`)

### `POST /api/attendance/checkin`

```typescript
// Corps de la requête
{
  codeUnique: string           // UUID du QR Code
  deviceFingerprint: string    // Hash navigateur anti-fraude
}

// Réponse 200 — succès
{
  success: true
  statut: 'present' | 'en_retard'
  heure_pointage: string
}

// Réponse 400 — erreurs métier
{ error: "Session expirée" }
{ error: "Déjà pointé pour cette session" }
{ error: "Appareil déjà utilisé pour cette session" }
{ error: "Tu n'es pas inscrit dans cette classe" }

// Réponse 404
{ error: "Session introuvable" }

// Réponse 401
{ error: "Non authentifié" }
```

---

## Module Projets (`src/modules/projects/actions.ts`)

### `createGroup(weekId, groupName, capaciteMax)`
```typescript
// Réservé : role = 'eleve' membre de la classe
{ data: ProjectGroup }
// Erreurs : "Nom de groupe déjà pris dans cette semaine"
```

### `joinGroup(groupId)`
```typescript
{ data: true }
// Erreurs : "Groupe complet" | "Tu es déjà dans un groupe cette semaine"
```

### `bookSlot(slotId, groupId)`
```typescript
{ data: SoutenanceSlot }
// Erreurs : "Créneau déjà réservé" | "Non membre du groupe"
```

### `addPostit(boardId, type, content, isAnonymous)`
```typescript
// Requis : board.is_open = true
type: 'POSITIVE' | 'NEGATIVE' | 'IDEA'
{ data: RetroPostit }
// Erreurs : "Le board est fermé" | "Contenu vide"
```

### `toggleRetroBoard(boardId, isOpen)`
```typescript
// Réservé : role = 'professeur' assigné à la classe
{ data: true }
```
