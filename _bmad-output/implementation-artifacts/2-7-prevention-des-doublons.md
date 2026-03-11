# Story 2.7 : Prévention des doublons

Status: ready-for-review

## Story

En tant qu'utilisatrice,
Je veux être avertie quand j'essaie d'ajouter un item déjà présent dans ma collection,
Afin d'éviter les doublons et retrouver facilement la fiche existante.

## Acceptance Criteria

### AC1 — Détection sur la recherche par titre

**Given** l'écran de recherche (`app/item/search.tsx`), une fiche sélectionnée
**When** l'item correspond à un élément déjà dans ma collection (voir règles de matching AC5)
**Then** le bouton "Ajouter à ma collection" est remplacé par un badge "Déjà dans votre collection"
**And** un bouton "Voir la fiche" permet d'accéder directement à l'item existant via `router.push('/item/[id]')`
**And** aucun ajout n'est possible tant que le doublon est détecté

### AC2 — Détection sur le scan de code-barres

**Given** l'écran de scan (`app/scan.tsx`), un résultat de scan affiché
**When** l'item scanné correspond à un élément déjà dans ma collection
**Then** un message "Déjà dans votre collection" s'affiche à la place du bouton "Ajouter"
**And** un bouton "Voir la fiche" permet d'accéder à l'item existant
**And** le bouton "Ajouter" n'est pas affiché

### AC3 — Détection sur la création manuelle

**Given** l'écran de création manuelle (`app/item/new.tsx`), un titre saisi
**When** un item avec le même titre (insensible à la casse) et le même type existe déjà
**Then** un avertissement apparaît sous le champ titre : "Un item similaire existe déjà dans votre collection."
**And** un lien "Voir la fiche" est affiché sous l'avertissement
**And** l'ajout reste possible (l'utilisatrice peut ignorer l'avertissement — les créations manuelles sont moins précises)

