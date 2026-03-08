---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-06'
inputDocuments: ['prd.md', 'architecture.md']
---

# Cinook - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Cinook, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1 : Un visiteur peut créer un compte avec email et mot de passe
FR2 : Un utilisateur peut se connecter et se déconnecter de son compte
FR3 : Un utilisateur peut rejoindre le cercle privé via un lien d'invitation
FR4 : L'administratrice peut générer un lien d'invitation pour le cercle
FR5 : L'administratrice peut consulter la liste des membres du cercle
FR6 : L'administratrice peut exporter l'intégralité de sa collection (CSV ou JSON)
FR7 : Un utilisateur peut ajouter un item (film, série ou livre) à sa collection via scan de code-barres
FR8 : Un utilisateur peut ajouter un item via recherche par titre (fallback scan)
FR9 : Lors de l'ajout par scan ou recherche, le système auto-remplit la fiche depuis TMDB (films/séries) ou Google Books (livres)
FR10 : Un utilisateur peut créer manuellement une fiche pour un item non trouvé via API
FR11 : Un utilisateur peut modifier les informations d'un item de sa collection
FR12 : Un utilisateur peut supprimer un item de sa collection
FR13 : Un utilisateur peut rechercher et filtrer sa collection par titre, type de média ou statut
FR14 : Un utilisateur peut consulter la collection d'un autre membre du cercle
FR15 : Un utilisateur peut attribuer un statut à chaque item : Possédé · Vu · Prêté · À voir · Favori
FR16 : Un utilisateur peut enregistrer un prêt en associant un nom d'emprunteur et une date de prêt à un item
FR17 : Un utilisateur peut mettre à jour le statut d'un item prêté (ex : retourné)
FR18 : Un utilisateur peut consulter tous ses items actuellement prêtés avec emprunteur et date
FR19 : Un utilisateur peut attribuer une note de 0 à 10 à un item
FR20 : Un utilisateur peut classer un item dans un niveau de tier-list : Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant
FR21 : Un utilisateur peut rédiger un commentaire libre sur un item
FR22 : Un utilisateur peut modifier ou supprimer sa note, son tier et son commentaire
FR23 : Un utilisateur peut voir les notes et commentaires des autres membres du cercle sur un item
FR24 : Un utilisateur peut consulter la liste des films actuellement en salle (TMDB now_playing)
FR25 : Un utilisateur peut ajouter un film à l'affiche à sa collection ou à sa liste "À voir"
FR26 : Un utilisateur peut recommander un item à un ou plusieurs membres du cercle
FR27 : Un utilisateur peut consulter les recommandations reçues des membres du cercle
FR28 : Un utilisateur peut ajouter un item recommandé à sa liste "À voir" en un geste
FR29 : Un utilisateur peut mettre en avant un item en tant que "Cinéclub" pour le cercle
FR30 : Tous les membres du cercle voient l'item Cinéclub mis en avant sur leur écran d'accueil
FR31 : Un utilisateur peut consulter sa collection sans connexion internet
FR32 : Un utilisateur peut ajouter ou modifier un item sans connexion — synchronisation à la reconnexion
FR33 : En cas d'échec API lors d'un scan, le système propose la saisie manuelle de secours

### NonFunctional Requirements

