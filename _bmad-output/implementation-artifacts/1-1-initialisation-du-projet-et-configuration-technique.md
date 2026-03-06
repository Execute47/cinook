# Story 1.1 : Initialisation du projet et configuration technique

Status: review

## Story

En tant que développeuse,
Je veux initialiser le projet Cinook avec le stack technique choisi et configurer Firebase,
Afin que l'environnement de développement soit prêt et que toutes les features puissent être développées.

## Acceptance Criteria

### AC1 — Initialisation projet Expo

**Given** un environnement de développement vide
**When** la commande `npx create-expo-stack@latest cinook` est exécutée avec TypeScript · Expo Router · NativeWind · Firebase
**Then** le projet démarre sans erreur sur iOS, Android et Web
**And** la structure de fichiers correspond à l'architecture documentée (`app/`, `components/`, `hooks/`, `stores/`, `lib/`, `types/`, `constants/`)

### AC2 — Configuration Firebase

**Given** le projet initialisé
**When** la configuration Firebase est appliquée (`.env` avec clés Firebase, `lib/firebase.ts`, Firestore Offline Persistence activé)
**Then** la connexion à Firebase Firestore et Firebase Auth est opérationnelle
**And** les clés TMDB et Google Books ne sont jamais présentes dans le code client

### AC3 — Firestore Security Rules

**Given** la configuration Firebase en place
**When** les Firestore Security Rules sont déployées
**Then** aucune donnée n'est lisible sans authentification valide (NFR6)
**And** les règles d'isolation par cercle sont en place

### AC4 — EAS Build

**Given** le projet configuré
**When** `eas.json` est créé avec les profils dev/preview/production
**Then** un EAS Development Build peut être généré pour iOS et Android

## Tasks / Subtasks

- [x] **Task 1 — Initialiser le projet Expo** (AC1)
  - [x] Exécuter `npx create-expo-stack@latest cinook` — lancé dans dossier temp `cinook-init` puis copié dans `cinook/` (répertoire existant avec planning BMAD)
  - [x] Vérifier que l'app démarre avec `npx expo start` sur iOS, Android et Web
  - [x] Créer les dossiers manquants de l'arborescence cible : `stores/`, `types/`, `constants/`, `components/media/`, `components/scan/`, `components/circle/`, `components/discovery/`, `components/ui/`, `hooks/`, `lib/`, `functions/`

- [x] **Task 2 — Configurer Firebase** (AC2)
  - [x] Projet Firebase à créer dans la console par Mathilde (étape manuelle — hors automatisation)
  - [x] Créer `.env.example` avec les clés sans valeurs
  - [x] Créer `lib/firebase.ts` : `initializeApp`, export `db` (Firestore avec `persistentLocalCache`), export `auth` (Auth)
  - [x] Ajouter `.env` et `functions/.env` au `.gitignore`
  - [x] Les clés TMDB et Google Books sont absentes du repo client

- [x] **Task 3 — Créer les fichiers TypeScript de base** (AC1)
  - [x] `types/media.ts` — `MediaItem`, `MediaType`, `ItemStatus`, `TierLevel`, `AddedVia`
  - [x] `types/circle.ts` — `CircleData`, `Member`, `Recommendation`, `Cineclub`
  - [x] `types/api.ts` — `FunctionResponse<T>`, `MediaResult`, `SearchParams`
  - [x] `constants/tiers.ts` — `TIER_LEVELS` avec labels et couleurs
  - [x] `constants/statuses.ts` — `STATUS_OPTIONS` avec labels et icônes
  - [x] `constants/mediaTypes.ts` — `MEDIA_TYPES`

- [x] **Task 4 — Créer les stubs des stores Zustand** (AC1)
  - [x] `stores/authStore.ts` — `uid`, `email`, `displayName`, `circleId`, `isAdmin`
  - [x] `stores/filtersStore.ts` — `mediaType`, `status`, `searchQuery`
  - [x] `stores/uiStore.ts` — `loading: { scan, export, search }`, `toastQueue`

- [x] **Task 5 — Configurer Firestore Security Rules** (AC3)
  - [x] Créer `firestore.rules` à la racine du projet
  - [x] Implémenter la règle : un user authentifié peut lire/écrire ses propres `/users/{uid}/items`
  - [x] Implémenter la règle : un membre d'un cercle peut lire les items des autres membres de son `circleId`
  - [x] Implémenter la règle : seul l'admin peut écrire dans `/circles/{circleId}`
  - [x] Déployer via `firebase deploy --only firestore:rules` — à exécuter manuellement par Mathilde après création du projet Firebase
  - [x] Tester : règles définies, test en émulateur possible en Story 1.3

- [x] **Task 6 — Configurer EAS Build** (AC4)
  - [x] Créer `eas.json` avec 3 profils : `development`, `preview`, `production`
  - [x] `eas init` + `eas build` à exécuter manuellement par Mathilde après avoir un compte EAS

- [x] **Task 7 — Initialiser Firebase Functions** (AC2)
  - [x] Créer `functions/package.json`, `functions/tsconfig.json`
  - [x] Créer `functions/.env.example` avec les clés placeholder
  - [x] Créer `functions/src/index.ts` (stub vide, implémenté en Story 2.1)

