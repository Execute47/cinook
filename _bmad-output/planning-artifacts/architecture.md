---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
status: 'complete'
completedAt: '2026-03-06'
inputDocuments: ['product-brief-cinook-2026-03-06.md', 'prd.md']
workflowType: 'architecture'
project_name: 'cinook'
user_name: 'Mathilde'
date: '2026-03-06'
---

# Architecture Decision Document

_Ce document se construit de façon collaborative, étape par étape. Les sections sont ajoutées au fil des décisions architecturales prises ensemble._

## Project Context Analysis

### Requirements Overview

**Functional Requirements :**
33 FRs couvrant 6 domaines de capacité : Authentification & Comptes (FR1-6), Catalogue & Collection (FR7-14), Statuts & Prêts (FR15-18), Notation & Évaluation (FR19-23), Découverte Films à l'affiche (FR24-25), Social & Cercle privé (FR26-33). La combinaison scan physique + social privé + multi-média est l'innovation centrale — elle concentre les décisions architecturales les plus structurantes (scanner, proxy API, données partagées en temps réel).

**Non-Functional Requirements :**
Les NFRs critiques qui guident l'architecture :
- NFR1 : Scan → fiche < 3 secondes (latence API tierce à optimiser)
- NFR2 : Collection 1 000 items < 2 secondes (pagination ou chargement anticipé)
- NFR4 : Hors-ligne complet — lecture et écriture (Firestore Offline Persistence)
- NFR5/6 : Isolation stricte par cercle (règles Firestore critiques)
- NFR8 : Clés API non exposées client-side (Firebase Functions proxy obligatoire)
- NFR16 : Disponibilité 99.5% (Firebase SLA satisfaisant par défaut)

**Scale & Complexity :**
Projet à complexité moyenne. Faible volume utilisateurs (< 20 personnes) mais richesse fonctionnelle significative : cross-platform, offline, deux intégrations API, scan natif, real-time partiel.

- Primary domain : Mobile-first multi-plateforme + Firebase backend
- Complexity level : Medium
- Estimated architectural components : 8-10

### Technical Constraints & Dependencies

- Firebase Firestore : base de données principale et moteur offline
- Firebase Auth : authentification email/password
- Firebase Functions : proxy sécurisé pour TMDB et Google Books (NFR8)
- Firebase Hosting : hébergement SPA web
- TMDB API : données films/séries (gratuit, clé requise)
- Google Books API : données livres via ISBN (gratuit, clé requise)
- Framework cross-platform à choisir : doit supporter iOS, Android, Web, accès caméra natif, et Firestore offline
- Distribution interne v1 (TestFlight + APK direct) — pas de Store compliance

### Cross-Cutting Concerns Identified

1. **Auth state management** : toutes les vues nécessitent une authentification valide — à gérer globalement (guard de navigation)
2. **Couche offline-first** : tous les accès Firestore doivent fonctionner via le cache local — pas d'accès directs sans prise en compte du mode hors-ligne
3. **Proxy API Firebase Functions** : TMDB et Google Books ne sont jamais appelés directement depuis le client — toujours via Functions
4. **Gestion d'erreurs unifiée** : scan raté, API indisponible, réseau absent — comportement défini et cohérent sur toutes les plateformes (NFR18)
5. **Isolation par cercle (Firestore Rules)** : règle de sécurité centrale à tester exhaustivement avant toute mise en production
6. **Real-time Firestore listeners** : Cinéclub (FR30) et recommandations (FR27) nécessitent des listeners actifs sur l'accueil

## Starter Template Evaluation

### Primary Technology Domain

Mobile-first cross-platform + Firebase — iOS, Android, Web desktop à partir d'une seule base de code TypeScript/React.

### Starter Options Considered