NFR1 : Scan d'un code-barres + affichage fiche auto-remplie en moins de 3 secondes (connexion 4G standard)
NFR2 : Chargement de la collection complète (jusqu'à 1 000 items) en moins de 2 secondes
NFR3 : Navigation entre écrans principaux en moins de 500ms
NFR4 : App utilisable hors-ligne sans dégradation d'interface (cache Firestore local)
NFR5 : Chaque utilisateur accède uniquement à ses propres données et aux données partagées de son cercle (règles Firestore strictes)
NFR6 : Toute lecture de données nécessite une authentification valide — aucune donnée accessible publiquement
NFR7 : Communications app ↔ Firebase chiffrées via HTTPS/TLS
NFR8 : Clés API tierces (TMDB, Google Books) non exposées côté client — gestion via Firebase Functions
NFR9 : Conformité RGPD de base : données exportables (FR6) et supprimables sur demande
NFR10 : Actions principales accessibles en 2 taps maximum — utilisable sans tutoriel par des utilisateurs non-techniques
NFR11 : Tailles de police et contrastes conformes WCAG AA
NFR12 : TMDB couvre >= 90% des films et séries scannés
NFR13 : Google Books couvre >= 85% des livres scannés (ISBN)
NFR14 : Indisponibilité d'une API tierce → message utilisateur explicite + saisie manuelle proposée, sans crash ni perte de données
NFR15 : Synchronisation hors-ligne Firebase sans perte de données en cas de conflit (last-write-wins documenté)
NFR16 : Disponibilité >= 99.5% (hors maintenances Firebase planifiées)
NFR17 : Zéro perte de données utilisateur — sauvegarde Firestore continue
NFR18 : Toute erreur applicative affiche un message explicite — jamais d'écran blanc ou de crash silencieux

### Additional Requirements

- **Initialisation projet** : `npx create-expo-stack@latest cinook` (TypeScript · Expo Router · NativeWind · Firebase) → Epic 1, Story 1
- **Configuration Firebase** : Créer projet Firebase (Firestore, Auth, Functions, Hosting), configurer `.env` avec les clés Firebase (jamais TMDB/Google Books)
- **Firestore Security Rules** : Implémenter les règles d'isolation par cercle avant toute feature sociale
- **EAS Build** : Configurer `eas.json` avec profiles dev/preview/production pour iOS + Android
- **Firebase Functions** : Proxy TMDB (`searchMedia`) et Google Books (`getMediaByBarcode`) — clés dans `functions/.env` uniquement (NFR8)
- **Development Build** : `expo-camera` (barcode) requiert un development build — Expo Go insuffisant pour tester le scan
- **Firebase Offline Persistence** : Activer dans `lib/firebase.ts` au démarrage (NFR4)
- **Zustand stores** : Initialiser `authStore`, `filtersStore`, `uiStore` avant les features (cross-cutting)
- **Architecture patterns** : Respecter les conventions camelCase Firestore, `FunctionResponse<T>`, hooks listeners avec cleanup

### FR Coverage Map

FR1 : Epic 1 — Création de compte
FR2 : Epic 1 — Connexion / déconnexion
FR3 : Epic 4 — Rejoindre le cercle via lien d'invitation
FR4 : Epic 4 — Générer un lien d'invitation (admin)
FR5 : Epic 4 — Consulter la liste des membres
FR6 : Epic 6 — Exporter la collection (CSV/JSON)
FR7 : Epic 2 — Ajouter un item via scan code-barres
FR8 : Epic 2 — Ajouter un item via recherche par titre
FR9 : Epic 2 — Auto-remplissage fiche via TMDB / Google Books
FR10 : Epic 2 — Création manuelle d'une fiche
FR11 : Epic 2 — Modifier un item
FR12 : Epic 2 — Supprimer un item
FR13 : Epic 2 — Rechercher et filtrer la collection
FR14 : Epic 4 — Consulter la collection d'un autre membre
FR15 : Epic 3 — Attribuer un statut (Possédé · Vu · Prêté · À voir · Favori)
FR16 : Epic 3 — Enregistrer un prêt (emprunteur + date)
FR17 : Epic 3 — Mettre à jour le statut d'un item prêté
FR18 : Epic 3 — Consulter tous les items prêtés
FR19 : Epic 3 — Attribuer une note 0-10
FR20 : Epic 3 — Classer dans la tier-list (6 niveaux)
FR21 : Epic 3 — Rédiger un commentaire libre
FR22 : Epic 3 — Modifier ou supprimer note/tier/commentaire
FR23 : Epic 4 — Voir les notes des autres membres sur un item
FR24 : Epic 5 — Consulter les films à l'affiche (TMDB now_playing)
FR25 : Epic 5 — Ajouter un film à l'affiche à la collection ou "À voir"
FR26 : Epic 4 — Recommander un item à un membre
FR27 : Epic 4 — Consulter les recommandations reçues
FR28 : Epic 4 — Ajouter un item recommandé à "À voir" en un geste
FR29 : Epic 4 — Mettre en avant un item en tant que Cinéclub
FR30 : Epic 4 — Voir le Cinéclub sur l'écran d'accueil
FR31 : Epic 6 — Consulter la collection hors-ligne
FR32 : Epic 6 — Ajouter/modifier un item hors-ligne + sync
FR33 : Epic 2 — Fallback saisie manuelle si scan échoue

## Epic List

### Epic 1 : Fondations & Authentification
Les utilisatrices peuvent créer un compte, se connecter, et accéder à l'app sécurisée. Le projet est initialisé et prêt pour le développement.
**FRs couverts :** FR1, FR2

### Epic 2 : Ma Collection — Ajouter & Gérer
Les utilisatrices peuvent ajouter des films, séries et livres à leur collection via scan de code-barres ou recherche par titre, avec auto-remplissage des fiches, et gérer (modifier, supprimer, filtrer) leur catalogue.
**FRs couverts :** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR33

### Epic 3 : Statuts, Notation & Suivi des Prêts
Les utilisatrices peuvent attribuer des statuts à leurs items, noter avec la tier-list et un commentaire, et tracker tous leurs prêts (qui, depuis quand).
**FRs couverts :** FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22

### Epic 4 : Cercle Privé & Recommandations
Les utilisatrices peuvent inviter des proches, voir la collection des membres, échanger des recommandations et mettre en avant un item en Cinéclub.
**FRs couverts :** FR3, FR4, FR5, FR14, FR23, FR26, FR27, FR28, FR29, FR30

### Epic 5 : Découverte — Films à l'affiche
Les utilisatrices peuvent parcourir les films actuellement en salle et les ajouter directement à leur collection ou liste "À voir".
**FRs couverts :** FR24, FR25

### Epic 6 : Mode Hors-ligne, Export & Paramètres
Les utilisatrices peuvent utiliser l'app sans connexion internet, exporter leur collection en CSV/JSON, et gérer leur compte (déconnexion, suppression RGPD).
**FRs couverts :** FR6, FR31, FR32

---

## Epic 1 : Fondations & Authentification

Les utilisatrices peuvent créer un compte, se connecter, et accéder à l'app sécurisée. Le projet est initialisé et prêt pour le développement.

### Story 1.1 : Initialisation du projet et configuration technique

En tant que développeuse,
Je veux initialiser le projet Cinook avec le stack technique choisi et configurer Firebase,
Afin que l'environnement de développement soit prêt et que toutes les features puissent être développées.

**Acceptance Criteria :**

**Given** un environnement de développement vide
**When** la commande `npx create-expo-stack@latest cinook` est exécutée avec TypeScript · Expo Router · NativeWind · Firebase
**Then** le projet démarre sans erreur sur iOS, Android et Web
**And** la structure de fichiers correspond à l'architecture documentée (`app/`, `components/`, `hooks/`, `stores/`, `lib/`, `types/`, `constants/`)

**Given** le projet initialisé
**When** la configuration Firebase est appliquée (`.env` avec clés Firebase, `lib/firebase.ts`, Firestore Offline Persistence activé)
**Then** la connexion à Firebase Firestore et Firebase Auth est opérationnelle
**And** les clés TMDB et Google Books ne sont jamais présentes dans le code client

**Given** la configuration Firebase en place
**When** les Firestore Security Rules sont déployées
**Then** aucune donnée n'est lisible sans authentification valide (NFR6)
**And** les règles d'isolation par cercle sont en place

**Given** le projet configuré
**When** `eas.json` est créé avec les profils dev/preview/production
**Then** un EAS Development Build peut être généré pour iOS et Android

### Story 1.2 : Création de compte utilisateur

En tant que visiteur,
Je veux créer un compte avec mon email et un mot de passe,
Afin d'accéder à Cinook et commencer à gérer ma collection.

**Acceptance Criteria :**

**Given** l'écran de création de compte (`app/(auth)/register.tsx`)
**When** je saisis un email valide et un mot de passe (minimum 6 caractères) et je valide
**Then** un compte Firebase Auth est créé
**And** un document `/users/{uid}` est créé dans Firestore avec `displayName` et `email`
**And** je suis redirigée automatiquement vers l'écran principal `(app)/`

**Given** un email déjà utilisé
**When** je tente de créer un compte avec cet email
**Then** un message d'erreur explicite s'affiche ("Ce compte existe déjà")
**And** aucun doublon n'est créé dans Firebase Auth

**Given** un formulaire incomplet ou invalide
**When** je tente de valider
**Then** les erreurs de validation s'affichent clairement sur les champs concernés
**And** aucune requête Firebase n'est envoyée

### Story 1.3 : Connexion, déconnexion et navigation protégée

En tant qu'utilisatrice,
Je veux me connecter et me déconnecter de mon compte,
Afin que mes données soient accessibles uniquement à moi et que l'app soit sécurisée.

**Acceptance Criteria :**

**Given** l'écran de connexion (`app/(auth)/login.tsx`)
**When** je saisis mon email et mot de passe corrects et je valide
**Then** je suis connectée via Firebase Auth
**And** je suis redirigée vers l'écran principal `(app)/index`
**And** `authStore` contient mon `uid`, `email`, et `circleId` (null si pas encore dans un cercle)

**Given** des identifiants incorrects
**When** je tente de me connecter
**Then** un message d'erreur explicite s'affiche ("Email ou mot de passe incorrect")
**And** je reste sur l'écran de connexion

**Given** une utilisatrice connectée
**When** elle sélectionne "Se déconnecter" dans les paramètres
**Then** Firebase Auth déconnecte la session
**And** elle est redirigée vers `app/(auth)/login.tsx`
**And** `authStore` est réinitialisé

**Given** une utilisatrice non connectée
**When** elle tente d'accéder à n'importe quelle route `(app)/`
**Then** elle est automatiquement redirigée vers `app/(auth)/login.tsx` (auth guard dans `app/_layout.tsx`)

---

## Epic 2 : Ma Collection — Ajouter & Gérer

Les utilisatrices peuvent ajouter des films, séries et livres à leur collection via scan de code-barres ou recherche par titre, avec auto-remplissage des fiches, et gérer leur catalogue complet.

### Story 2.1 : Configuration des clients API directs (TMDB & Google Books)

En tant que développeuse,
Je veux configurer les clients TMDB et Google Books directement dans `lib/`,
Afin que le scan et la recherche fonctionnent sans Firebase Functions et sans coût d'infrastructure.

**Acceptance Criteria :**

**Given** `lib/tmdb.ts` et `lib/googleBooks.ts` configurés avec les clés `.env`
**When** `searchMovies`, `searchTv`, `searchByEan`, `searchBooks`, `searchByIsbn` sont appelés
**Then** ils retournent un `FunctionResponse<MediaResult[]|MediaResult>` valide
**And** `lib/mediaSearch.ts` expose `searchMedia()` et `getMediaByBarcode()` avec la même interface qu'auparavant

**Given** `getMediaByBarcode` appelé avec un barcode EAN-13 valide
**When** la détection ISBN (978/979 → Google Books) ou EAN (TMDB) s'exécute
**Then** le résultat est retourné en moins de 3 secondes sur connexion 4G standard (NFR1)

**Given** une API tierce indisponible
**When** un client lib/ est appelé
**Then** il retourne `{ success: false, error: "Service temporairement indisponible" }` sans crash (NFR14)

### Story 2.2 : Ajout d'un item via scan de code-barres

En tant qu'utilisatrice,
Je veux scanner le code-barres d'un DVD, Blu-ray ou livre avec ma caméra,
Afin que la fiche soit auto-remplie instantanément sans saisie manuelle.

**Acceptance Criteria :**

**Given** l'écran de scan (`app/scan.tsx`) ouvert sur mobile (development build requis)
**When** je pointe la caméra vers un code-barres EAN-13, EAN-8 ou UPC-A valide
**Then** le code est détecté automatiquement par `expo-camera`
**And** `useBarcodeScan.ts` appelle `getMediaByBarcode` via `lib/mediaSearch.ts`
**And** la fiche apparaît pré-remplie (titre, affiche, synopsis, année, réalisateur/auteur) en moins de 3 secondes (NFR1)

**Given** une fiche auto-remplie affichée
**When** je confirme l'ajout
**Then** l'item est enregistré dans Firestore `/users/{uid}/items/{itemId}` avec `addedVia: 'scan'`
**And** il apparaît immédiatement dans ma collection via le listener `useCollection`

**Given** un code-barres non reconnu par l'API
**When** le scan échoue ou retourne `success: false`
**Then** un message explicite s'affiche ("Code non reconnu — saisie manuelle ?") avec un bouton vers `app/item/new.tsx` (FR33, NFR14)
**And** aucune donnée n'est perdue

### Story 2.3 : Ajout d'un item via recherche par titre

En tant qu'utilisatrice,
Je veux rechercher un film, une série ou un livre par son titre,
Afin d'ajouter un item à ma collection même sans code-barres disponible.

**Acceptance Criteria :**

**Given** l'écran de recherche avec sélecteur de type (film / série / livre)
**When** je saisis au moins 2 caractères et lance la recherche
**Then** `useMediaSearch.ts` appelle `searchMedia(query, type)` via `lib/mediaSearch.ts`
**And** les résultats s'affichent avec titre, affiche et année

**Given** des résultats affichés
**When** je sélectionne un item
**Then** la fiche est auto-remplie depuis TMDB ou Google Books
**And** je peux confirmer l'ajout qui enregistre l'item avec `addedVia: 'search'`

**Given** aucun résultat trouvé
**When** la recherche ne retourne rien
**Then** un message "Aucun résultat — créer manuellement ?" s'affiche avec un lien vers `app/item/new.tsx`

### Story 2.4 : Création manuelle d'une fiche

En tant qu'utilisatrice,
Je veux créer manuellement une fiche pour un item non trouvé via API,
Afin de ne jamais être bloquée par les limites des bases de données externes.

**Acceptance Criteria :**

**Given** l'écran de création manuelle (`app/item/new.tsx`)
**When** je saisis le titre (obligatoire) et le type de média (film / série / livre)
**Then** les champs optionnels (année, réalisateur/auteur, synopsis) sont disponibles
**And** à la validation, l'item est enregistré dans Firestore avec `addedVia: 'manual'`

**Given** le titre manquant
**When** je tente de valider
**Then** une erreur de validation s'affiche sur le champ titre
**And** aucune écriture Firestore n'est effectuée

### Story 2.5 : Affichage, modification et suppression d'un item

En tant qu'utilisatrice,
Je veux voir la fiche complète d'un item, la modifier et la supprimer,
Afin de maintenir ma collection à jour et correcte.

**Acceptance Criteria :**

**Given** un item dans ma collection
**When** je le sélectionne
**Then** la fiche complète s'affiche (`app/(app)/item/[id].tsx`) : titre, affiche, synopsis, type, année, métadonnées

**Given** la fiche d'un item affichée
**When** je modifie un ou plusieurs champs et valide
**Then** Firestore `/users/{uid}/items/{itemId}` est mis à jour avec `updatedAt: serverTimestamp()`
**And** la collection se met à jour via le listener `useCollection`

**Given** un item dans ma collection
**When** je confirme sa suppression (après confirmation explicite)
**Then** le document Firestore est supprimé
**And** l'item disparaît de la collection sans rechargement

### Story 2.6 : Recherche et filtrage de la collection

En tant qu'utilisatrice,
Je veux rechercher et filtrer ma collection par titre, type de média ou statut,
Afin de retrouver rapidement n'importe quel item.

**Acceptance Criteria :**

**Given** l'écran de ma collection (`app/(app)/collection.tsx`)
**When** je saisis du texte dans la barre de recherche
**Then** les items sont filtrés en temps réel par titre (côté client, sur le cache local)
**And** la réponse est instantanée (< 500ms, NFR3)

**Given** la collection affichée
**When** j'applique un filtre par type (film / série / livre) ou par statut
**Then** seuls les items correspondants sont affichés
**And** les filtres sont combinables (ex: films + statut "Vu")

**Given** une collection vide ou sans résultats après filtre
**When** aucun item ne correspond
**Then** un écran vide explicite s'affiche (`EmptyState`) avec une suggestion d'action

---

## Epic 3 : Statuts, Notation & Suivi des Prêts

Les utilisatrices peuvent attribuer des statuts à leurs items, noter avec la tier-list et un commentaire, et tracker tous leurs prêts.

### Story 3.1 : Gestion des statuts d'un item

En tant qu'utilisatrice,
Je veux attribuer un statut à chaque item de ma collection,
Afin de savoir en un coup d'œil ce que j'ai vu, possédé, prêté ou souhaite regarder.

**Acceptance Criteria :**

**Given** la fiche d'un item (`app/(app)/item/[id].tsx`)
**When** j'ouvre le sélecteur de statut (`StatusPicker`)
**Then** les 5 options s'affichent clairement : Possédé · Vu · Prêté · À voir · Favori

**Given** le sélecteur de statut ouvert
**When** je sélectionne un statut
**Then** le champ `status` est mis à jour dans Firestore
**And** le badge de statut sur la fiche se met à jour immédiatement

**Given** un item dont je change le statut de "Prêté" vers un autre statut
**When** je valide le changement
**Then** les champs `loanTo` et `loanDate` sont effacés automatiquement

### Story 3.2 : Notation — note, tier-list et commentaire

En tant qu'utilisatrice,
Je veux noter un item avec une note chiffrée, un niveau de tier-list et un commentaire libre,
Afin d'exprimer précisément mon ressenti et retrouver mes avis facilement.

**Acceptance Criteria :**

**Given** la fiche d'un item
**When** j'ouvre la section notation
**Then** trois composants distincts sont disponibles : `RatingWidget` (0-10), `TierPicker` (6 niveaux), `CommentInput` (texte libre)

**Given** le widget de note affiché
**When** j'attribue une note entre 0 et 10
**Then** le champ `rating` est enregistré dans Firestore
**And** la note s'affiche sur la carte dans la collection

**Given** le TierPicker affiché
**When** je sélectionne un niveau (Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant)
**Then** le champ `tier` est enregistré dans Firestore
**And** le badge tier s'affiche sur la fiche avec la couleur correspondante

**Given** une note, un tier ou un commentaire existant
**When** je le modifie ou le supprime
**Then** Firestore est mis à jour ou le champ est effacé (FR22)
**And** les modifications sont visibles immédiatement

### Story 3.3 : Enregistrement et suivi des prêts

En tant qu'utilisatrice,
Je veux enregistrer à qui j'ai prêté un item et depuis quand,
Afin de ne jamais perdre la trace de mes objets prêtés.

**Acceptance Criteria :**

**Given** un item avec le statut "Prêté" sélectionné
**When** la modal de prêt (`LoanModal`) s'ouvre
**Then** deux champs sont disponibles : nom de l'emprunteur (obligatoire) et date de prêt (par défaut : aujourd'hui)

