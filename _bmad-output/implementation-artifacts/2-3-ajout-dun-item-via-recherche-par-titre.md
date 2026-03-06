# Story 2.3 : Ajout d'un item via recherche par titre

Status: ready-for-dev

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

- [ ] **Task 1 — Implémenter `hooks/useMediaSearch.ts`** (AC1, AC3)
  - [ ] State : `results: MediaResult[]`, `isLoading`, `error: string | null`, `query`, `mediaType`
  - [ ] Debounce 400ms sur la saisie avant appel
  - [ ] Appeler `searchMedia({ query, type })` quand query >= 2 caractères
  - [ ] Si `success: false` → stocker error, afficher toast
  - [ ] `setUIStore loading.search` pendant la requête

- [ ] **Task 2 — Créer `app/item/search.tsx`** (AC1, AC2, AC3)
  - [ ] TextInput de recherche + sélecteur type (`film | serie | livre`)
  - [ ] Liste des résultats avec `NowPlayingCard` adapté (titre, affiche, année)
  - [ ] Sélection → afficher fiche complète avec bouton "Ajouter"
  - [ ] Bouton "Ajouter" → `addItem(uid, { ...result, status: 'owned', tier: 'none', addedVia: 'search' })`
  - [ ] EmptyState si aucun résultat
  - [ ] Lien "Créer manuellement" → `router.push('/item/new')`

- [ ] **Task 3 — Composant `components/media/SearchResultCard.tsx`** (AC1)
  - [ ] Affiche : poster (si disponible), titre, année, type badge
  - [ ] Taille compacte pour une liste

- [ ] **Task 4 — Bouton scan → search dans collection.tsx** (AC1)
  - [ ] Ajouter un bouton "+" sur `collection.tsx` avec deux options : "Scanner" et "Rechercher"

- [ ] **Task 5 — Tests** (tous ACs)
  - [ ] Test `useMediaSearch` : query < 2 chars → pas d'appel
  - [ ] Test `useMediaSearch` : query >= 2 chars → `searchMedia` appelé après debounce
  - [ ] Test `useMediaSearch` : success: false → error stocké
  - [ ] Test : sélection d'un résultat → `addItem` appelé avec `addedVia: 'search'`

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
### Debug Log References
### Completion Notes List
### File List

- `app/item/search.tsx` (nouveau)
- `hooks/useMediaSearch.ts` (nouveau)
- `hooks/useMediaSearch.test.ts` (nouveau)
- `components/media/SearchResultCard.tsx` (nouveau)
- `app/(app)/collection.tsx` (ajout bouton +)