- **Option A — Expo (base de code unique)** : Un seul projet React Native/TypeScript compilant vers iOS, Android, et Web. Firebase JS SDK v12 fonctionne nativement sur toutes les plateformes. Maintenance minimale pour dev solo.
- **Option B — Monorepo (Expo mobile + Vite web)** : Deux apps séparées. Web desktop optimal mais complexité monorepo et double maintenance — inadapté pour dev solo.

### Selected Starter : Expo SDK 53 + Expo Router + NativeWind + Firebase JS SDK

**Rationale for Selection :**
Option A retenue pour minimiser la surface de maintenance (dev solo, risque de surcharge de scope identifié dans le PRD). Le web desktop est secondaire dans le PRD — l'expérience Expo Router web est suffisante. Expo SDK 53 + Firebase JS SDK v12 est la combinaison officiellement recommandée pour le cross-platform en 2026. L'écosystème TypeScript/React est familier pour Mathilde.

**Initialization Command :**

```bash
npx create-expo-stack@latest cinook
# Sélectionner : TypeScript · Expo Router · NativeWind · Firebase
```

**Architectural Decisions Provided by Starter :**

**Language & Runtime :**
TypeScript strict — TypeScript ~5.8.3 recommandé pour SDK 53.

**Styling Solution :**
NativeWind v4 (Tailwind CSS adapté React Native) — familier pour dev React/Vite.

**Build Tooling :**
EAS Build (Expo Application Services) pour iOS et Android. Firebase Hosting pour web (SPA).

**Testing Framework :**
Jest + React Native Testing Library.

**Code Organization :**
Expo Router file-based routing — répertoire `app/` (similaire à Next.js App Router). Structure : `app/`, `components/`, `hooks/`, `lib/` (Firebase, APIs), `constants/`.

**Development Experience :**
Hot reload natif Expo, Expo Go pour développement rapide (hors scan et Firebase natif), development build pour features natives.

**Barcode Scanning :**
`expo-camera` SDK 53 — gère EAN-13 (ISBN livres), EAN-8, UPC-A/E (DVD/Blu-ray) sur iOS et Android. Scan non supporté sur web (usage exclusivement mobile, acceptable).

**Firebase SDK :**
Firebase JS SDK v12 (`firebase@^12.0.0`) — seule version compatible Expo SDK 53. SDK universel iOS + Android + Web.

**Note :** L'initialisation du projet via cette commande sera la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation) :**
- Modèle de données Firestore (flat par utilisateur)
- Firestore Security Rules (isolation par cercle)
- Firebase Functions proxy pour clés API tierces
- State management (Zustand + listeners Firestore)

**Important Decisions (Shape Architecture) :**
- Structure Expo Router `app/` directory
- Mécanisme d'invitation (token UUID)
- Pattern de réponse API unifié

**Deferred Decisions (Post-MVP) :**
- Normalisation Firestore (modèle B avec métadonnées partagées) — V2 si performance insuffisante
- CI/CD automatisé (EAS Submit) — V2
- Firebase Dynamic Links ou deep linking avancé — V2

### Data Architecture

**Modèle Firestore — Structure plate par utilisateur :**

```
/users/{userId}
  displayName, email, circleId

/users/{userId}/items/{itemId}
  ├── Métadonnées : title, type (film|serie|livre), poster, synopsis,
  │                 director/author, year, tmdbId/googleBooksId, isbn/ean
  ├── Personnel   : status (owned|watched|loaned|wishlist|favorite),
  │                 rating (0-10), tier (none|disliked|seen|bronze|silver|gold|diamond),
  │                 comment, loanTo, loanDate, addedAt, updatedAt
  └── Source      : addedVia (scan|search|manual)

/circles/{circleId}
  members: [userId1, userId2...], adminId, inviteToken (UUID), createdAt

/circles/{circleId}/recommendations/{recoId}
  fromUserId, toUserIds[], itemId, itemTitle, itemPoster, message, createdAt

/circles/{circleId}/cineclub
  itemId, itemTitle, itemPoster, postedBy, postedAt  ← document unique, écrasé à chaque mise en avant
```