**Given** le formulaire de prêt rempli
**When** je valide
**Then** `loanTo` et `loanDate` sont enregistrés dans Firestore avec le statut "Prêté"
**And** l'item apparaît dans la liste des prêts en cours

**Given** la liste des prêts (`LoanList` ou filtre statut "Prêté")
**When** je consulte mes prêts
**Then** chaque item affiche le nom de l'emprunteur et la date de prêt (FR18)
**And** la liste est accessible en moins de 2 taps (NFR10)

**Given** un item prêté retourné
**When** je change son statut (ex: vers "Possédé" ou "Vu")
**Then** `loanTo` et `loanDate` sont effacés automatiquement (FR17)
**And** l'item disparaît de la liste des prêts en cours

---

## Epic 4 : Cercle Privé & Recommandations

Les utilisatrices peuvent inviter des proches, voir la collection des membres, échanger des recommandations et mettre en avant un item en Cinéclub.

### Story 4.1 : Système d'invitation et rejoindre le cercle

En tant qu'administratrice,
Je veux générer un lien d'invitation pour mon cercle,
Afin que mes proches puissent rejoindre Cinook et accéder à l'espace partagé.

**Acceptance Criteria :**

**Given** l'écran de gestion du cercle (`app/(app)/circle.tsx`) en mode admin
**When** je génère un lien d'invitation
**Then** un token UUID unique est créé dans `/circles/{circleId}/inviteToken`
**And** le lien copiable est affiché (format : `https://[app-url]/invite/{token}`)

