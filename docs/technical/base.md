# Cahier des Charges Fonctionnel : Hub École (Plateforme de Gestion)

Ce document décrit l'architecture fonctionnelle et les spécifications d'un système de gestion scolaire (LMS/ERP/Helpdesk) pensé en architecture modulaire (Séparation des préoccupations).

---

## 1. Module Identité, Authentification et Profils (Le Cœur)

**Objectif :** Gérer l'accès à la plateforme avec une architecture propre, où l'authentification est séparée des données métier.

### Modèles de Données
* **User (Core) :** ID, Email, Mot de passe sécurisé, Role_Principal (Élève, Professeur, Admin, Entreprise). Cette table gère uniquement la connexion.
* **StudentProfile (1:1 avec User) :** Nom, Prénom, Type_Parcours (Temps plein ou Alternant), Roles_Secondaires (Délégué, Ambassadeur), Class_ID.
* **TeacherProfile (1:1 avec User) :** Nom, Prénom, Matières_Enseignées.
* **AdminProfile (1:1 avec User) :** Nom, Prénom, Fonction (Référent, Commercial, etc.).
* **CompanyProfile (1:1 avec User) :** Nom, Prénom, Entreprise, Poste.

### Logique Métier
* Le tableau de bord agit comme un routeur dynamique.
* Après la connexion du `User`, le système lit le profil associé et charge exclusivement les modules autorisés.

### Vues (UI)
* Page de connexion sécurisée.
* Tableau de bord dynamique.
* Annuaire filtrable (Trombinoscope par rôles et classes).

---

## 2. Module Pédagogique (L'Espace Classe)

**Objectif :** Centraliser la vie de la classe (cours, notes, échanges) dans un espace cloisonné et sécurisé.

### Modèles de Données
* **Class :** Nom (ex: "Bachelor 3 IT"), Année.
* **CourseMaterial :** Support de cours (Vidéo, PDF, Lien), lié à un Professeur et une Classe.
* **Grade :** Examen, Note, Coefficient, lié à un Élève et un Professeur.

### Logique Métier
* Isolation stricte : seuls les professeurs assignés et les élèves de la classe y accèdent.
* Calcul automatique des moyennes individuelles par matière.
* Calcul de la moyenne générale de la classe (vue anonymisée pour le classement).

### Vues (UI)
* **Ressources :** Flux chronologique ou dossiers de supports de cours.
* **Notes :** Carnet de notes individuel (vue Élève) et grille de saisie rapide (vue Professeur).
* **Chat de Classe :** Deux canaux par défaut ("Général" et "Entraide élèves").

---

## 3. Module Carrière & Alternance (Parcours Dynamique)

**Objectif :** Offrir une expérience sur-mesure basée sur le `Type_Parcours` défini dans le `StudentProfile`.

### 3A. Parcours "Temps Plein" (Insertion et Recherche)
* **Logique :** Affichage conditionné au statut "Temps Plein". Gestion par le pôle commercial.
* **Job Board :** Liste des offres de stages et alternances disponibles.
* **Événements :** Calendrier et inscription aux forums, ateliers CV.

### 3B. Parcours "Alternant" (Suivi Tripartite)
* **Logique :** Affichage conditionné au statut "Alternant". Connecte l'élève, l'école et l'entreprise.
* **Espace Tripartite :** Chat privé à trois pour échanger sur le suivi.
* **Livret d'Apprentissage :** Espace d'upload de rendus (fiches, diaporamas).
* **Workflow de validation :** Dépôt du rendu -> Notification -> Validation et Notation par le maître d'apprentissage ou référent.

---

## 4. Module Support Administratif et FAQ (Ticketing)

**Objectif :** Remplacer les requêtes informelles par un système de tickets traçable et construire une base de connaissances.

### Modèles de Données
* **Ticket :** Sujet, Description, Catégorie (Pédagogie, Bâtiment, Informatique), Statut (Ouvert, En cours, Résolu), Auteur_ID.
* **FAQ_Article :** Question, Réponse, Catégorie.

### Logique Métier
* Suggestion automatique d'articles de la FAQ lors de la rédaction d'un ticket.
* Droits étendus pour les Délégués (ouverture de tickets "au nom de la classe").
* Conversion en 1 clic d'un ticket résolu vers un nouvel article de la FAQ publique.

### Vues (UI)
* Interface de soumission de ticket pour l'élève.
* Tableau de bord type "Kanban" (À faire, En cours, Terminé) pour l'administration.
* Grande page FAQ publique avec moteur de recherche interne.

---

## 5. Module Communication Interne (Staff Only)

**Objectif :** Créer un espace d'échange sécurisé et privé pour l'équipe encadrante.

### Logique Métier
* Accès strictement restreint aux profils `TeacherProfile` et `AdminProfile`.

### Vues (UI)
* **Chat Staff :** Création de canaux de discussion thématiques (ex: "Conseil de classe", "Infos Direction").
* **Annuaire Staff :** Liste de contacts internes pour une mise en relation rapide.


Pôle Présence & Émargement Numérique
Objectif : Automatiser le suivi des présences via un système de "Flash & Check-in" sécurisé.

Modèles de données :

AttendanceSession : ID, ID_Cours, ID_Professeur, Code_Unique (UUID), Expiration (Timestamp), Statut (Ouvert/Fermé).

AttendanceRecord : ID, ID_Session, ID_Eleve, Statut (Présent, En retard), Heure_Pointage.

Logique Métier :

Génération : Le prof génère un QR Code dynamique lié à sa session de cours. Ce QR Code contient un jeton (token) qui expire après 5 ou 10 minutes.

Validation : Pour éviter la fraude, le système peut vérifier la proximité (si l'app mobile le permet) ou limiter le scan à une seule fois par appareil (device fingerprinting).

Reporting : Une fois la session fermée, le système génère une liste des absents pour l'administration.

Vues :

Vue Prof : Bouton "Lancer l'appel", affichage du QR Code en plein écran avec compteur d'élèves pointés en temps réel.

Vue Élève : Bouton "Scanner ma présence" qui ouvre la caméra.
