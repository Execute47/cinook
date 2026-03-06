# Story 2.5 : Affichage, modification et suppression d'un item

Status: ready-for-dev

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

- [ ] **Task 1 — Implémenter `app/(app)/item/[id].tsx`** (AC1)
  - [ ] Charger l'item depuis Firestore ou depuis le cache `useCollection` par `id`
  - [ ] Afficher : affiche (Image), titre, type badge, année, synopsis, réalisateur/auteur
  - [ ] Section statut, note et tier (stubs pour Story 3.x)
  - [ ] Bouton "Modifier" → mode édition inline ou navigation vers formulaire
  - [ ] Bouton "Supprimer" avec confirmation (Alert natif)

- [ ] **Task 2 — Helpers Firestore dans lib/firestore.ts** (AC2, AC3)
  - [ ] `updateItem(uid, itemId, updates: Partial<MediaItem>)` → `updateDoc` avec `updatedAt: serverTimestamp()`
  - [ ] `deleteItem(uid, itemId)` → `deleteDoc`

- [ ] **Task 3 — Implémenter `hooks/useCollection.ts`** (AC1, AC2, AC3)
  - [ ] Listener `onSnapshot` sur `/users/{uid}/items`
  - [ ] State : `items: MediaItem[]`, `loading`, `error`
  - [ ] Cleanup `unsubscribe` dans le return de `useEffect` (OBLIGATOIRE)
  - [ ] Mapper les docs Firestore → `MediaItem` (ajouter `id: doc.id`)

- [ ] **Task 4 — Écran `app/(app)/collection.tsx`** (AC1)
  - [ ] Liste des items via `useCollection`
  - [ ] Composant `ItemCard` pour chaque item
  - [ ] Navigation vers `/(app)/item/[id]` au tap
  - [ ] EmptyState si collection vide

- [ ] **Task 5 — Composant `components/media/ItemCard.tsx`** (AC1)
  - [ ] Affiche poster, titre, type badge, statut badge
  - [ ] Layout horizontal compact

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Test `useCollection` : listener configuré avec cleanup
  - [ ] Test `updateItem` : appelle `updateDoc` avec `updatedAt`
  - [ ] Test `deleteItem` : appelle `deleteDoc`
  - [ ] Test : suppression avec confirmation → deleteItem appelé
  - [ ] Test : suppression annulée → deleteItem NON appelé

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
### Debug Log References
### Completion Notes List
### File List

- `app/(app)/item/[id].tsx` (stub → implémentation)
- `app/(app)/collection.tsx` (mise à jour)
- `hooks/useCollection.ts` (nouveau)
- `hooks/useCollection.test.ts` (nouveau)
- `lib/firestore.ts` (updateItem, deleteItem)
- `components/media/ItemCard.tsx` (nouveau)
- `components/media/ItemCard.test.tsx` (nouveau)
