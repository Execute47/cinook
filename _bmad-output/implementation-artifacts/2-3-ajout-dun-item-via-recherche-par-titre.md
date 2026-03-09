# Story 2.3 : Ajout d'un item via recherche par titre

Status: done

## Story

En tant qu'utilisatrice,
Je veux rechercher un film, une série ou un livre par son titre,
Afin d'ajouter un item à ma collection même sans code-barres disponible.

## Acceptance Criteria

### AC1 — Recherche et affichage des résultats

**Given** l'écran de recherche avec sélecteur de type (film / série / livre)
**When** je saisis au moins 2 caractères et lance la recherche
**Then** `useMediaSearch.ts` appelle `searchMedia(query, type)` via `lib/functions.ts`
**And** les résultats s'affichent avec titre, affiche et année

### AC2 — Sélection et ajout

**Given** des résultats affichés
**When** je sélectionne un item
**Then** la fiche est auto-remplie depuis TMDB ou Google Books
**And** je peux confirmer l'ajout qui enregistre l'item avec `addedVia: 'search'`

### AC3 — Aucun résultat

**Given** aucun résultat trouvé
**When** la recherche ne retourne rien
**Then** un message "Aucun résultat — créer manuellement ?" s'affiche avec un lien vers `app/item/new.tsx`

## Tasks / Subtasks

- [x] **Task 1 — Implémenter `hooks/useMediaSearch.ts`** (AC1, AC3)
  - [x] State : `results: MediaResult[]`, `isLoading`, `error: string | null`, `query`, `mediaType`
  - [x] Debounce 400ms sur la saisie avant appel
  - [x] Appeler `searchMedia({ query, type })` quand query >= 2 caractères
  - [x] Si `success: false` → stocker error, afficher toast
  - [x] `setUIStore loading.search` pendant la requête

- [x] **Task 2 — Créer `app/item/search.tsx`** (AC1, AC2, AC3)
  - [x] TextInput de recherche + sélecteur type (`film | serie | livre`)
  - [x] Liste des résultats avec SearchResultCard (titre, affiche, année)
  - [x] Sélection → afficher fiche complète avec bouton "Ajouter"
  - [x] Bouton "Ajouter" → `addItem(uid, { ...result, status: 'owned', tier: 'none', addedVia: 'search' })`
  - [x] EmptyState si aucun résultat
  - [x] Lien "Créer manuellement" → `router.push('/item/new')`

- [x] **Task 3 — Composant `components/media/SearchResultCard.tsx`** (AC1)
  - [x] Affiche : poster (si disponible), titre, année, type badge
  - [x] Taille compacte pour une liste

- [x] **Task 4 — Bouton scan → search dans collection.tsx** (AC1)
  - [x] Boutons "Rechercher" et "Scanner" sur `collection.tsx`

- [x] **Task 5 — Tests** (tous ACs)
  - [x] Test `useMediaSearch` : query < 2 chars → pas d'appel
  - [x] Test `useMediaSearch` : query >= 2 chars → `searchMedia` appelé après debounce
  - [x] Test `useMediaSearch` : success: false → error stocké
  - [x] Test `useMediaSearch` : reset() → état remis à zéro

## Dev Notes

### useMediaSearch — pattern debounce

```typescript
useEffect(() => {
  if (query.length < 2) { setResults([]); return }
  const timer = setTimeout(async () => {
    setIsLoading(true)
    const res = await searchMedia({ query, type: mediaType })
    if (res.success) setResults(res.data)
    else { setError(res.error); useUIStore.getState().addToast(res.error, 'error') }
    setIsLoading(false)
  }, 400)
  return () => clearTimeout(timer)
}, [query, mediaType])
```

### addItem avec valeurs par défaut

```typescript
await addItem(uid, {
  title: result.title,
  type: result.type,
  poster: result.poster,
  synopsis: result.synopsis,
  director: result.director,
  author: result.author,
  year: result.year,
  tmdbId: result.tmdbId,
  googleBooksId: result.googleBooksId,
  status: 'owned',
  tier: 'none',
  addedVia: 'search',
})
```

### References

- [Source: epics.md#Story 2.3]
- [Source: architecture.md#API & Communication Patterns] — useMediaSearch hook
- [Source: story 2-1] — lib/functions.ts searchMedia
- [Source: story 2-2] — addItem dans lib/firestore.ts

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Référence `lib/functions.ts` dans la story → mis à jour vers `lib/mediaSearch.ts` (migration 2.1)

### Completion Notes List
- `hooks/useMediaSearch.ts` : debounce 400ms, setLoading UIStore, reset()
- `components/media/SearchResultCard.tsx` : poster, titre, année, badge type
- `app/item/search.tsx` : sélecteur film/série/livre, liste résultats, fiche détail, ajout Firestore, empty state
- `app/(app)/collection.tsx` : remplacé bouton temporaire scan par boutons Rechercher + Scanner
- 5 tests `useMediaSearch` — 73/73 suite complète, zéro régression

### File List

- `app/item/search.tsx` (nouveau)
- `hooks/useMediaSearch.ts` (nouveau)
- `hooks/useMediaSearch.test.ts` (nouveau)
- `components/media/SearchResultCard.tsx` (nouveau)
- `app/(app)/collection.tsx` (boutons Rechercher + Scanner)
