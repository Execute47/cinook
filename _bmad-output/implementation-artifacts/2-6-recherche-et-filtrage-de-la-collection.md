# Story 2.6 : Recherche et filtrage de la collection

Status: done

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

- [x] **Task 1 — Logique de filtrage dans collection.tsx** (AC1, AC2)
  - [x] Lire `searchQuery`, `mediaType`, `status` depuis `useFiltersStore`
  - [x] `useMemo` pour calculer `filteredItems` depuis `items` (useCollection)
  - [x] Filtre titre case-insensitive
  - [x] Filtre type (si mediaType non null)
  - [x] Filtre statut (si status non null)
  - [x] Combinaison des 3 filtres avec `&&`

- [x] **Task 2 — UI filtres dans collection.tsx** (AC1, AC2)
  - [x] Barre de recherche (TextInput) → `filtersStore.setSearchQuery`
  - [x] Chips scrollables pour les types (toggle on/off)
  - [x] Chips scrollables pour les statuts (toggle on/off)
  - [x] Bouton "Effacer les filtres" si filtres actifs

- [x] **Task 3 — Composant `components/ui/EmptyState.tsx`** (AC3)
  - [x] Icône + message + CTA bouton optionnel
  - [x] Props : `message`, `ctaLabel`, `onCtaPress`
  - [x] Utilisé dans collection.tsx (filtres actifs vs collection vide)

- [x] **Task 4 — Tests** (tous ACs)
  - [x] Test : affiche tous les items sans filtre
  - [x] Test : filtrage par titre case-insensitive
  - [x] Test : filtre type seul
  - [x] Test : filtre statut seul
  - [x] Test : filtres combinés type + statut → EmptyState
  - [x] Test : clearFilters → tous items visibles

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
claude-sonnet-4-6

### Debug Log References

### Completion Notes List
- `components/ui/EmptyState.tsx` : icône, message, CTA optionnel
- `collection.tsx` : useMemo filteredItems, barre recherche, chips type + statut toggle, bouton effacer, EmptyState contextuel
- 6 tests filtrage — 87/87 suite complète, zéro régression

### File List

- `app/(app)/collection.tsx` (filtres complets)
- `app/(app)/collection.test.tsx` (nouveau)
- `components/ui/EmptyState.tsx` (nouveau)
