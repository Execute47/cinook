# Story 6.1 : Mode hors-ligne — lecture et écriture

Status: review

## Story

En tant qu'utilisatrice,
Je veux consulter ma collection et ajouter des items même sans connexion internet,
Afin que Cinook soit toujours disponible, même en déplacement ou sans réseau.

## Acceptance Criteria

### AC1 — Lecture hors-ligne

**Given** Firebase Offline Persistence activé dans `lib/firebase.ts`
**When** l'app est ouverte sans connexion internet
**Then** ma collection complète s'affiche depuis le cache Firestore local (FR31)
**And** l'interface ne se dégrade pas — aucun écran blanc, aucun spinner infini (NFR4)

### AC2 — Écriture hors-ligne (file d'attente)

**Given** l'app en mode hors-ligne
**When** j'ajoute ou modifie un item
**Then** l'écriture est mise en file d'attente localement par le SDK Firestore (FR32)
**And** l'item apparaît immédiatement dans ma collection locale
**And** un indicateur visuel signale que la sync est en attente

### AC3 — Synchronisation à la reconnexion

**Given** une connexion rétablie après une session hors-ligne
**When** le SDK Firestore se reconnecte
**Then** toutes les écritures en attente sont synchronisées automatiquement
**And** aucune donnée n'est perdue (NFR15, NFR17)
**And** l'indicateur de sync disparaît

### AC4 — Conflit last-write-wins

**Given** un conflit d'écriture (même item modifié en ligne et hors-ligne)
**When** la sync s'effectue
**Then** la règle last-write-wins de Firestore s'applique (comportement documenté, NFR15)

## Tasks / Subtasks

- [x] **Task 1 — Vérifier la configuration Offline Persistence** (AC1)
  - [x] `persistentLocalCache()` n'était PAS actif — corrigé : `initializeFirestore(app, { localCache: persistentLocalCache() })` avec fallback `getFirestore`
  - [x] `lib/firebase.ts` mis à jour (natif) ; `lib/firebase.web.ts` garde `getFirestore` (persistence web non requise)

- [x] **Task 2 — Indicateur de sync dans `uiStore`** (AC2, AC3)
  - [x] `syncPending: boolean` ajouté (initialisé à `false`)
  - [x] `setSyncPending(value: boolean)` exposé dans le store

- [x] **Task 3 — Composant `components/ui/SyncIndicator.tsx`** (AC2, AC3)
  - [x] Bannière discrète "Synchronisation en attente…" si `syncPending`
  - [x] Disparaît automatiquement (`syncPending = false`)
  - [x] Intégré dans `app/(app)/_layout.tsx`

- [x] **Task 4 — Détection réseau avec `@react-native-community/netinfo`** (AC2)
  - [x] `@react-native-community/netinfo` installé
  - [x] `hooks/useNetworkStatus.ts` : NetInfo → `setSyncPending(true)` hors-ligne, `onSnapshotsInSync` → `setSyncPending(false)` à la sync
  - [x] Utilisé dans `app/(app)/_layout.tsx`

- [x] **Task 5 — Tests** (tous ACs)
  - [x] `uiStore` : `syncPending` initialisé à false, `setSyncPending` fonctionne
  - [x] `useNetworkStatus` : réseau déconnecté → `setSyncPending(true)`
  - [x] `useNetworkStatus` : `onSnapshotsInSync` → `setSyncPending(false)`
  - [x] `useNetworkStatus` : listeners unsubscribés au démontage

## Dev Notes

### Firebase Offline Persistence (déjà configuré)

```typescript
// lib/firebase.ts — déjà en place depuis Story 1.1
db = initializeFirestore(app, { localCache: persistentLocalCache() })
```

Le SDK Firestore gère automatiquement la file d'attente d'écritures hors-ligne. Aucune logique custom n'est nécessaire pour la synchronisation — elle est transparente.

### Détection de l'état de synchronisation

```typescript
import { onSnapshotsInSync } from 'firebase/firestore'

// Appelé quand tous les snapshots locaux sont en sync avec le serveur
const unsub = onSnapshotsInSync(db, () => {
  setSyncPending(false)
})
```

### Détection réseau

```typescript
import NetInfo from '@react-native-community/netinfo'

NetInfo.addEventListener(state => {
  if (!state.isConnected) setSyncPending(true)
})
```

### Comportement last-write-wins

Firestore utilise last-write-wins au niveau des champs lors de la résolution de conflits hors-ligne. Ce comportement est documenté et considéré acceptable pour Cinook (NFR15).

### References

- [Source: epics.md#Story 6.1]
- [Source: architecture.md#Offline & Sync] — Firebase Offline Persistence
- [Source: story 1-1] — lib/firebase.ts (persistentLocalCache déjà configuré)
- [Source: story 2-2] — addItem (écritures Firestore)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `lib/firebase.ts` utilisait `getFirestore` sans `persistentLocalCache` — corrigé avec `initializeFirestore` + fallback `getFirestore` (même pattern que auth). Les mocks de test étaient déjà prêts (`initializeFirestore`, `persistentLocalCache` mockés).

### Completion Notes List
- `lib/firebase.ts` : offline persistence activée via `initializeFirestore(app, { localCache: persistentLocalCache() })`.
- `stores/uiStore.ts` : `syncPending: boolean` + `setSyncPending(value)` ajoutés.
- `hooks/useNetworkStatus.ts` : combine NetInfo (offline → `syncPending: true`) et `onSnapshotsInSync` (sync terminée → `syncPending: false`). Cleanup au démontage.
- `components/ui/SyncIndicator.tsx` : bannière discrète visible seulement si `syncPending`.
- `app/(app)/_layout.tsx` : `useNetworkStatus()` appelé + `<SyncIndicator />` rendu au-dessus des Tabs.
- 6 nouveaux tests (2 uiStore + 4 useNetworkStatus), 255 tests passent au total.

### File List

- `lib/firebase.ts` (modifié — `initializeFirestore` + `persistentLocalCache`)
- `stores/uiStore.ts` (modifié — `syncPending`, `setSyncPending`)
- `stores/uiStore.test.ts` (modifié — 2 tests syncPending)
- `hooks/useNetworkStatus.ts` (nouveau)
- `hooks/useNetworkStatus.test.ts` (nouveau — 4 tests)
- `components/ui/SyncIndicator.tsx` (nouveau)
- `app/(app)/_layout.tsx` (modifié — intégration SyncIndicator + useNetworkStatus)
- `package.json` (modifié — @react-native-community/netinfo)
- `package-lock.json` (modifié)
