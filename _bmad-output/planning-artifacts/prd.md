---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: ['product-brief-cinook-2026-03-06.md']
workflowType: 'prd'
classification:
  projectType: mobile_app+web_app
  domain: general
  complexity: low-medium
  projectContext: greenfield
---

# Product Requirements Document - Cinook

**Author:** Mathilde
**Date:** 2026-03-06

---

## Executive Summary

Cinook est une application multiplateforme (mobile + desktop web) de gestion de médiathèque personnelle pour un cercle privé de proches. Elle permet de cataloguer, noter et partager des films, séries et livres physiques avec un niveau de friction proche de zéro via scan de codes-barres et auto-remplissage API (TMDB, Google Books). Construite sur Firebase, elle cible en premier lieu Mathilde (administratrice) et Anna, avec extension possible à la famille et amis.

**Problème central :** Aucune solution existante ne combine les trois médias, la confidentialité totale (zéro profil public), et la suppression de la friction de saisie. Letterboxd et Goodreads sont publics et mono-média. Les solutions génériques manquent de scan physique et de dimension sociale privée.

**Trois différenciateurs simultanés :**
1. **Tout-en-un** — Films, Séries, Livres dans un catalogue unifié avec statuts granulaires (Possédé · Vu · Prêté · À voir · Favori) et traçabilité des prêts
2. **Zéro saisie manuelle** — Scan de codes-barres physiques → fiche auto-remplie en moins de 3 secondes
3. **Privé par design** — Cercle fermé par invitation, aucune donnée publique, export disponible (souveraineté des données)

**Différenciateur secondaire :** Notation expressive unique — note 0-10 + tier-list 6 niveaux (Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant) + commentaire libre.

**Classification :** App mobile (primaire) + web desktop (secondaire) · Firebase · Domaine grand public · Complexité faible-moyenne · Greenfield · Développement solo assisté par IA.

---

## Success Criteria

### User Success

| Critère | Mesure concrète |
|---------|----------------|
| Fiabilité mémoire | Zéro doublon involontaire — l'utilisatrice ne rachète plus un livre déjà lu |
| Traçabilité des prêts | Tout item prêté retrouvable avec nom + date en moins de 5 secondes |
| Adoption scan | >= 90% des nouveaux items ajoutés via scan (pas saisie manuelle) |
| Engagement Anna | Anna utilise l'app >= 1x/semaine de façon autonome |
| Recommandations | >= 4 recommandations échangées par mois dans le cercle |

### Business Success

*(Projet personnel — objectifs de valeur personnelle)*

| Objectif | Cible | Délai |
|----------|-------|-------|
| Collection migrée | ~1 000 objets culturels catalogués | J+90 |
| Cercle actif | Tous les membres invités actifs | J+90 |
| Rétention | Usage quotidien établi comme réflexe | J+30 |
| Souveraineté | Export fonctionnel disponible | Lancement |

### Technical Success

| Exigence | Seuil |
|---------|-------|
| Taux de scan réussi | >= 90% (code-barres → fiche auto-remplie) |
| Chargement fiche média | < 3 secondes (connexion 4G) |
| Disponibilité | >= 99.5% |
| Perte de données | 0 incident en 12 mois |
| Compatibilité | iOS 15+, Android 9+, Chrome/Firefox/Safari desktop |

### Measurable Outcomes

- **J+30 :** Usage quotidien établi, >= 50 items scannés
- **J+90 :** ~1 000 items catalogués, Anna active hebdomadairement
- **J+180 :** >= 24 recommandations échangées, Cinéclub utilisé

---

## Product Scope & Development Strategy

### MVP — Phase 1

**Approche :** Problem-solving MVP — résoudre perte de données, saisie manuelle et mémoire défaillante pour 2 utilisatrices dès le premier jour.

**Contexte :** Développement solo par Mathilde, assistée par IA. Firebase supprime le besoin de backend custom. Distribution interne (sans stores) en v1.

**Capacités incluses :**
- Auth Firebase (email/password) + cercle privé unique par invitation
- Catalogue unifié Films · Séries · Livres
- Scan de codes-barres → auto-remplissage TMDB (films/séries) + Google Books (livres)
- Statuts : Possédé · Vu · Prêté (nom + date) · À voir · Favori
- Notation : note 0-10 + tier-list 6 niveaux + commentaire
- Export CSV/JSON
- Section "Films à l'affiche" (TMDB now_playing) avec ajout direct à la collection
- Recommandations entre membres du cercle
- Cinéclub : item mis en avant par un membre, visible sur l'accueil de tous
- Interface mobile (iOS + Android) + desktop web
- Mode hors-ligne (lecture + écriture avec sync à la reconnexion)