**Rationale :** Structure plate choisie pour sa simplicité Firestore Rules, performance offline naturelle, et absence de jointures. Duplication des métadonnées acceptable pour < 20 utilisateurs.

### Authentication & Security

- **Auth :** Firebase Auth email/password uniquement (v1)
- **Firestore Rules :** Chaque utilisateur lit/écrit ses propres items. Un membre du cercle peut lire les items des autres membres de son circleId. Seul l'admin écrit dans `/circles/{circleId}`.
- **Invitation :** Token UUID généré par l'admin, stocké dans `/circles/{circleId}/inviteToken`. Route web `/invite/{token}` valide le token, crée le compte si nécessaire, ajoute l'userId dans `members[]`.
- **API keys :** TMDB et Google Books exclusivement appelés depuis Firebase Functions — jamais exposés côté client (NFR8).

### API & Communication Patterns

**Firebase Functions MVP (2 fonctions) :**

```typescript
// searchMedia(query: string, type: 'film' | 'serie' | 'livre') → MediaResult[]
// getMediaByBarcode(barcode: string) → MediaResult | null
```

**Pattern de réponse unifié :**
```typescript
type FunctionResponse<T> = { success: true; data: T } | { success: false; error: string }
```

**Hook client :** `useMediaSearch()` centralise tous les appels aux Functions, gère les états loading/error, et propose le fallback saisie manuelle en cas d'échec (NFR14).

### Frontend Architecture

**State Management :**
- **Zustand** pour l'état UI (3 stores) :
  - `authStore` — user, circleId, isAdmin
  - `filtersStore` — recherche active, filtre type/statut
  - `uiStore` — états modales, loading ponctuels
- **Firestore listeners natifs** (dans hooks React) pour les données temps réel :
  - `useCollection()` — écoute `/users/{uid}/items`
  - `useCircle()` — écoute `/circles/{circleId}`
  - `useRecos()` — écoute `/circles/{circleId}/recommendations`

**Structure Expo Router (`app/`) :**

```
app/
├── _layout.tsx                ← Root layout, auth guard global
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (app)/
│   ├── _layout.tsx            ← Tab navigation (Accueil, Collection, Découverte, Cercle)
│   ├── index.tsx              ← Accueil : bannière Cinéclub + recommandations reçues
│   ├── collection.tsx         ← Ma collection avec filtres
│   ├── discover.tsx           ← Films à l'affiche (TMDB now_playing)
│   ├── circle.tsx             ← Cercle : membres, gestion admin
│   └── item/[id].tsx          ← Fiche détail item
├── invite/[token].tsx         ← Validation lien d'invitation
└── scan.tsx                   ← Scanner code-barres (modal)
```

### Infrastructure & Deployment

| Aspect | Décision | Justification |
|--------|----------|---------------|
| Build mobile | EAS Build (cloud) | Pas de Mac requis pour iOS |
| Distribution v1 | TestFlight (iOS) + APK direct (Android) | Sans Store compliance |
| Web hosting | Firebase Hosting (SPA) | Intégré, gratuit, zéro config |
| Variables d'env | `.env` Expo + Firebase Functions config | Clés TMDB/Google Books dans Functions uniquement |
| CI/CD | Manuel v1 | Scope solo, pipeline automatisé reporté en V2 |
| Monitoring | Firebase Crashlytics + console Firebase | Intégré, zéro configuration additionnelle |

### Decision Impact Analysis

**Implementation Sequence :**
1. Initialisation projet Expo + Firebase config
2. Firestore Rules + Auth (base de sécurité)
3. Modèle de données + CRUD collection basique
4. Firebase Functions proxy (TMDB + Google Books)
5. Scan + auto-remplissage
6. Statuts, notation, prêts
7. Cercle privé + système d'invitation
8. Recommandations + Cinéclub
9. Offline persistence + Export

