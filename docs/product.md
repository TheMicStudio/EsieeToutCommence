# Product — Hub École

**Ref :** US01, US02, US04, US05, US06, US08

---

## 1. Le problème (US01)

**Contexte :** Dans les écoles de l'enseignement supérieur (notamment ESIEE et écoles similaires), la gestion quotidienne est fragmentée entre une dizaine d'outils distincts : email pour les supports de cours, tableurs Excel pour les notes, WhatsApp pour la communication de classe, formulaires papier pour les absences, et des plateformes génériques peu adaptées au rythme école/alternance.

**Causes :**
- Pas d'outil centralisé pensé pour le format école supérieure (alternance + temps plein)
- Les outils existants (Moodle, Teams) sont trop génériques et peu adoptés par les étudiants
- L'administration perd du temps à traiter des demandes informelles (emails, messages)

**Impacts :**
- Perte d'informations entre élèves, profs et administration
- Suivi des alternants lacunaire (pas de tripartite structuré)
- Appels en classe chronophages et peu fiables
- Aucune traçabilité des demandes administratives

**Cible principale :** Élèves et professeurs d'une école supérieure avec des parcours mixtes (temps plein et alternance).

**Segments utilisateurs :**
- Élèves temps plein (recherche stage, suivi pédagogique)
- Élèves alternants (suivi tripartite, livret d'apprentissage)
- Professeurs (cours, notes, appels, projets)
- Administration (tickets, FAQ, communication interne)
- Entreprises partenaires (suivi des alternants)

**Proposition de valeur :** Hub École remplace 5+ outils par une seule plateforme modulaire qui s'adapte au rôle de chaque utilisateur, avec un suivi structuré de l'alternance et un système d'appel numérique anti-fraude.

---

## 2. Personas (US02)

### Persona 1 — Lucas, 21 ans, Élève alternant Bachelor 3 IT

**Objectifs :** Accéder à ses cours depuis son lieu d'alternance, soumettre ses rendus à son maître d'apprentissage, savoir où en est son suivi.

**Frustrations actuelles :** Il reçoit ses retours par email en retard, son maître d'apprentissage ne sait pas quoi valider, les absences sont notées à la main.

**Scénario prioritaire :** Lucas scanne le QR Code de son prof pour pointer sa présence en 5 secondes, puis consulte le feedback de son dernier rendu directement dans l'espace tripartite.

**Scénario secondaire :** Il dépose son livret de fin de semestre et reçoit une notification quand il est validé.

---

### Persona 2 — Marie, 34 ans, Professeure de développement web

**Objectifs :** Gérer les notes de 3 classes, partager ses supports, lancer les appels rapidement sans papier.

**Frustrations actuelles :** Elle passe 10 minutes à faire l'appel, les notes sont dans un tableur local qu'elle oublie de mettre à jour, les étudiants lui envoient des messages sur WhatsApp.

**Scénario prioritaire :** Marie génère un QR Code en un clic, voit les présences s'afficher en temps réel, ferme la session et obtient la liste des absents automatiquement.

**Scénario secondaire :** Elle saisit les notes dans la grille en ligne, les moyennes se calculent seules.

---

### Persona 3 — Karim, 28 ans, Référent pédagogique (Admin)

**Objectifs :** Traiter les demandes d'élèves efficacement, éviter les doublons et les emails perdus.

**Frustrations actuelles :** Il reçoit 20 emails par semaine avec les mêmes questions, aucune traçabilité des demandes traitées.

**Scénario prioritaire :** Karim reçoit un ticket d'un délégué de classe, y répond directement dans le fil, change le statut en "Résolu" et convertit la réponse en article FAQ en 1 clic.

---

## 3. MVP — Périmètre et critères de coupe (US04)

### Ce qui est dans le MVP

| Fonctionnalité | Justification |
|---------------|---------------|
| Authentification + routage par rôle | Bloque tout le reste |
| Consultation des supports de cours | Besoin quotidien n°1 des élèves |
| Saisie et consultation des notes | Besoin quotidien n°1 des profs |
| Émargement QR Code | Différenciateur fort, valeur démo immédiate |
| Espace tripartite alternant | Cœur du sujet école / alternance |
| Système de tickets + FAQ | Remplace les emails de l'admin |
| Mur de rétro (semaines projets) | Valeur pédagogique, démo visuelle |

### Ce qui est hors périmètre MVP

| Hors périmètre | Raison |
|---------------|--------|
| Application mobile native | Trop coûteux, le scan QR fonctionne via navigateur mobile |
| Notifications push | Complexité infrastructure, email suffisant pour la démo |
| Intégration calendrier externe (Google Cal) | Hors délai |
| Statistiques avancées / dashboards analytics | Valeur post-MVP |
| Système de paiement / scolarité | Hors scope scolaire |

### Critères de coupe (si retard)

1. Couper le chat de classe (garder les ressources + notes)
2. Couper la communication interne staff (garder le support tickets)
3. Réduire le livret d'apprentissage à l'upload simple (sans workflow de validation)

---

## 4. Thème et justification des choix produit (US05)

**Thème retenu :** Gestion scolaire école supérieure avec focus alternance

**Thèmes écartés :**
- E-commerce éducatif → trop générique, pas de valeur différenciante
- Plateforme de cours MOOC → concurrence directe avec Coursera/Udemy, pas réaliste en projet étudiant

**Décisions produit majeures :**

| Décision | Justification | Impact |
|----------|---------------|--------|
| Architecture modulaire (1 dev = 1 module) | Éviter les conflits Git en vibe coding à 4 | Isolation stricte, pas de feature transversale non planifiée |
| Supabase Auth plutôt que NextAuth | RLS natif = sécurité sans code supplémentaire | Moins de surface d'attaque, policies déclaratives |
| Server Actions plutôt qu'API REST | Pas d'exposition d'endpoints publics, typage end-to-end | Sécurité renforcée, DX meilleure |
| Scan QR via navigateur (pas app native) | Délai réaliste, fonctionne sur tous les mobiles | Contrainte : pas de vérification géolocalisation |

---

## 5. Elevator Pitch (US06)

> "Hub École, c'est la plateforme tout-en-un pour les écoles supérieures : les élèves pointent leur présence en scannant un QR Code, les profs saisissent les notes en ligne, les alternants suivent leur parcours avec leur entreprise, et l'administration traite les demandes via un système de tickets — le tout dans une seule application, sans email perdu, sans papier."

*(Durée à l'oral : ~30 secondes)*

---

## 6. SWOT & Benchmark (US08)

### Benchmark

| Outil | Forces | Faiblesses par rapport à Hub École |
|-------|--------|-------------------------------------|
| Moodle | Très complet, open source | Interface vieillissante, pas de QR Code, pas d'alternance |
| Google Classroom | Simple, intégration Google | Pas de gestion alternance, pas de ticketing, pas d'appel |
| Ypareo | Spécialisé alternance | Outil CRM/ERP lourd, pas pensé pour les élèves, coûteux |
| Teams/Sharepoint | Collaboration fichiers | Pas d'espace pédagogique structuré, pas de QR Code |

### SWOT

| | Forces | Faiblesses |
|-|--------|------------|
| **Internes** | Stack moderne (Next.js/Supabase), modulaire, QR Code différenciant, gestion alternance native | Projet étudiant (dette technique possible), pas de mobile natif, équipe de 4 personnes |
| | **Opportunités** | **Menaces** |
| **Externes** | Marché des LMS spécialisés sous-développé pour l'alternance, demande forte d'outils modernes dans l'enseignement supérieur | Concurrence Moodle (gratuit), délais serrés, dépendance Supabase (vendor lock-in) |

**Décisions issues de l'analyse :**
1. Se concentrer sur l'émargement QR et le suivi alternance (pas de doublon avec Moodle générique)
2. Garder Supabase malgré le vendor lock-in (gain de temps > risque pour un projet étudiant)