**Ordre de développement recommandé :**
1. Auth + collection basique
2. Scan + auto-remplissage
3. Notations + statuts
4. Cercle privé + recommandations
5. Cinéclub + Films à l'affiche
6. Mode hors-ligne + Export

### Phase 2 — Groupes & Social enrichi

- Gestion multi-groupes (création, administration)
- Notifications push (recos, Cinéclub, prêts en retard)
- Listes thématiques partageables

### Phase 3 — Intelligence & Découverte

- Suggestions personnalisées basées sur notes + collection
- Statistiques annuelles (bilan lecture/visionnage, genres favoris)
- Import depuis Letterboxd / Goodreads / CSV
- Publication App Store + Google Play

### Risk Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| Scan peu fiable sur vieux supports | Moyen | Élevé | Fallback obligatoire : recherche par titre |
| API TMDB/Google Books indisponible | Faible | Moyen | Cache local + saisie manuelle de secours |
| Complexité Firebase Offline Persistence | Moyen | Moyen | Tester early, limiter les conflits en v1 |
| Surcharge de scope en solo | Élevé | Élevé | Livrer petit et fonctionnel plutôt que grand et incomplet |

---

## User Journeys

### Journey 1 — Mathilde : Le Premier Soir (Succès principal)

*Mathilde vient de finir un film. Elle prend son téléphone.*

Elle ouvre Cinook, appuie sur "Ajouter", pointe la caméra vers le DVD. En 3 secondes, la fiche apparaît : titre, affiche, synopsis, durée, réalisateur — tout pré-rempli. Elle glisse le statut sur "Vu", attribue 8/10, classe "Or" en tier-list, ajoute *"Fin surprenante, à revoir."* Trente secondes en tout.

**Capacités :** scan barcode · appel TMDB · création fiche · statut · notation · commentaire

---

### Journey 2 — Mathilde : Le Prêt Retrouvé (Traçabilité)

*Sa cousine demande à emprunter "Le Seigneur des Anneaux". L'a-t-elle déjà prêté ?*

Elle cherche le titre dans Cinook. La fiche affiche : **Prêté — à Pierre — depuis le 12 janvier**. Elle contacte Pierre, puis met à jour : "Rendu" → "Prêté à sa cousine — aujourd'hui".

**Capacités :** recherche · affichage statut prêt avec métadonnées · mise à jour statut

---

### Journey 3 — Anna : La Recommandation Spontanée (Social)

*Anna vient de terminer un roman bouleversant. Elle veut que Mathilde le lise.*

Elle trouve le livre dans sa collection, appuie sur "Recommander à Mathilde". Mathilde reçoit la reco dans son fil, voit la note d'Anna (9/10, "Diamant") et l'ajoute à "À voir" en un tap.

**Capacités :** recommandation depuis fiche · fil de recos reçues · ajout rapide à "À voir"

---

### Journey 4 — Les parents : L'Onboarding Lambda (Premier contact)

*La mère de Mathilde reçoit un lien d'invitation. Elle ne comprend pas trop.*

Elle crée un compte via le lien. L'interface présente deux actions : "Scanner" ou "Voir la collection de Mathilde". Elle scanne un DVD. La fiche apparaît. Elle tape "Vu". Fin.

**Capacités :** onboarding par invitation · interface épurée · scan sans tutoriel · vue collection d'un membre

---

### Journey 5 — Mathilde Admin : Gestion du Cercle (Administration)

*Mathilde invite son frère et sauvegarde sa collection.*

Elle génère un lien d'invitation dans les paramètres, l'envoie par WhatsApp. Son frère apparaît dans la liste des membres. Elle exporte sa collection en CSV.

**Capacités :** génération lien d'invitation · liste membres · export CSV/JSON

---

### Journey 6 — Cinéclub du Vendredi (Social — Cinéclub)

*Mathilde a adoré un film en salle. Elle le met en avant pour son cercle.*