> **Justification :** pour les fiches manuelles, un doublon de titre peut être légitime (ex. deux éditions d'un livre). On avertit sans bloquer.

### AC4 — Détection sur "Ajouter à À voir" (accueil)

**Given** la bannière Cinéclub ou une carte de recommandation sur l'écran d'accueil
**When** je tape "+ À voir" et l'item est déjà dans ma collection
**Then** l'ajout est silencieusement ignoré
**And** un message bref s'affiche : "Déjà dans votre collection" (toast ou texte inline temporaire)
**And** aucun doublon n'est créé en Firestore

### AC5 — Règles de matching (par ordre de priorité)

| Priorité | Condition | Champs comparés |
|----------|-----------|-----------------|
| 1 | Item TMDB | `tmdbId` identique (non nul) |
| 2 | Livre Google Books | `googleBooksId` identique (non nul) |
| 3 | Livre scanné | `isbn` identique (non nul) |
| 4 | Fallback | `title` (trim, lowercase) + `type` identiques |

La vérification s'arrête à la première correspondance trouvée.

## Tasks / Subtasks

- [x] **Task 1 — Helper `lib/duplicates.ts`** (AC1–AC5)
  - [x] `findDuplicate(items: MediaItem[], candidate: DuplicateCandidate): MediaItem | undefined`
  - [x] Type `DuplicateCandidate = { title: string; type: MediaType; tmdbId?: string; googleBooksId?: string; isbn?: string }`
  - [x] Appliquer les 4 règles de matching dans l'ordre (retourner dès la première correspondance)
  - [x] Comparaison titre : `a.trim().toLowerCase() === b.trim().toLowerCase()`

- [x] **Task 2 — Mise à jour `app/item/search.tsx`** (AC1)
  - [x] Importer `useCollection` et `findDuplicate`
  - [x] Dans la vue détail (item sélectionné) : calculer `existingItem = findDuplicate(items, selected)`
  - [x] Si `existingItem` → remplacer le bouton "Ajouter" par badge + bouton "Voir la fiche"
  - [x] Bouton "Voir la fiche" → `router.push('/(app)/item/' + existingItem.id)`

- [x] **Task 3 — Mise à jour `app/scan.tsx`** (AC2)
  - [x] Importer `useCollection` et `findDuplicate`
  - [x] Dans la vue résultat de scan : calculer `existingItem = findDuplicate(items, result)`
  - [x] Si `existingItem` → masquer le bouton "Ajouter", afficher message + "Voir la fiche"

- [x] **Task 4 — Mise à jour `app/item/new.tsx`** (AC3)
  - [x] Importer `useCollection` et `findDuplicate`
  - [x] Recalculer `existingItem = findDuplicate(items, { title, type: mediaType })` à chaque changement de titre ou de type
  - [x] Afficher l'avertissement inline sous le champ titre si `existingItem` trouvé
  - [x] Le bouton "Créer" reste actif (avertissement non bloquant)

- [x] **Task 5 — Mise à jour `app/(app)/index.tsx`** (AC4)
  - [x] Importer `useCollection` et `findDuplicate`
  - [x] Dans `handleAddCineclubToWishlist` : vérifier avant `addItem`, ignorer si doublon, afficher message bref
  - [x] Dans `handleAddRecoToWishlist` : même vérification

- [x] **Task 6 — Tests** (AC1–AC5)
  - [x] `findDuplicate` : priorité tmdbId — item avec tmdbId identique → retourné
  - [x] `findDuplicate` : priorité googleBooksId — match sur googleBooksId
  - [x] `findDuplicate` : priorité isbn — match sur isbn
  - [x] `findDuplicate` : fallback titre+type — "Le Seigneur des Anneaux" (casse différente) + type 'livre' → match
  - [x] `findDuplicate` : même titre mais types différents → pas de match
  - [x] `findDuplicate` : tmdbId null vs tmdbId null → ne pas matcher sur null
  - [x] search.tsx : doublon détecté → bouton "Ajouter" absent, "Voir la fiche" présent
  - [x] search.tsx : pas de doublon → comportement inchangé
  - [x] new.tsx : doublon titre+type → avertissement visible mais bouton "Créer" actif

## Dev Notes

### Helper findDuplicate

```typescript
// lib/duplicates.ts
import type { MediaItem, MediaType } from '@/types/media'

export interface DuplicateCandidate {
  title: string
  type: MediaType
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
}

export function findDuplicate(
  items: MediaItem[],
  candidate: DuplicateCandidate
): MediaItem | undefined {
  // Règle 1 : tmdbId
  if (candidate.tmdbId) {
    const match = items.find(i => i.tmdbId === candidate.tmdbId)
    if (match) return match
  }
  // Règle 2 : googleBooksId
  if (candidate.googleBooksId) {
    const match = items.find(i => i.googleBooksId === candidate.googleBooksId)
    if (match) return match
  }
  // Règle 3 : isbn
  if (candidate.isbn) {
    const match = items.find(i => i.isbn === candidate.isbn)
    if (match) return match
  }
  // Règle 4 : titre + type (fallback)
  const normalizedTitle = candidate.title.trim().toLowerCase()
  return items.find(
    i => i.type === candidate.type && i.title.trim().toLowerCase() === normalizedTitle
  )
}
```

### Affichage badge doublon (search.tsx et scan.tsx)

```tsx
{existingItem ? (
  <View className="items-center gap-3">
    <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-2">
      <Text className="text-[#6B5E5E] text-sm text-center">Déjà dans votre collection</Text>
    </View>
    <TouchableOpacity
      onPress={() => router.push(`/(app)/item/${existingItem.id}`)}
      className="bg-amber-500 py-4 rounded-xl w-full"
    >
      <Text className="text-black font-bold text-center">Voir la fiche</Text>
    </TouchableOpacity>
  </View>
) : (
  <TouchableOpacity onPress={handleAdd} /* ... */ >
    <Text>Ajouter à ma collection</Text>
  </TouchableOpacity>
)}
```

### Avertissement inline (new.tsx)

```tsx
{existingItem && (
  <View className="mb-3">
    <Text className="text-amber-400 text-xs">
      Un item similaire existe déjà dans votre collection.{' '}
    </Text>
    <TouchableOpacity onPress={() => router.push(`/(app)/item/${existingItem.id}`)}>
      <Text className="text-amber-400 text-xs underline">Voir la fiche</Text>
    </TouchableOpacity>
  </View>
)}
```

### Important : ne pas matcher sur les identifiants null/undefined

`items.find(i => i.tmdbId === candidate.tmdbId)` matcherait deux items sans tmdbId (`undefined === undefined`). La garde `if (candidate.tmdbId)` empêche ce faux positif.

### References

- [Source: app/item/search.tsx] — handleAdd, vue détail selected
- [Source: app/scan.tsx] — handleAdd, vue résultat scan
- [Source: app/item/new.tsx] — handleAdd, champs titre + type
- [Source: app/(app)/index.tsx] — handleAddRecoToWishlist, handleAddCineclubToWishlist
- [Source: hooks/useCollection.ts] — items[], source de vérité pour la détection
- [Source: types/media.ts] — MediaItem, MediaType

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun bug rencontré. Implémentation conforme aux Dev Notes.

### Completion Notes List
- `findDuplicate` implémenté exactement selon les 4 règles de matching (AC5) avec garde sur null/undefined
- `search.tsx` : badge + bouton "Voir la fiche" remplace le bouton "Ajouter" en cas de doublon (AC1)
- `scan.tsx` : même pattern que search.tsx (AC2)
- `new.tsx` : avertissement inline non-bloquant sous le champ titre, recalculé à chaque changement (AC3)
- `index.tsx` : garde silencieuse + toast temporaire 3s dans handleAddRecoToWishlist et handleAddCineclubToWishlist (AC4)
- Suite complète : 170/170 tests passent

### File List

- `lib/duplicates.ts` (nouveau)
- `lib/duplicates.test.ts` (nouveau)
- `app/item/search.tsx` (modification — détection doublon + badge)
- `app/scan.tsx` (modification — détection doublon + badge)
- `app/item/new.tsx` (modification — avertissement inline)
- `app/(app)/index.tsx` (modification — garde avant addItem)
