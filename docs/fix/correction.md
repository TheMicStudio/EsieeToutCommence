# 🛠 Rapport de Bugs et Améliorations - Plateforme Éducative

Ce document liste les correctifs et les nouvelles fonctionnalités à implémenter. L'infrastructure repose sur **Supabase** (Database, Auth, Storage et Realtime).

---

## 1. Gestion des Supports de Cours (Storage & Realtime)
**Objectif :** Permettre le stockage de fichiers et la mise à jour dynamique de la liste.
- [ ] **Supabase Storage :** Créer un bucket `course_materials`.
- [ ] **Upload :** Ajouter une méthode pour uploader des fichiers (PDF, DOCX) liés à une classe spécifique.
- [ ] **Realtime :** Implémenter `supabase.channel()` sur la table `documents` pour que l'ajout ou la suppression d'un fichier soit visible instantanément par les élèves sans rafraîchir la page.

## 2. Messagerie (Temps Réel)
**Objectif :** Fluidifier l'expérience utilisateur dans les conversations.
- [ ] **Flux de messages :** Configurer l'écoute des changements (INSERT) sur la table `messages`.
- [ ] **Optimistic UI :** S'assurer que le message envoyé par l'utilisateur s'affiche immédiatement côté client avant même la confirmation serveur.

## 3. Émargement & Statistiques
**Objectif :** Simplifier l'UX et corriger les calculs de présence.
- [ ] **Contexte de classe :** Récupérer automatiquement l'ID de la classe via l'URL ou le State global. Supprimer le menu de sélection de classe redondant.
- [ ] **Fix Stats :** Revoir la logique de clôture de l'émarchement.
    - *Logique attendue :* `Total élèves dans la classe` - `Élèves ayant signé` = `Absents`.
    - *Bug actuel :* Le compteur affiche 0 alors que des élèves manquent à l'appel.

## 4. Profil Utilisateur & Annuaire
**Objectif :** Mise à jour des coordonnées et de la base de données.
- [ ] **Email Update :** Corriger la fonction `updateUserEmail`. Vérifier les permissions RLS et la confirmation par email côté Supabase Auth.
- [ ] **Schéma Database :** Ajouter les colonnes `phone_mobile` et `phone_fixed` à la table `profiles`.
- [ ] **Annuaire :** Mapper ces nouvelles colonnes pour qu'elles s'affichent dans la vue liste et la vue détail de l'annuaire.

## 5. Réservation de Créneaux (Logique Métier)
**Objectif :** Éviter les doublons lors de la génération aléatoire.
- [ ] **Validation :** Si un créneau a été attribué via la "génération aléatoire", bloquer la possibilité pour l'élève d'en choisir un deuxième manuellement.
- [ ] **Contrainte de table :** (Optionnel) Ajouter une contrainte d'unicité `(user_id, course_id)` pour empêcher techniquement les doublons en base de données.

## 6. Rétrospective
**Objectif :** Exportation des données.
- [ ] **Export PDF :** Intégrer une librairie (ex: `jspdf` ou `react-pdf`) pour générer un compte-rendu propre des retours de la rétrospective.

## 7. Panel Admin : Carrière & Événements
**Objectif :** Rétablir les droits de gestion pour les administrateurs.
- [ ] **Audit CRUD :** Vérifier pourquoi les administrateurs ne peuvent pas créer/modifier/supprimer les offres d'emploi et les événements.
- [ ] **Permissions :** Vérifier les politiques RLS (Row Level Security) sur les tables `job_offers` et `events`.
- [ ] **Interface :** Ajouter les formulaires de gestion manquants dans le dashboard admin.

## 8. Audit des Sélecteurs (Configuration Dynamique)
**Objectif :** Centraliser la gestion des listes (Matières, etc.).
- [ ] **Matières :** Remplacer les listes "hardcodées" dans les formulaires par un appel à la table `subjects` définie par les admins.
- [ ] **Généralisation :** Appliquer cette logique à tous les menus déroulants de configuration (niveaux, types de contrats, etc.) pour que tout soit pilotable depuis le panel admin.