**Given** une nouvelle utilisatrice qui clique sur le lien d'invitation
**When** elle accède à `app/invite/[token].tsx`
**Then** le token est validé contre Firestore
**And** si valide, son `uid` est ajouté au tableau `members[]` du cercle
**And** son profil `/users/{uid}` est mis à jour avec le `circleId`
**And** elle est redirigée vers l'écran principal

**Given** un token invalide ou expiré
**When** une utilisatrice tente de l'utiliser
**Then** un message d'erreur explicite s'affiche ("Lien invalide ou expiré")
**And** aucune modification Firestore n'est effectuée

### Story 4.2 : Gestion du cercle et administration

En tant qu'administratrice,
Je veux consulter la liste des membres de mon cercle,
Afin de savoir qui a rejoint Cinook et gérer mon cercle privé.

**Acceptance Criteria :**

**Given** l'écran cercle (`app/(app)/circle.tsx`)
**When** je l'ouvre
**Then** la liste de tous les membres s'affiche via `useCircle` avec leur nom et email (FR5)
**And** mon statut d'administratrice est visible

**Given** la liste des membres affichée
**When** je consulte un membre
**Then** je peux accéder à sa collection (FR14 — voir Story 4.3)

### Story 4.3 : Consulter la collection et les notes d'un membre

