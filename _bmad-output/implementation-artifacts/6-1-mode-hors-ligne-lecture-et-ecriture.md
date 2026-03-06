# Story 6.1 : Mode hors-ligne — lecture et écriture

Status: ready-for-dev

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

- [ ] **Task 1 — Vérifier la configuration Offline Persistence** (AC1)
  - [ ] Confirmer que `persistentLocalCache()` est bien actif dans `lib/firebase.ts`
  - [ ] Tester que la collection s'affiche depuis le cache sans réseau

- [ ] **Task 2 — Indicateur de sync dans `uiStore`** (AC2, AC3)
  - [ ] Ajouter `syncPending: boolean` dans `uiStore`
  - [ ] Utiliser `onSnapshotsInSync` ou listener réseau pour détecter l'état de sync
  - [ ] Exposer `setSyncPending(value: boolean)` dans le store

- [ ] **Task 3 — Composant `components/ui/SyncIndicator.tsx`** (AC2, AC3)
  - [ ] Afficher une bannière discrète ("Synchronisation en attente…") si `syncPending`
  - [ ] Disparaître automatiquement quand la sync est complète
  - [ ] Intégrer dans `app/(app)/_layout.tsx`

- [ ] **Task 4 — Détection réseau avec `@react-native-community/netinfo`** (AC2)
  - [ ] Installer `@react-native-community/netinfo`
  - [ ] Hook `useNetworkStatus` → `isConnected: boolean`
  - [ ] Mettre à jour `syncPending` selon l'état réseau + écritures locales

- [ ] **Task 5 — Tests** (tous ACs)
  - [ ] Test : collection affichée depuis le cache quand Firestore inaccessible
  - [ ] Test : ajout hors-ligne → `syncPending: true`
  - [ ] Test : reconnexion → `syncPending: false`

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
### Debug Log References
### Completion Notes List
### File List

- `stores/uiStore.ts` (ajout syncPending)
- `hooks/useNetworkStatus.ts` (nouveau)
- `components/ui/SyncIndicator.tsx` (nouveau)
- `app/(app)/_layout.tsx` (intégration SyncIndicator)
