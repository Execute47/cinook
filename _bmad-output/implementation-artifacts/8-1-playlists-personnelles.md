# Story 8.1 : Playlists personnelles

Status: review

## Story

En tant qu'utilisatrice,
je veux créer des playlists nommées regroupant des items de ma collection,
afin d'organiser mes films et livres par thème ("films d'horreur", "à regarder ce soir", etc.).

## Acceptance Criteria

1. L'utilisatrice peut créer une playlist en lui donnant un nom (ex: "Films d'horreur").
2. L'utilisatrice peut voir la liste de toutes ses playlists sur un écran dédié.
3. L'utilisatrice peut ouvrir une playlist et voir les items qui la composent (même rendu que `ItemCard`).
4. L'utilisatrice peut ajouter un item à une ou plusieurs playlists depuis la fiche de l'item (`item/[id].tsx`).
5. L'utilisatrice peut retirer un item d'une playlist depuis la fiche de l'item ou depuis la vue playlist.
6. L'utilisatrice peut supprimer une playlist entière (les items de la collection ne sont pas supprimés).
7. L'utilisatrice peut renommer une playlist.
8. Si une playlist est vide, un état vide est affiché (pas d'écran blanc).
9. Les playlists sont personnelles — non partagées avec le cercle (V1).
10. Les playlists fonctionnent hors-ligne (Firestore offline persistence, même pattern que `useCollection`).

## Tasks / Subtasks

- [ ] Task 1 — Structure Firestore & types (AC: 1, 9, 10)
  - [ ] Créer `types/playlist.ts` avec `Playlist` et `PlaylistItem`
  - [ ] Créer `lib/playlists.ts` : `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addItemToPlaylist`, `removeItemFromPlaylist`
  - [ ] Mettre à jour `firestore.rules` : ajouter règle read/write sur `/users/{userId}/playlists/{playlistId}`

- [ ] Task 2 — Hook `usePlaylists` (AC: 2, 10)
  - [ ] Créer `hooks/usePlaylists.ts` : `onSnapshot` sur `/users/{uid}/playlists` — même pattern que `useCollection.ts`
  - [ ] Retourner `{ playlists, loading, error }`

- [ ] Task 3 — Écran liste des playlists (AC: 1, 2, 6, 7, 8)
  - [ ] Créer `app/(app)/playlists.tsx`
  - [ ] Bouton "Nouvelle playlist" → bottom sheet ou modal de saisie du nom
  - [ ] Liste des playlists avec nom, nombre d'items, tap → navigation vers `playlist/[id]`
  - [ ] Swipe ou bouton contextuel : renommer / supprimer
  - [ ] État vide si aucune playlist

- [ ] Task 4 — Écran détail d'une playlist (AC: 3, 5, 8)
  - [ ] Créer `app/(app)/playlist/[id].tsx`
  - [ ] Charger les items de la collection (`useCollection`) et filtrer par `playlist.itemIds`
  - [ ] Afficher les items avec `ItemCard` + tap → `item/[id]`
  - [ ] Bouton retirer l'item de la playlist (icône ×)
  - [ ] État vide si playlist sans items

- [ ] Task 5 — Ajout/retrait depuis la fiche item (AC: 4, 5)
  - [ ] Dans `app/(app)/item/[id].tsx`, ajouter un bouton/section "Playlists"
  - [ ] Afficher la liste des playlists de l'utilisatrice avec une checkbox pour chaque
  - [ ] Cocher = `addItemToPlaylist`, décocher = `removeItemFromPlaylist`

- [ ] Task 6 — Navigation (AC: 2)
  - [ ] Ajouter un bouton "Playlists" dans le header de `collection.tsx` (icône `list`) → `router.push('/(app)/playlists')`
  - [ ] Ajouter `<Tabs.Screen name="playlists" options={{ href: null }} />` dans `_layout.tsx`
  - [ ] Ajouter `<Tabs.Screen name="playlist/[id]" options={{ href: null }} />` dans `_layout.tsx`

## Dev Notes

### Structure Firestore

```
/users/{userId}/playlists/{playlistId}
  name: string
  itemIds: string[]       // IDs des items dans users/{userId}/items/ — pas de duplication des métadonnées
  createdAt: Timestamp
  updatedAt?: Timestamp
```

**Choix `itemIds[]` sur le document** (vs sous-collection) : cohérent avec l'architecture plate du projet. Les playlists contiendront << 1000 items. Limite Firestore : 1 MB/document → pas un problème à cette échelle.

**Résolution des items dans la vue playlist** : les items sont déjà chargés en mémoire via `useCollection()` — filtrer localement par `playlist.itemIds` sans appel Firestore supplémentaire.

### Types — `types/playlist.ts`

```typescript
import type { Timestamp } from 'firebase/firestore'

export interface Playlist {
  id: string
  name: string
  itemIds: string[]
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

### `lib/playlists.ts` — fonctions CRUD

```typescript
import { collection, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function createPlaylist(uid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'playlists'), {
    name, itemIds: [], createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePlaylist(uid: string, playlistId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), { name, updatedAt: serverTimestamp() })
}

export async function deletePlaylist(uid: string, playlistId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId))
}

export async function addItemToPlaylist(uid: string, playlistId: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
    itemIds: arrayUnion(itemId), updatedAt: serverTimestamp(),
  })
}