Dans "Films à l'affiche", elle trouve le film et appuie sur "Mettre en Cinéclub". Les membres voient une bannière "Film de la semaine" sur leur accueil. Anna l'ajoute à "À voir".

**Capacités :** section Films à l'affiche (TMDB now_playing) · action Cinéclub · bannière accueil cercle

---

### Journey Requirements Summary

| Capacité | Journeys |
|---------|---------|
| Scan + auto-remplissage TMDB/Google Books | 1, 4 |
| Statuts + traçabilité prêts | 1, 2 |
| Notation + tier-list + commentaire | 1, 3 |
| Recherche et filtrage collection | 2 |
| Recommandations entre membres | 3 |
| Onboarding par invitation | 4, 5 |
| Administration cercle + export | 5 |
| Films à l'affiche + Cinéclub | 6 |
| Vue collection d'un autre membre | 4 |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Combinaison inédite** : Films + Séries + Livres + social privé + scan physique — aucune app n'offre cette réunion
- **Privé par design** : modèle inverse des plateformes sociales qui monétisent la visibilité publique
- **Notation expressive** : tier-list 6 niveaux + note chiffrée + commentaire — plus riche que les standards (étoiles, pouces)

### Validation Approach

- Adoption quotidienne sans retour aux solutions précédentes = validation de la combinaison
- Taux de scan > 90% en conditions réelles = validation du différenciateur principal

### Risk Mitigation

- Fiche TMDB/Google Books incomplète → formulaire de saisie manuelle de secours
- Code-barres ancien non reconnu → recherche par titre comme fallback

---

## Platform & Technical Requirements

### Architecture

- **Backend :** Firebase (Firestore, Auth, Storage) — pas de backend custom en v1
- **APIs tierces :** TMDB (films/séries) + Google Books (livres) — clés API non exposées côté client
- **Scan :** accès caméra natif mobile + bibliothèque barcode (ML Kit, ZXing ou équivalent framework)
- **Offline :** Firebase Offline Persistence — cache local + sync automatique à la reconnexion

### Platform Requirements

| Plateforme | Cible | Distribution |
|-----------|-------|-------------|
| iOS | iPhone (iOS 15+) | Distribution interne (TestFlight ou lien direct) |
| Android | Android 9+ | Distribution interne (APK direct) |
| Web desktop | Chrome, Firefox, Safari (dernières versions) | URL privée, auth requise |

### Device Permissions

| Permission | Usage |
|-----------|-------|
| Caméra | Scan de codes-barres (obligatoire mobile) |
| Stockage local | Cache offline Firestore (automatique SDK) |

### Offline Mode

- **Lecture :** collection complète accessible sans connexion via cache Firestore local
- **Écriture :** ajout/modification hors-ligne → sync automatique à la reconnexion
- **Scan :** nécessite connexion pour TMDB/Google Books — échec → saisie manuelle ou retry
- **Conflits :** last-write-wins (Firebase par défaut)

### Implementation Notes

- SPA web avec routing côté client (Firebase Hosting)
- Règles Firestore strictes : lecture limitée aux données du cercle de l'utilisateur authentifié
- Pas de SEO (app privée derrière auth)
- Pas de notifications push en v1 — FCM à prévoir en v2
- Store compliance non applicable en v1 — à prévoir en v2

---

## Functional Requirements

### Gestion des Comptes et Authentification

- FR1 : Un visiteur peut créer un compte avec email et mot de passe
- FR2 : Un utilisateur peut se connecter et se déconnecter de son compte
- FR3 : Un utilisateur peut rejoindre le cercle privé via un lien d'invitation
- FR4 : L'administratrice peut générer un lien d'invitation pour le cercle
- FR5 : L'administratrice peut consulter la liste des membres du cercle
- FR6 : L'administratrice peut exporter l'intégralité de sa collection (CSV ou JSON)

### Catalogue et Gestion de Collection

- FR7 : Un utilisateur peut ajouter un item (film, série ou livre) à sa collection via scan de code-barres
- FR8 : Un utilisateur peut ajouter un item via recherche par titre (fallback scan)
- FR9 : Lors de l'ajout par scan ou recherche, le système auto-remplit la fiche depuis TMDB (films/séries) ou Google Books (livres)
- FR10 : Un utilisateur peut créer manuellement une fiche pour un item non trouvé via API
- FR11 : Un utilisateur peut modifier les informations d'un item de sa collection
- FR12 : Un utilisateur peut supprimer un item de sa collection
- FR13 : Un utilisateur peut rechercher et filtrer sa collection par titre, type de média ou statut
- FR14 : Un utilisateur peut consulter la collection d'un autre membre du cercle