En tant qu'utilisatrice,
Je veux consulter la collection et les notes d'un autre membre du cercle,
Afin de découvrir ses goûts et m'inspirer de ses avis.

**Acceptance Criteria :**

**Given** un membre du cercle sélectionné
**When** j'accède à sa collection
**Then** ses items sont lisibles via les Firestore Rules (isolation cercle, NFR5)
**And** le titre, l'affiche, le statut, la note et le tier de chaque item sont visibles (FR14)

**Given** la fiche d'un item de ma propre collection
**When** d'autres membres du cercle ont noté cet item
**Then** leurs notes, tiers et commentaires sont affichés dans une section dédiée (FR23)
**And** seuls les membres de mon cercle sont visibles, jamais d'autres utilisateurs

### Story 4.4 : Envoyer et recevoir des recommandations

En tant qu'utilisatrice,
Je veux recommander un item à un ou plusieurs membres de mon cercle et recevoir leurs recommandations,
Afin d'enrichir nos échanges culturels de façon asynchrone.

**Acceptance Criteria :**

**Given** la fiche d'un item
**When** j'appuie sur "Recommander" (`RecoComposer`)
**Then** je peux sélectionner un ou plusieurs membres du cercle
**And** la recommandation est enregistrée dans `/circles/{circleId}/recommendations/{id}` avec `fromUserId`, `toUserIds[]`, `itemId`, `itemTitle` (FR26)