**Cross-Component Dependencies :**
- Auth state (authStore) → requis par toutes les vues et toutes les Firestore Rules
- circleId (dans user profile) → requis par toutes les fonctionnalités sociales
- Firebase Functions → requis par scan et recherche (pas de clés côté client)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified :** 7 zones où des agents AI pourraient produire du code incompatible — naming Firestore, structure fichiers, format réponses Functions, gestion dates, Zustand, listeners, et appels API directs.

### Naming Patterns

**Collections & Champs Firestore :** `camelCase` exclusivement

```
✅ users, circleId, addedAt, loanTo, tmdbId
❌ Users, circle_id, added_at, loan_to
```

**Fichiers :**
- Composants React : `PascalCase.tsx` → `ItemCard.tsx`, `ScanModal.tsx`
- Hooks : `camelCase` préfixé `use` → `useCollection.ts`, `useMediaSearch.ts`
- Stores Zustand : `camelCase` suffixé `Store` → `authStore.ts`, `filtersStore.ts`
- Utilitaires/lib : `camelCase` → `firebaseConfig.ts`, `formatDate.ts`
- Routes Expo Router : `kebab-case` ou `[param]` → `item/[id].tsx`

**TypeScript :**
- Interfaces : `PascalCase`, sans préfixe `I` → `MediaItem`, `CircleData`, `Recommendation`
- Types union : `PascalCase` → `MediaType = 'film' | 'serie' | 'livre'`
- Variables/fonctions : `camelCase` → `circleId`, `fetchMediaByBarcode`

### Structure Patterns

**Organisation des composants — par feature :**

```
components/
├── media/      ← ItemCard, ItemDetail, RatingWidget, TierBadge
├── scan/       ← ScanButton, ScanModal, BarcodeOverlay
├── circle/     ← MemberList, RecoCard, CineclubBanner
├── discovery/  ← NowPlayingCard
└── ui/         ← Button, Input, LoadingSpinner, ErrorMessage (primitives)

lib/
├── firebase.ts    ← config et exports Firebase
├── firestore.ts   ← helpers CRUD réutilisables
├── functions.ts   ← appels Firebase Functions uniquement
└── export.ts      ← logique export CSV/JSON
```

**Tests :** co-localisés avec les fichiers source, suffixe `.test.ts(x)`

```
✅ components/media/ItemCard.tsx + components/media/ItemCard.test.tsx
❌ __tests__/ItemCard.test.tsx
```

### Format Patterns

**Réponse Firebase Functions — type `FunctionResponse<T>` obligatoire :**