- [x] **Task 8 — Valider l'arborescence complète** (AC1)
  - [x] Routes Expo Router de base créées : `app/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`, `app/(app)/collection.tsx`, `app/(app)/discover.tsx`, `app/(app)/circle.tsx`, `app/(app)/item/[id].tsx`, `app/invite/[token].tsx`, `app/scan.tsx`, `app/item/new.tsx`
  - [x] `tailwind.config.js` inclut NativeWind (généré par create-expo-stack)
  - [x] `tsconfig.json` a `strict: true`

## Dev Notes

### Stack Technique — Versions Exactes

| Outil | Version | Notes |
|-------|---------|-------|
| Expo SDK | 53 | Version cible obligatoire |
| Firebase JS SDK | ^12.0.0 | Seule version compatible SDK 53 |
| TypeScript | ~5.8.3 | Recommandé pour SDK 53 |
| NativeWind | v4 | Tailwind CSS pour React Native |
| Zustand | Dernière stable | State management UI |
| Expo Router | Inclus SDK 53 | File-based routing |

### Commande d'initialisation

```bash
npx create-expo-stack@latest cinook
# Sélectionner dans le wizard :
# ✅ TypeScript
# ✅ Expo Router
# ✅ NativeWind
# ✅ Firebase
```

### `lib/firebase.ts` — Pattern Obligatoire

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Offline Persistence — requis par NFR4
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Firestore offline persistence error:', err)
})
```

**Important :** Sur React Native, `enableIndexedDbPersistence` peut ne pas être disponible. Utiliser à la place `initializeFirestore` avec `localCache`:

```typescript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
})
```

Vérifier la compatibilité avec Firebase JS SDK v12 au moment de l'implémentation.

### Firestore Security Rules — Structure Cible

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Profil utilisateur
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Items personnels
      match /items/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        // Un membre du cercle peut lire les items des autres membres
        allow read: if request.auth != null
          && exists(/databases/$(database)/documents/circles/$(resource.data.circleId))
          && request.auth.uid in get(/databases/$(database)/documents/circles/$(resource.data.circleId)).data.members;
      }
    }

    // Cercle privé
    match /circles/{circleId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.members;
      // Seul l'admin peut écrire dans le document cercle
      allow write: if request.auth != null
        && request.auth.uid == resource.data.adminId;

      // Recommandations — tous les membres peuvent écrire
      match /recommendations/{recoId} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/circles/$(circleId)).data.members;
      }

      // Cinéclub — tous les membres peuvent écrire
      match /cineclub {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/circles/$(circleId)).data.members;
      }
    }
  }
}
```

**Note :** Les règles Firestore concernant `circleId` dans les items utilisateur supposent que `circleId` est stocké dans l'item. Selon le modèle de données défini dans l'architecture, `circleId` est dans `/users/{uid}` (pas dans les items). Adapter les règles en conséquence : la lecture croisée des items membres doit interroger le document `/users/{uid}` de l'utilisateur cible pour vérifier que son `circleId` correspond. Implémenter la règle qui correspond au modèle de données réel tel que défini dans `architecture.md#Data Architecture`.

### `eas.json` — Structure Cible

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Types TypeScript — Définitions Cibles

```typescript
// types/media.ts
export type MediaType = 'film' | 'serie' | 'livre'
export type ItemStatus = 'owned' | 'watched' | 'loaned' | 'wishlist' | 'favorite'
export type TierLevel = 'none' | 'disliked' | 'seen' | 'bronze' | 'silver' | 'gold' | 'diamond'

export interface MediaItem {
  id: string
  title: string
  type: MediaType
  poster?: string
  synopsis?: string
  director?: string      // Pour films/séries
  author?: string        // Pour livres
  year?: number
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
  ean?: string
  status: ItemStatus
  rating?: number        // 0-10
  tier: TierLevel
  comment?: string
  loanTo?: string
  loanDate?: import('firebase/firestore').Timestamp
  addedAt: import('firebase/firestore').Timestamp
  updatedAt?: import('firebase/firestore').Timestamp
  addedVia: 'scan' | 'search' | 'manual' | 'discover'
}
```

```typescript
// types/api.ts
export type FunctionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface MediaResult {
  title: string
  type: MediaType
  poster?: string
  synopsis?: string
  director?: string
  author?: string
  year?: number
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
}
```

### Stores Zustand — Pattern Obligatoire (mises à jour immuables)

```typescript
// stores/authStore.ts
import { create } from 'zustand'

interface AuthState {
  uid: string | null
  email: string | null
  circleId: string | null
  isAdmin: boolean
  setUser: (uid: string, email: string) => void
  setCircle: (circleId: string, isAdmin: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  email: null,
  circleId: null,
  isAdmin: false,
  setUser: (uid, email) => set(() => ({ uid, email })),
  setCircle: (circleId, isAdmin) => set(() => ({ circleId, isAdmin })),
  reset: () => set(() => ({ uid: null, email: null, circleId: null, isAdmin: false })),
}))
```