### Statuts et Suivi des Prêts

- FR15 : Un utilisateur peut attribuer un statut à chaque item : Possédé · Vu · Prêté · À voir · Favori
- FR16 : Un utilisateur peut enregistrer un prêt en associant un nom d'emprunteur et une date de prêt à un item
- FR17 : Un utilisateur peut mettre à jour le statut d'un item prêté (ex : retourné)
- FR18 : Un utilisateur peut consulter tous ses items actuellement prêtés avec emprunteur et date

### Notation et Évaluation

- FR19 : Un utilisateur peut attribuer une note de 0 à 10 à un item
- FR20 : Un utilisateur peut classer un item dans un niveau de tier-list : Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant
- FR21 : Un utilisateur peut rédiger un commentaire libre sur un item
- FR22 : Un utilisateur peut modifier ou supprimer sa note, son tier et son commentaire
- FR23 : Un utilisateur peut voir les notes et commentaires des autres membres du cercle sur un item

### Découverte — Films à l'Affiche

- FR24 : Un utilisateur peut consulter la liste des films actuellement en salle (TMDB now_playing)
- FR25 : Un utilisateur peut ajouter un film à l'affiche à sa collection ou à sa liste "À voir"

### Social — Cercle Privé et Recommandations

- FR26 : Un utilisateur peut recommander un item à un ou plusieurs membres du cercle
- FR27 : Un utilisateur peut consulter les recommandations reçues des membres du cercle
- FR28 : Un utilisateur peut ajouter un item recommandé à sa liste "À voir" en un geste
- FR29 : Un utilisateur peut mettre en avant un item en tant que "Cinéclub" pour le cercle
- FR30 : Tous les membres du cercle voient l'item Cinéclub mis en avant sur leur écran d'accueil

### Synchronisation et Hors-Ligne

- FR31 : Un utilisateur peut consulter sa collection sans connexion internet
- FR32 : Un utilisateur peut ajouter ou modifier un item sans connexion — synchronisation à la reconnexion
- FR33 : En cas d'échec API lors d'un scan, le système propose la saisie manuelle de secours

---

## Non-Functional Requirements

### Performance

- NFR1 : Scan d'un code-barres + affichage fiche auto-remplie en moins de 3 secondes (connexion 4G standard)
- NFR2 : Chargement de la collection complète (jusqu'à 1 000 items) en moins de 2 secondes
- NFR3 : Navigation entre écrans principaux en moins de 500ms
- NFR4 : App utilisable hors-ligne sans dégradation d'interface (cache Firestore local)

### Sécurité

- NFR5 : Chaque utilisateur accède uniquement à ses propres données et aux données partagées de son cercle (règles Firestore strictes)
- NFR6 : Toute lecture de données nécessite une authentification valide — aucune donnée accessible publiquement
- NFR7 : Communications app ↔ Firebase chiffrées via HTTPS/TLS
- NFR8 : Clés API tierces (TMDB, Google Books) non exposées côté client — gestion via variables d'environnement ou Firebase Functions
- NFR9 : Conformité RGPD de base : données exportables (FR6) et supprimables sur demande

### Accessibilité

- NFR10 : Actions principales accessibles en 2 taps maximum — utilisable sans tutoriel par des utilisateurs non-techniques
- NFR11 : Tailles de police et contrastes conformes WCAG AA

### Intégration

- NFR12 : TMDB couvre >= 90% des films et séries scannés
- NFR13 : Google Books couvre >= 85% des livres scannés (ISBN)
- NFR14 : Indisponibilité d'une API tierce → message utilisateur explicite + saisie manuelle proposée, sans crash ni perte de données
- NFR15 : Synchronisation hors-ligne Firebase sans perte de données en cas de conflit (last-write-wins documenté)

### Fiabilité

- NFR16 : Disponibilité >= 99.5% (hors maintenances Firebase planifiées)
- NFR17 : Zéro perte de données utilisateur — sauvegarde Firestore continue
- NFR18 : Toute erreur applicative affiche un message explicite — jamais d'écran blanc ou de crash silencieux