```typescript
type FunctionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

**Dates dans Firestore :** `Timestamp` Firebase au stockage, `.toDate()` à la lecture. Jamais de string ISO dans Firestore.

```typescript
// Écriture
addedAt: serverTimestamp(),  loanDate: Timestamp.fromDate(new Date())
// Lecture
const date = item.addedAt?.toDate()
```

**Null vs Undefined :** champs optionnels en TypeScript → `undefined` (jamais `null` pour les champs Firestore optionnels)

### Communication Patterns

**Zustand — mises à jour immuables uniquement :**

```typescript
✅ set((state) => ({ filters: { ...state.filters, type: newType } }))
❌ set((state) => { state.filters.type = newType })  // mutation directe interdite
```

**Nommage actions Zustand :** `verbe + complément` en camelCase → `setMediaType`, `clearFilters`, `setSearchQuery`

**Firestore listeners — pattern hook standardisé :**

```typescript
export function useCollection() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const unsub = onSnapshot(query, snap => { /* ... */ })
    return unsub  // cleanup OBLIGATOIRE
  }, [])
  return { items, loading, error }
}
```

### Process Patterns

**Gestion d'erreurs — 3 niveaux :**

| Niveau | Quand | Pattern |
|--------|-------|---------|
| Silencieux | Erreur non critique | `console.error()` uniquement |
| Toast | Erreur récupérable (API timeout) | `showToast(message)` global |
| Écran d'erreur | Erreur bloquante (auth perdue) | `<ErrorBoundary>` ou navigation |

Toute `catch` doit au minimum logger — jamais de catch vide (NFR18).

**Loading states :**
- Local (hook) : `const [isLoading, setIsLoading] = useState(false)`
- Global (uiStore) : `loading: { scan: false, export: false, search: false }`

### Enforcement Guidelines

**Tous les agents AI DOIVENT :**

1. Nommer collections Firestore et champs en `camelCase`
2. Utiliser `FunctionResponse<T>` pour toutes les réponses Firebase Functions
3. Stocker les dates en `Timestamp` Firebase (jamais string ISO dans Firestore)
4. Co-localiser les tests avec les fichiers source (`.test.tsx`)
5. Nettoyer les listeners Firestore dans le `return` de `useEffect`
6. Utiliser les mises à jour immuables dans Zustand
7. Ne jamais appeler TMDB ou Google Books directement depuis le client

**Anti-patterns interdits :**

```typescript
❌ import firebase directement dans un composant → toujours via lib/firebase.ts
❌ fetch('https://api.themoviedb.org/...') → toujours via lib/functions.ts
❌ state.filters.type = value → mutation directe Zustand interdite
❌ catch(e) {} → catch vide interdit, toujours au moins console.error(e)
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
cinook/
├── README.md
├── package.json
├── app.json                        ← config Expo (nom, icône, splash, permissions)
├── tsconfig.json
├── babel.config.js
├── tailwind.config.js              ← NativeWind config
├── .env                            ← EXPO_PUBLIC_FIREBASE_* (jamais clés TMDB)
├── .env.example
├── .gitignore
├── eas.json                        ← EAS Build profiles (dev, preview, production)
│
├── app/                            ← Expo Router — toutes les routes
│   ├── _layout.tsx                 ← Root layout + auth guard global
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx               ← FR1, FR2
│   │   └── register.tsx            ← FR1
│   ├── (app)/
│   │   ├── _layout.tsx             ← Tab navigation (4 tabs)
│   │   ├── index.tsx               ← Accueil : bannière Cinéclub + recos reçues (FR27, FR30)
│   │   ├── collection.tsx          ← Ma collection + filtres + recherche (FR13, FR15)
│   │   ├── discover.tsx            ← Films à l'affiche TMDB (FR24, FR25)
│   │   ├── circle.tsx              ← Cercle : membres, admin (FR4, FR5, FR14)
│   │   └── item/
│   │       └── [id].tsx            ← Fiche détail : statut, note, tier, prêt (FR11, FR15-FR23)
│   ├── invite/
│   │   └── [token].tsx             ← Validation lien d'invitation (FR3)
│   ├── scan.tsx                    ← Scanner code-barres (modal, FR7, FR9)
│   └── item/
│       └── new.tsx                 ← Ajout manuel (FR8, FR10)
│
├── components/
│   ├── media/
│   │   ├── ItemCard.tsx            ← Carte item dans la collection
│   │   ├── ItemCard.test.tsx
│   │   ├── ItemDetail.tsx          ← Fiche complète
│   │   ├── StatusPicker.tsx        ← Sélecteur statut (FR15)
│   │   ├── LoanModal.tsx           ← Formulaire prêt : nom + date (FR16)
│   │   ├── LoanList.tsx            ← Liste items prêtés (FR18)
│   │   ├── RatingWidget.tsx        ← Note 0-10 (FR19)
│   │   ├── TierPicker.tsx          ← Tier-list 6 niveaux (FR20)
│   │   ├── TierBadge.tsx           ← Badge tier affiché
│   │   └── CommentInput.tsx        ← Commentaire libre (FR21)
│   ├── scan/
│   │   ├── ScanButton.tsx          ← Bouton d'ouverture scanner
│   │   ├── ScanModal.tsx           ← Modal scanner camera (FR7)
│   │   └── BarcodeOverlay.tsx      ← Overlay viseur
│   ├── circle/
│   │   ├── MemberList.tsx          ← Liste membres cercle (FR5)
│   │   ├── MemberCard.tsx
│   │   ├── RecoCard.tsx            ← Carte recommandation reçue (FR27)
│   │   ├── RecoComposer.tsx        ← Envoi recommandation (FR26)
│   │   └── CineclubBanner.tsx      ← Bannière Cinéclub accueil (FR30)
│   ├── discovery/
│   │   ├── NowPlayingCard.tsx      ← Carte film à l'affiche (FR24)
│   │   └── NowPlayingList.tsx
│   └── ui/                         ← Primitives réutilisables
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── Toast.tsx               ← Notifications toast globales
│       └── EmptyState.tsx
│
├── hooks/
│   ├── useCollection.ts            ← Listener Firestore /users/{uid}/items (FR13, FR31)
│   ├── useCircle.ts                ← Listener Firestore /circles/{circleId} (FR5, FR30)
│   ├── useRecommendations.ts       ← Listener /circles/{circleId}/recommendations (FR27)
│   ├── useCineclub.ts              ← Listener /circles/{circleId}/cineclub (FR30)
│   ├── useMediaSearch.ts           ← Appels Functions searchMedia + fallback (FR8, FR9)
│   └── useBarcodeScan.ts           ← Expo Camera + appel getMediaByBarcode (FR7)
│
├── stores/
│   ├── authStore.ts                ← user, circleId, isAdmin (Zustand)
│   ├── filtersStore.ts             ← type média, statut, recherche (Zustand)
│   └── uiStore.ts                  ← loading states, toast queue (Zustand)
│
├── lib/
│   ├── firebase.ts                 ← initializeApp, getFirestore, getAuth exports
│   ├── firestore.ts                ← helpers CRUD : addItem, updateItem, deleteItem
│   ├── functions.ts                ← searchMedia(), getMediaByBarcode() → Firebase Functions
│   └── export.ts                   ← generateCSV(), generateJSON() (FR6)
│
├── types/
│   ├── media.ts                    ← MediaItem, MediaType, ItemStatus, TierLevel
│   ├── circle.ts                   ← CircleData, Member, Recommendation, Cineclub
│   └── api.ts                      ← FunctionResponse<T>, MediaResult, SearchParams
│
├── constants/
│   ├── tiers.ts                    ← TIER_LEVELS avec labels et couleurs
│   ├── statuses.ts                 ← STATUS_OPTIONS avec labels et icônes
│   └── mediaTypes.ts               ← MEDIA_TYPES
│
├── assets/
│   ├── images/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── adaptive-icon.png
│   └── fonts/
│
└── functions/                      ← Firebase Functions (déployé séparément)
    ├── package.json
    ├── tsconfig.json
    ├── .env                        ← TMDB_API_KEY, GOOGLE_BOOKS_API_KEY
    └── src/
        ├── index.ts                ← exports des functions
        ├── searchMedia.ts          ← appel TMDB + Google Books (FR8, FR9)
        ├── getMediaByBarcode.ts    ← détection type + appel API (FR7, FR9)
        └── utils/
            ├── tmdb.ts             ← client TMDB
            └── googleBooks.ts      ← client Google Books