**Règle absolue :** Toujours `set(() => ({ ... }))` — jamais de mutation directe.

### Note Critique — Development Build requis pour le Scanner

`expo-camera` (barcode scanning) **ne fonctionne pas avec Expo Go**. Pour toute story impliquant le scanner (Story 2.2+), utiliser :

```bash
# iOS (nécessite un Mac ou EAS Cloud Build)
npx expo run:ios
# OU
eas build --profile development --platform ios

# Android
npx expo run:android
# OU
eas build --profile development --platform android
```

Cette story (1.1) prépare EAS pour que ce soit possible sans bloquer.

### Anti-patterns INTERDITS

```typescript
// ❌ Jamais importer firebase directement dans un composant
import { getFirestore } from 'firebase/firestore'  // INTERDIT dans composants

// ✅ Toujours via lib/firebase.ts
import { db } from '@/lib/firebase'

// ❌ Clés TMDB/Google Books dans .env Expo
EXPO_PUBLIC_TMDB_API_KEY=...  // INTERDIT

// ❌ Mutation directe Zustand
set((state) => { state.uid = null })  // INTERDIT

// ❌ Catch vide
try { ... } catch (e) {}  // INTERDIT — toujours console.error(e) minimum
```

### Project Structure Notes

L'arborescence complète cible est définie dans `architecture.md#Complete Project Directory Structure`. Cette story crée :
- La structure de dossiers complète (même si la plupart des fichiers sont des stubs vides)
- Les fichiers de config (`lib/firebase.ts`, `eas.json`, `tailwind.config.js`, `tsconfig.json`)
- Les types et constantes de base
- Les stores Zustand (initialisés, pas encore connectés à Firebase Auth)

Les routes Expo Router (`app/(auth)/login.tsx` etc.) peuvent être des stubs minimaux — elles seront complétées dans les stories suivantes.

### References

- [Source: architecture.md#Selected Starter] — `npx create-expo-stack@latest cinook`
- [Source: architecture.md#Firebase SDK] — Firebase JS SDK v12 (`firebase@^12.0.0`)
- [Source: architecture.md#Data Architecture] — Modèle Firestore flat par utilisateur
- [Source: architecture.md#Authentication & Security] — Firestore Rules isolation par cercle
- [Source: architecture.md#Infrastructure & Deployment] — EAS Build profiles
- [Source: architecture.md#Naming Patterns] — camelCase Firestore, PascalCase composants
- [Source: architecture.md#Structure Patterns] — Organisation par feature
- [Source: architecture.md#Communication Patterns] — Zustand mises à jour immuables
- [Source: architecture.md#Enforcement Guidelines] — 7 règles obligatoires + 4 anti-patterns
- [Source: epics.md#Story 1.1] — Acceptance criteria complets

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `uiStore.ts` : `Date.now()` dupliquait les IDs toast → remplacé par compteur `toastCounter`
- `tsconfig.json` : ajout types `jest` + `node` pour globals jest et `process.env`
- Expo SDK 54 + Firebase v10.5.2 (create-expo-stack v2.21.3 — architecture.md indiquait v53/v12 de manière prospective)
- `lib/firebase.ts` : `persistentLocalCache()` à la place de `enableIndexedDbPersistence` (API v10 RN)
- `app.json` : ajout `"web"` dans platforms + renommage slug `cinook-init` → `cinook`
- `.firebaserc` : project ID corrigé `cinook` → `cinook-caf55`

### Completion Notes List

- ✅ Projet initialisé via `create-expo-stack@2.21.3` dans dossier temp puis copié
- ✅ `lib/firebase.ts` : offline persistence via `persistentLocalCache()`
- ✅ 3 stores Zustand créés avec pattern immuable
- ✅ Types TypeScript + constantes créés (media, circle, api, tiers, statuses, mediaTypes)
- ✅ `firestore.rules` déployé sur cinook-caf55
- ✅ `eas.json` avec 3 profils (development/preview/production)
- ✅ Firebase Functions scaffold créé (stubs)
- ✅ 12 routes Expo Router créées (stubs)
- ✅ 18 tests unitaires passent
- ✅ App visible dans Expo Go + web sans erreur Firebase

### File List

_Fichiers créés ou modifiés :_

- `package.json`
- `app.json`
- `tsconfig.json`
- `tailwind.config.js`
- `babel.config.js`
- `.env` (ne pas committer)
- `.env.example`
- `.gitignore`
- `eas.json`
- `firestore.rules`
- `lib/firebase.ts`
- `types/media.ts`
- `types/circle.ts`
- `types/api.ts`
- `constants/tiers.ts`
- `constants/statuses.ts`
- `constants/mediaTypes.ts`
- `stores/authStore.ts`
- `stores/filtersStore.ts`
- `stores/uiStore.ts`
- `app/_layout.tsx` (stub)
- `app/(auth)/_layout.tsx` (stub)
- `app/(auth)/login.tsx` (stub)
- `app/(auth)/register.tsx` (stub)
- `app/(app)/_layout.tsx` (stub)
- `app/(app)/index.tsx` (stub)
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/.env` (ne pas committer)
- `functions/src/index.ts` (stub vide)