export async function removeItemFromPlaylist(uid: string, playlistId: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
    itemIds: arrayRemove(itemId), updatedAt: serverTimestamp(),
  })
}
```

### `hooks/usePlaylists.ts` — même pattern que `useCollection`

```typescript
import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { Playlist } from '@/types/playlist'

export function usePlaylists() {
  const uid = useAuthStore((s) => s.uid)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) { setPlaylists([]); setLoading(false); return }
    const q = query(collection(db, 'users', uid, 'playlists'), orderBy('createdAt', 'desc'))
    return onSnapshot(q,
      (snap) => { setPlaylists(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist))); setLoading(false) },
      (err) => { setError(err.message); setLoading(false) }
    )
  }, [uid])

  return { playlists, loading, error }
}
```

### Règle Firestore à ajouter dans `firestore.rules`

```javascript
// À ajouter dans le bloc match /users/{userId} { ... }
match /playlists/{playlistId} {
  allow read, write: if isOwner(userId);
}
```

### Navigation — accès depuis la Collection

```tsx
// collection.tsx — header, ajouter bouton Playlists à droite
<TouchableOpacity onPress={() => router.push('/(app)/playlists')} className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg">
  <Ionicons name="list" size={20} color="#FFFFFF" />
</TouchableOpacity>
```

```tsx
// _layout.tsx — ajouter avec les autres routes cachées (lignes 63-65)
<Tabs.Screen name="playlists" options={{ href: null }} />
<Tabs.Screen name="playlist/[id]" options={{ href: null }} />
```

### Résolution des items dans la vue playlist

```tsx
// app/(app)/playlist/[id].tsx
const { items } = useCollection()   // déjà chargé, pas de requête supplémentaire
const playlistItems = items.filter(item => playlist.itemIds.includes(item.id))
```

### Section Playlists dans la fiche item

Ajouter une section après "Mon avis" dans `app/(app)/item/[id].tsx` :

```tsx
// Charger les playlists de l'utilisatrice
const { playlists } = usePlaylists()

// Rendu — section playlists
<View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
  <Text className="text-white font-semibold mb-3">Playlists</Text>
  {playlists.map(playlist => {
    const isIn = playlist.itemIds.includes(item.id)
    return (
      <TouchableOpacity key={playlist.id} onPress={() => isIn
        ? removeItemFromPlaylist(uid!, playlist.id, item.id)
        : addItemToPlaylist(uid!, playlist.id, item.id)
      } className="flex-row items-center justify-between py-2 border-b border-[#2A2020]">
        <Text className="text-white">{playlist.name}</Text>
        <Ionicons name={isIn ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={isIn ? '#FBBF24' : '#6B5E5E'} />
      </TouchableOpacity>
    )
  })}
  {playlists.length === 0 && (
    <TouchableOpacity onPress={() => router.push('/(app)/playlists')}>
      <Text className="text-[#6B5E5E] text-sm">Créer une playlist →</Text>
    </TouchableOpacity>
  )}
</View>
```

### Fichiers impactés

| Fichier | Action |
|---|---|
| `types/playlist.ts` | Créer |
| `lib/playlists.ts` | Créer |
| `hooks/usePlaylists.ts` | Créer |
| `app/(app)/playlists.tsx` | Créer |
| `app/(app)/playlist/[id].tsx` | Créer |
| `app/(app)/_layout.tsx` | Ajouter 2 `Tabs.Screen href: null` |
| `app/(app)/collection.tsx` | Ajouter bouton "Playlists" dans le header |
| `app/(app)/item/[id].tsx` | Ajouter section "Playlists" |
| `firestore.rules` | Ajouter règle `/playlists/{playlistId}` |

### Patterns de référence dans le projet

- **`useCollection.ts`** → patron exact pour `usePlaylists.ts` (onSnapshot, orderBy, même structure)
- **`lib/firestore.ts`** → patron pour `lib/playlists.ts` (addDoc, updateDoc, deleteDoc)
- **`lib/circle.ts`** → exemples d'`arrayUnion` / `arrayRemove` (fonctions `addItemToPlaylist`, `removeItemFromPlaylist`)
- **`components/media/ItemCard.tsx`** → réutiliser tel quel dans la vue playlist
- **`app/(app)/_layout.tsx` lignes 63-65** → patron pour masquer les routes playlists de la tab bar
- **`app/(app)/item/[id].tsx` section "Mon avis"** → patron pour la nouvelle section "Playlists"

### Project Structure Notes

- `types/playlist.ts` — nouveau fichier, cohérent avec `types/media.ts`
- `lib/playlists.ts` — cohérent avec `lib/firestore.ts` et `lib/circle.ts`
- `hooks/usePlaylists.ts` — cohérent avec `hooks/useCollection.ts`
- Routes `app/(app)/playlists.tsx` et `app/(app)/playlist/[id].tsx` — cohérentes avec le routing Expo Router existant (`member/[uid]`, `item/[id]`)

### References

- Pattern `onSnapshot` : `hooks/useCollection.ts`
- Pattern `arrayUnion/arrayRemove` : `lib/circle.ts` lignes 53-55
- Pattern route masquée : `app/(app)/_layout.tsx` lignes 63-65
- Règles Firestore existantes : `firestore.rules` bloc `/users/{userId}`
- `ItemCard` réutilisable : `components/media/ItemCard.tsx`
- Architecture Firestore (flat model) : `_bmad-output/planning-artifacts/architecture.md` section "Data Architecture"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