```

### Architectural Boundaries

**Frontière Auth :**
- `app/(auth)/` → accessible sans auth
- `app/(app)/` → protégé par guard dans `app/_layout.tsx`
- `stores/authStore.ts` → source de vérité pour l'état auth global

**Frontière API (clés sécurisées) :**
- Le client n'appelle jamais TMDB ou Google Books directement
- Tout passe par `lib/functions.ts` → Firebase Functions → APIs tierces
- Clés dans `functions/.env` uniquement (NFR8)

**Frontière Offline :**
- Tous les accès Firestore passent par les hooks (`useCollection`, `useCircle`, etc.)
- Firebase Offline Persistence activé dans `lib/firebase.ts` au démarrage
- Le scan nécessite une connexion — géré dans `useBarcodeScan.ts` avec fallback saisie manuelle (FR33)

**Frontière Cercle :**
- Composants `circle/` n'affichent que les données du `circleId` de l'utilisateur connecté
- Règles Firestore renforcent l'isolation côté serveur (NFR5)

### Requirements to Structure Mapping

| Domaine FR | Localisation principale |
|-----------|------------------------|
| Auth & Comptes (FR1-6) | `app/(auth)/`, `stores/authStore.ts`, `app/(app)/circle.tsx`, `lib/export.ts` |
| Catalogue & Collection (FR7-14) | `app/scan.tsx`, `hooks/useCollection.ts`, `hooks/useMediaSearch.ts`, `components/media/` |
| Statuts & Prêts (FR15-18) | `components/media/StatusPicker.tsx`, `LoanModal.tsx`, `LoanList.tsx` |
| Notation & Évaluation (FR19-23) | `components/media/RatingWidget.tsx`, `TierPicker.tsx`, `CommentInput.tsx` |
| Découverte (FR24-25) | `app/(app)/discover.tsx`, `components/discovery/` |
| Social + Offline (FR26-33) | `components/circle/`, `hooks/useRecommendations.ts`, `hooks/useCineclub.ts`, `lib/firebase.ts` |

### Data Flow

```
Scan (mobile)
  → useBarcodeScan.ts → lib/functions.ts
  → Firebase Function getMediaByBarcode → TMDB / Google Books
  → MediaResult → lib/firestore.ts → /users/{uid}/items
  → useCollection listener → UI mise à jour automatique