**Given** une recommandation reçue
**When** j'ouvre l'écran d'accueil (`app/(app)/index.tsx`)
**Then** les recommandations reçues s'affichent via `useRecommendations` avec le nom de l'expéditeur, le titre et l'affiche (FR27)

**Given** une recommandation reçue affichée
**When** j'appuie sur "Ajouter à À voir"
**Then** l'item est ajouté à ma collection avec le statut "À voir" en un seul geste (FR28, NFR10)
**And** la recommandation reste visible dans le fil

### Story 4.5 : Cinéclub — mettre en avant un item

En tant qu'utilisatrice,
Je veux mettre en avant un item en tant que Cinéclub pour tous les membres de mon cercle,
Afin de partager un coup de cœur ou un film à l'affiche avec mon entourage.

**Acceptance Criteria :**

**Given** la fiche d'un item
**When** j'appuie sur "Mettre en Cinéclub" (`CineclubButton`)
**Then** le document `/circles/{circleId}/cineclub` est écrasé avec l'item sélectionné, `postedBy` et `postedAt` (FR29)

**Given** un item mis en Cinéclub
**When** n'importe quel membre du cercle ouvre l'écran d'accueil
**Then** la bannière Cinéclub (`CineclubBanner`) affiche l'item en avant via `useCineclub` listener temps réel (FR30)
**And** la mise à jour est visible pour tous les membres en moins de 2 secondes

