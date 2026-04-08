# Liste des correctifs et évolutions - Dashboard Scolaire

## 1. Gestion des Événements & Accès
- **Constat :** Les membres du secrétariat ont deux accès redondants pour ajouter des événements (Carrière & Support vs Job Board & Événement).
- **Action :** Centraliser l'ajout d'événements uniquement sur la page "Job Board et Événement".
- **Tâche :** - Ajouter le formulaire de création manquant sur la page "Événement".
    - Supprimer la page "Carrière et Support".
    - Nettoyer la base de données et supprimer les rôles devenus obsolètes suite à cette simplification.

## 2. Barre de recherche (Layout Principal)
- **Tâche :** Rendre fonctionnelle la barre de recherche située dans le layout principal (actuellement fictive/statique).

## 3. Publication des Actualités
- **Optimisation UX :** Actuellement, l'ajout d'une publication ouvre une nouvelle page.
- **Tâche :** Intégrer le formulaire d'ajout directement via un composant Modal au lieu d'une redirection.

## 4. Gestion des Notes (Espace Professeur)
- **Constat :** Les professeurs peuvent saisir les notes, mais ne peuvent plus les modifier une fois enregistrées.
- **Tâche :** Permettre la modification ultérieure d'une ou plusieurs notes par le professeur.

## 5. Gestion des Projets (Espace Professeur)
- **Constat :** Absence de fonction pour créer une "semaine projet" sur la page projet.
- **Tâche :** Ajouter un bouton permettant de créer une semaine projet via l'ouverture d'un modal.

## 6. Émargement & Navigation
- **Optimisation Navbar :** Supprimer l'accès direct "Émargement" de la barre de navigation principale (doublon).
- **UX Page Émargement :** L'accès se fait désormais via la page des classes.
- **Tâche :** Dans la page d'émergement d'une classe spécifique, supprimer le sélecteur de choix de classe (le contexte de la classe doit être hérité de la page précédente).

## 7. Messagerie
- **Correctif UX :** La messagerie actuelle présente des bugs d'ergonomie.
- **Tâche :** - Corriger le défilement (slide) des messages.
    - Améliorer le tri et l'affichage général pour une expérience utilisateur fluide.