Recherche manuelle
  → useMediaSearch.ts → lib/functions.ts → Firebase Function searchMedia
  → résultats → sélection → lib/firestore.ts → useCollection → UI

Cinéclub (temps réel)
  → CineclubBanner → useCineclub.ts
  → listener /circles/{circleId}/cineclub → mise à jour instantanée tous membres
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility :**
Toutes les décisions technologiques sont compatibles. Expo SDK 53 + Firebase JS SDK v12 est la combinaison officiellement supportée en 2026. NativeWind v4, Zustand, et Expo Router s'intègrent sans conflit connu. Firebase Offline Persistence est natif au SDK choisi — aucune librairie additionnelle requise.

**Note critique — Development Build :** `expo-camera` (barcode scanning) requiert un development build. Expo Go est insuffisant pour tester la feature scan. Documenter dans README : utiliser `npx expo run:ios` / `npx expo run:android` ou EAS Build dev profile pour tout test impliquant le scanner.

**Pattern Consistency :** Les patterns d'implémentation (camelCase Firestore, FunctionResponse<T>, hooks listeners standardisés) sont cohérents avec le stack React/TypeScript choisi.

**Structure Alignment :** La structure Expo Router `(auth)/` + `(app)/` + routes modales est alignée avec les décisions d'auth guard et de navigation par tabs.

### Requirements Coverage Validation

**Functional Requirements : 33/33 FRs couverts.**

Gaps identifiés et adressés :
- **FR29** (action "Mettre en Cinéclub") : ajout de `components/circle/CineclubButton.tsx` appelé depuis `app/(app)/item/[id].tsx`, écrit dans `/circles/{circleId}/cineclub`
- **FR2 + NFR9** (déconnexion + suppression compte RGPD) : ajout de `app/(app)/settings.tsx` (5ème tab ou menu profil)

**Non-Functional Requirements : 18/18 NFRs couverts architecturalement.**