**Given** un nouveau Cinéclub mis en place
**When** un membre voit la bannière
**Then** il peut ajouter l'item à sa liste "À voir" en un tap depuis la bannière

---

## Epic 5 : Découverte — Films à l'affiche

Les utilisatrices peuvent parcourir les films actuellement en salle et les ajouter directement à leur collection ou liste "À voir".

### Story 5.1 : Parcourir les films à l'affiche et les ajouter

En tant qu'utilisatrice,
Je veux consulter la liste des films actuellement en salle et en ajouter à ma collection,
Afin de ne rater aucune sortie et préparer mes prochaines sorties cinéma depuis Cinook.

**Acceptance Criteria :**

**Given** l'écran Découverte (`app/(app)/discover.tsx`)
**When** je l'ouvre avec une connexion active
**Then** la liste des films en salle s'affiche via l'endpoint TMDB `now_playing` appelé depuis `lib/tmdb.ts` directement
**And** chaque film affiche son affiche, son titre et sa date de sortie (FR24)

**Given** la liste des films à l'affiche
**When** je sélectionne un film
**Then** sa fiche complète s'affiche (synopsis, réalisateur, durée)
**And** deux actions sont disponibles : "Ajouter à ma collection" et "Ajouter à À voir" (FR25)

**Given** l'action "Ajouter à ma collection" choisie
**When** je valide
**Then** le film est enregistré dans Firestore `/users/{uid}/items/{itemId}` avec `addedVia: 'discover'`
**And** il apparaît immédiatement dans ma collection

