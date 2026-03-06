# Story 2.6 : Recherche et filtrage de la collection

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux rechercher et filtrer ma collection par titre, type de média ou statut,
Afin de retrouver rapidement n'importe quel item.

## Acceptance Criteria

### AC1 — Filtrage en temps réel

**Given** l'écran de ma collection (`app/(app)/collection.tsx`)
**When** je saisis du texte dans la barre de recherche
**Then** les items sont filtrés en temps réel par titre (côté client, sur le cache local)
**And** la réponse est instantanée (< 500ms, NFR3)

### AC2 — Filtres combinables

**Given** la collection affichée
**When** j'applique un filtre par type (film / série / livre) ou par statut
**Then** seuls les items correspondants sont affichés
**And** les filtres sont combinables (ex: films + statut "Vu")

### AC3 — État vide

**Given** une collection vide ou sans résultats après filtre
**When** aucun item ne correspond
**Then** un écran vide explicite s'affiche (`EmptyState`) avec une suggestion d'action

## Tasks / Subtasks

- [ ] **Task 1 — Logique de filtrage dans collection.tsx** (AC1, AC2)
  - [ ] Lire `searchQuery`, `mediaType`, `status` depuis `useFiltersStore`
  - [ ] `useMemo` pour calculer `filteredItems` depuis `items` (useCollection)
  - [ ] Filtre titre : `item.title.toLowerCase().includes(query.toLowerCase())`
  - [ ] Filtre type : `item.type === mediaType` (si mediaType non null)
  - [ ] Filtre statut : `item.status === status` (si status non null)
  - [ ] Combiner les 3 filtres avec `&&`

- [ ] **Task 2 — UI filtres dans collection.tsx** (AC1, AC2)
  - [ ] Barre de recherche (TextInput) → `filtersStore.setSearchQuery`
  - [ ] Chips scrollables pour les types (`MEDIA_TYPES`)
  - [ ] Chips scrollables pour les statuts (`STATUS_OPTIONS`)
  - [ ] Bouton "Effacer les filtres" si filtres actifs → `filtersStore.clearFilters()`

- [ ] **Task 3 — Composant `components/ui/EmptyState.tsx`** (AC3)
  - [ ] Icône + message + CTA bouton
  - [ ] Props : `message`, `ctaLabel`, `onCtaPress`
  - [ ] Utiliser dans collection.tsx quand `filteredItems.length === 0`

- [ ] **Task 4 — Tests** (tous ACs)
  - [ ] Test : filtrage par titre case-insensitive
  - [ ] Test : filtre type seul
  - [ ] Test : filtre statut seul
  - [ ] Test : filtres combinés type + statut
  - [ ] Test : clearFilters → tous items visibles

## Dev Notes

### useMemo pour filteredItems

```typescript
const { items } = useCollection()
const { searchQuery, mediaType, status } = useFiltersStore()

const filteredItems = useMemo(() => {
  return items.filter(item => {
    const matchesQuery = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !mediaType || item.type === mediaType
    const matchesStatus = !status || item.status === status
    return matchesQuery && matchesType && matchesStatus
  })
}, [items, searchQuery, mediaType, status])
```

Tout se passe côté client — aucun appel Firestore supplémentaire.

### References

- [Source: epics.md#Story 2.6]
- [Source: architecture.md#Frontend Architecture] — filtersStore
- [Source: story 2-5] — useCollection, ItemCard

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `app/(app)/collection.tsx` (mise à jour filtres)
- `components/ui/EmptyState.tsx` (nouveau)
- `components/ui/EmptyState.test.tsx` (nouveau)
