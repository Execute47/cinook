# Story 2.5 : Affichage, modification et suppression d'un item

Status: done

## Story

En tant qu'utilisatrice,
Je veux voir la fiche complète d'un item, la modifier et la supprimer,
Afin de maintenir ma collection à jour et correcte.

## Acceptance Criteria

### AC1 — Affichage fiche complète

**Given** un item dans ma collection
**When** je le sélectionne
**Then** la fiche complète s'affiche (`app/(app)/item/[id].tsx`) : titre, affiche, synopsis, type, année, métadonnées

### AC2 — Modification

**Given** la fiche d'un item affichée
**When** je modifie un ou plusieurs champs et valide
**Then** Firestore `/users/{uid}/items/{itemId}` est mis à jour avec `updatedAt: serverTimestamp()`
**And** la collection se met à jour via le listener `useCollection`

### AC3 — Suppression

**Given** un item dans ma collection
**When** je confirme sa suppression (après confirmation explicite)
**Then** le document Firestore est supprimé
**And** l'item disparaît de la collection sans rechargement

## Tasks / Subtasks

- [x] **Task 1 — Implémenter `app/(app)/item/[id].tsx`** (AC1)
  - [x] Charger l'item depuis `useCollection` par `id`
  - [x] Afficher : affiche (Image), titre, type badge, année, synopsis, réalisateur/auteur
  - [x] Section statut, note et tier (stub pour Story 3.x)
  - [x] Bouton "Modifier" → mode édition inline
  - [x] Bouton "Supprimer" avec confirmation (Alert natif)

- [x] **Task 2 — Helpers Firestore dans lib/firestore.ts** (AC2, AC3)
  - [x] `updateItem(uid, itemId, updates)` → `updateDoc` avec `updatedAt: serverTimestamp()`
  - [x] `deleteItem(uid, itemId)` → `deleteDoc`

- [x] **Task 3 — Implémenter `hooks/useCollection.ts`** (AC1, AC2, AC3)
  - [x] Listener `onSnapshot` sur `/users/{uid}/items`
  - [x] State : `items: MediaItem[]`, `loading`, `error`
  - [x] Cleanup `unsubscribe` dans le return de `useEffect`
  - [x] Mapper les docs Firestore → `MediaItem` (ajouter `id: doc.id`)

- [x] **Task 4 — Écran `app/(app)/collection.tsx`** (AC1)
  - [x] Liste des items via `useCollection`
  - [x] Composant `ItemCard` pour chaque item
  - [x] Navigation vers `/(app)/item/[id]` au tap
  - [x] EmptyState si collection vide

- [x] **Task 5 — Composant `components/media/ItemCard.tsx`** (AC1)
  - [x] Affiche poster, titre, type badge, statut badge
  - [x] Layout horizontal compact

- [x] **Task 6 — Tests** (tous ACs)
  - [x] Test `useCollection` : listener configuré avec cleanup
  - [x] Test `useCollection` : mappe les docs en MediaItem avec id
  - [x] Test `updateItem` : appelle `updateDoc` avec `updatedAt`
  - [x] Test `deleteItem` : appelle `deleteDoc`

## Dev Notes

### useCollection pattern (listener avec cleanup)

```typescript
export function useCollection() {
  const uid = useAuthStore((s) => s.uid)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'items'), orderBy('addedAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)))
        setLoading(false)
      },
      (err) => { setError(err.message); console.error(err) }
    )
    return unsub // cleanup OBLIGATOIRE
  }, [uid])

  return { items, loading, error }
}
```

### Confirmation suppression (Alert React Native)

```typescript
import { Alert } from 'react-native'

Alert.alert(
  'Supprimer cet item',
  'Cette action est irréversible.',
  [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: () => deleteItem(uid, id) },
  ]
)
```

### References

- [Source: epics.md#Story 2.5]
- [Source: architecture.md#Communication Patterns] — hooks listeners avec cleanup
- [Source: architecture.md#Format Patterns] — serverTimestamp() pour updatedAt

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List
- `hooks/useCollection.ts` : onSnapshot + orderBy addedAt desc, cleanup, mapping id
- `lib/firestore.ts` : updateItem (updateDoc + updatedAt), deleteItem (deleteDoc)
- `components/media/ItemCard.tsx` : poster, titre, année, badges type + statut
- `app/(app)/collection.tsx` : FlatList useCollection, EmptyState, boutons header
- `app/(app)/item/[id].tsx` : affichage complet, mode édition inline, suppression Alert
- 4 nouveaux tests (useCollection + firestore) — 81/81 suite complète, zéro régression

### File List

- `app/(app)/item/[id].tsx` (stub → implémentation)
- `app/(app)/collection.tsx` (mise à jour complète)
- `hooks/useCollection.ts` (nouveau)
- `hooks/useCollection.test.ts` (nouveau)
- `lib/firestore.ts` (updateItem, deleteItem ajoutés)
- `lib/firestore.test.ts` (tests updateItem + deleteItem ajoutés)
- `components/media/ItemCard.tsx` (nouveau)