**Given** l'action "Ajouter à À voir" choisie
**When** je valide
**Then** le film est enregistré avec le statut `wishlist` en un seul geste (NFR10)

**Given** l'écran Découverte ouvert sans connexion
**When** la liste ne peut pas être chargée
**Then** un message explicite s'affiche ("Connexion requise pour les films à l'affiche")
**And** aucun crash ne se produit (NFR18)

---

## Epic 6 : Mode Hors-ligne, Export & Paramètres

Les utilisatrices peuvent utiliser l'app sans connexion internet, exporter leur collection en CSV/JSON, et gérer leur compte.

### Story 6.1 : Mode hors-ligne — lecture et écriture

En tant qu'utilisatrice,
Je veux consulter ma collection et ajouter des items même sans connexion internet,
Afin que Cinook soit toujours disponible, même en déplacement ou sans réseau.

**Acceptance Criteria :**

**Given** Firebase Offline Persistence activé dans `lib/firebase.ts`
**When** l'app est ouverte sans connexion internet
**Then** ma collection complète s'affiche depuis le cache Firestore local (FR31)
**And** l'interface ne se dégrade pas — aucun écran blanc, aucun spinner infini (NFR4)

**Given** l'app en mode hors-ligne
**When** j'ajoute ou modifie un item
**Then** l'écriture est mise en file d'attente localement par le SDK Firestore (FR32)
**And** l'item apparaît immédiatement dans ma collection locale
**And** un indicateur visuel signale que la sync est en attente

**Given** une connexion rétablie après une session hors-ligne
**When** le SDK Firestore se reconnecte
**Then** toutes les écritures en attente sont synchronisées automatiquement
**And** aucune donnée n'est perdue (NFR15, NFR17)
**And** l'indicateur de sync disparaît

**Given** un conflit d'écriture (même item modifié en ligne et hors-ligne)
**When** la sync s'effectue
**Then** la règle last-write-wins de Firestore s'applique (comportement documenté, NFR15)

### Story 6.2 : Export de la collection et paramètres du compte

En tant qu'utilisatrice,
Je veux exporter ma collection complète et gérer mon compte,
Afin d'avoir la souveraineté sur mes données et de pouvoir me déconnecter ou supprimer mon compte.

**Acceptance Criteria :**

**Given** l'écran Paramètres (`app/(app)/settings.tsx`)
**When** je demande l'export de ma collection
**Then** `lib/export.ts` génère un fichier CSV ou JSON contenant tous mes items avec leurs métadonnées, statuts et notes (FR6)
**And** le fichier est partageable via le système natif de partage iOS/Android/Web

**Given** le fichier d'export généré
**When** je l'ouvre
**Then** tous mes items sont présents avec : titre, type, statut, note, tier, commentaire, dates
**And** le format est lisible dans un tableur (CSV) ou un éditeur de texte (JSON)

**Given** l'écran Paramètres
**When** je sélectionne "Se déconnecter"
**Then** Firebase Auth termine la session et je suis redirigée vers l'écran de connexion (lié à Story 1.3)

**Given** l'écran Paramètres
**When** je demande la suppression de mon compte
**Then** une confirmation explicite est demandée ("Cette action est irréversible")
**And** après confirmation, mon compte Firebase Auth et mes données Firestore `/users/{uid}` sont supprimés (NFR9 RGPD)
**And** je suis redirigée vers l'écran de création de compte