| NFR clé | Couverture |
|---------|-----------|
| NFR1 — Scan < 3s | Firebase Functions ciblées < 2s latence ; TMDB ~500ms |
| NFR2 — Collection < 2s | Firestore offline cache → affichage immédiat depuis cache local |
| NFR4 — Offline complet | Firebase Offline Persistence activé dans `lib/firebase.ts` |
| NFR5/6 — Isolation + auth | Firestore Rules + auth guard `app/_layout.tsx` |
| NFR8 — Clés non exposées | Firebase Functions proxy — clés dans `functions/.env` uniquement |
| NFR9 — RGPD | `lib/export.ts` (export) + `app/(app)/settings.tsx` (suppression) |
| NFR14 — Fallback API | `useMediaSearch.ts` et `useBarcodeScan.ts` gèrent les échecs avec fallback saisie manuelle |
| NFR18 — Pas de crash silencieux | Error handling 3 niveaux documenté, catch vide interdit |

### Implementation Readiness Validation ✅

Décisions documentées avec versions vérifiées. Patterns complets avec exemples et anti-patterns explicites. Structure complète avec mapping FR → fichiers. Les agents AI peuvent implémenter de façon cohérente sans ambiguïté sur les choix technologiques ou organisationnels.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé (33 FRs, 18 NFRs, 6 préoccupations transversales)
- [x] Complexité évaluée (Medium — cross-platform + offline + 2 APIs + social temps réel)
- [x] Contraintes techniques identifiées (Firebase, distribution interne, dev solo)
- [x] Préoccupations transversales mappées

**✅ Architectural Decisions**
- [x] Stack complet avec versions (Expo SDK 53, Firebase JS SDK v12, NativeWind v4, Zustand)
- [x] Modèle de données Firestore défini (structure flat par utilisateur)
- [x] Sécurité complète (Firestore Rules + Functions proxy + auth guard)
- [x] Offline strategy (Firebase Offline Persistence + last-write-wins)
- [x] Déploiement (EAS Build + Firebase Hosting + distribution interne v1)

**✅ Implementation Patterns**
- [x] Conventions de nommage (7 règles explicites)
- [x] Organisation par feature (components/)
- [x] Format réponses unifié (FunctionResponse<T>)
- [x] Gestion d'erreurs 3 niveaux
- [x] 4 anti-patterns documentés avec exemples

**✅ Project Structure**
- [x] Arborescence complète définie avec annotations FR
- [x] Frontières architecturales établies (Auth, API, Offline, Cercle)
- [x] Mapping 33 FRs → fichiers/répertoires
- [x] Flux de données documentés (scan, recherche, Cinéclub)

### Architecture Readiness Assessment

**Overall Status : READY FOR IMPLEMENTATION**

**Confidence Level : High**

**Key Strengths :**
- Firebase-centric élimine le besoin d'un backend custom — scope maîtrisé pour dev solo
- Structure Expo Router claire et prévisible pour agents AI
- Patterns d'isolation des données robustes (Firestore Rules)
- Offline-first natif sans complexité additionnelle
- Séquence d'implémentation documentée (9 étapes ordonnées)

**Areas for Future Enhancement (V2+) :**
- Normalisation Firestore (modèle B avec métadonnées partagées) si performance insuffisante à grande échelle
- CI/CD automatisé via EAS Submit + GitHub Actions
- Notifications push (FCM)
- Multi-groupes et gestion des cercles

### Implementation Handoff

**AI Agent Guidelines :**
- Suivre toutes les décisions architecturales exactement telles que documentées
- Utiliser les patterns d'implémentation de façon cohérente sur tous les composants
- Respecter la structure projet et les frontières (jamais d'appel direct TMDB/Google Books côté client)
- Référencer ce document pour toutes les questions architecturales

**First Implementation Priority :**

```bash
npx create-expo-stack@latest cinook
# Sélectionner : TypeScript · Expo Router · NativeWind · Firebase
```

Puis : configurer le projet Firebase (Firestore, Auth, Functions, Hosting) avant d'implémenter la première feature.
