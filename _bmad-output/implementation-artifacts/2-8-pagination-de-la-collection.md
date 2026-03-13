# Story 2.8 : Performance de la Collection — FlashList & Recherche Floue

Status: done

## Story

En tant qu'utilisatrice avec une grande collection (300+ œuvres),
je veux que le scroll soit fluide et que la recherche trouve mes items même avec une orthographe approximative,
afin de naviguer confortablement dans ma collection sans frustration.

## Contexte

### Problème actuel

1. **FlatList** (React Native core) re-render tous les items visibles + hors-écran, et recycle mal les cellules au scroll. Avec 300+ items de ~70px, le scroll devient saccadé.

2. **Recherche `includes()`** (ligne 71, `collection.tsx`) : recherche stricte et sensible à la casse. "dun" ne trouve pas "Dune", "blade runr" ne trouve pas "Blade Runner".

### Solution

- **FlashList** (`@shopify/flash-list`) : remplacement drop-in de FlatList, 10× plus performant grâce au recyclage natif des cellules
- **Fuse.js** : bibliothèque de recherche floue légère (< 10 kb), zéro service externe, fonctionne hors-ligne sur les items en mémoire

### Ce qui NE change pas

- `hooks/useCollection.ts` — inchangé, tous ses consommateurs continuent de fonctionner
- L'architecture Firestore — aucune modification de query
- Le filtrage par type et statut — logique conservée

## Acceptance Criteria

1. **[AC1 - FlashList]** La FlatList de `collection.tsx` est remplacée par FlashList
2. **[AC2 - Scroll fluide]** Le scroll ne saute pas / ne rame pas avec 300 items sur un appareil moyen
3. **[AC3 - Recherche floue]** La recherche tolère les fautes légères ("dun" → "Dune", "blade runr" → "Blade Runner")
4. **[AC4 - Champs recherchés]** La recherche porte sur `title`, `director` et `author`
5. **[AC5 - Recherche vide]** Quand `searchQuery` est vide, tous les items s'affichent (pas de traitement Fuse inutile)
6. **[AC6 - Filtres combinés]** Recherche floue + filtre type + filtre statut se combinent correctement
7. **[AC7 - Animations préservées]** Les animations d'entrée de `ItemCard` ne se redéclenchent pas lors du scroll (recyclage FlashList)
8. **[AC8 - États préservés]** Loading, EmptyState, "Aucun résultat" continuent de s'afficher correctement
9. **[AC9 - Tests]** La logique de recherche floue a un test unitaire

## Tasks / Subtasks

- [x] **Task 1 — Installer les dépendances** (AC1, AC3)
  - [x] `npx expo install @shopify/flash-list`
  - [x] `npx expo install fuse.js`

- [x] **Task 2 — Remplacer FlatList par FlashList dans `collection.tsx`** (AC1, AC2, AC7)
  - [x] Remplacer l'import `FlatList` de `react-native` par `FlashList` de `@shopify/flash-list`
  - [x] Ajouter la prop obligatoire `estimatedItemSize={70}`
  - [x] Supprimer le `animationIndex` passé à `ItemCard`

- [x] **Task 3 — Remplacer la recherche `includes()` par Fuse.js dans `collection.tsx`** (AC3, AC4, AC5, AC6)
  - [x] Créer une instance Fuse mémoïsée sur `items`
  - [x] Remplacer le filtre `matchesQuery` par la logique Fuse
  - [x] Si `searchQuery` vide → passer directement au filtre type/statut

- [x] **Task 4 — Adapter `ItemCard.tsx` pour FlashList** (AC7)
  - [x] Supprimer la prop `animationIndex` et la logique d'animation d'entrée
  - [x] Conserver les autres styles et le contenu du card

- [x] **Task 5 — Tests** (AC9)
  - [x] Tester que Fuse retourne le bon résultat pour une recherche exacte
  - [x] Tester qu'une faute légère ("dun") retourne "Dune"
  - [x] Tester que la combinaison recherche + filtre type fonctionne
  - [x] Tester que `searchQuery` vide retourne tous les items

## Dev Notes

### Installation

```bash
npx expo install @shopify/flash-list
npx expo install fuse.js
```

### Remplacement FlatList → FlashList

```tsx
// Avant
import { FlatList } from 'react-native'
<FlatList
  data={filteredItems}
  keyExtractor={(item) => item.id}
  renderItem={({ item, index }) => (
    <ItemCard item={item} onPress={...} animationIndex={index} />
  )}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
  showsVerticalScrollIndicator={false}
/>

// Après
import { FlashList } from '@shopify/flash-list'
<FlashList
  data={filteredItems}
  keyExtractor={(item) => item.id}
  estimatedItemSize={70}
  renderItem={({ item }) => (
    <ItemCard item={item} onPress={...} />
  )}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
  showsVerticalScrollIndicator={false}
/>
```

### Recherche floue avec Fuse.js

```tsx
// collection.tsx
import Fuse from 'fuse.js'

// Mémoïser l'instance Fuse — se recrée uniquement si items change
const fuse = useMemo(
  () => new Fuse(items, {
    keys: ['title', 'director', 'author'],
    threshold: 0.35,      // 0 = exact, 1 = tout accepter — 0.35 est un bon équilibre
    ignoreLocation: true, // cherche dans tout le champ, pas seulement au début
    minMatchCharLength: 2,
  }),
  [items]
)

// Remplacer le filtre matchesQuery dans le useMemo existant
const filteredItems = useMemo(() => {
  // Étape 1 : recherche floue (si query active)
  const searched = searchQuery.length >= 2
    ? fuse.search(searchQuery).map((r) => r.item)
    : items

  // Étape 2 : filtres type et statut (logique inchangée)
  return searched.filter((item) => {
    const matchesType = !mediaType || item.type === mediaType
    const matchesStatus = !status || item.statuses.includes(status)
    return matchesType && matchesStatus
  })
}, [fuse, items, searchQuery, mediaType, status])
```

### Suppression des animations d'entrée dans `ItemCard`

FlashList recycle les cellules : quand un item sort de l'écran, sa cellule est réutilisée pour un item différent. Si `ItemCard` déclenche une animation à la création basée sur `animationIndex`, le recyclage provoque des animations intempestives lors du scroll.

**Action** : supprimer la prop `animationIndex` et le bloc d'animation associé dans `ItemCard.tsx`. Le card reste visuellement identique — seule l'animation d'entrée initiale disparaît.

```tsx
// ItemCard.tsx — AVANT (à supprimer)
const MAX_ANIMATED = 6
// ... logique Animated.Value + useEffect + Animated.View avec opacity/translateY

// ItemCard.tsx — APRÈS
// Card simple sans animation d'entrée — retirer animationIndex des Props aussi
```

### Choix du `threshold` Fuse.js

| Valeur | Comportement |
|--------|-------------|
| `0.0` | Correspondance exacte uniquement |
| `0.2` | Très strict — tolère 1-2 caractères de différence |
| `0.35` | **Recommandé** — "dun" → "Dune", tolère fautes légères |
| `0.5` | Souple — peut retourner des faux positifs |
| `1.0` | Tout correspond — inutile |

### `estimatedItemSize` pour FlashList

FlashList a besoin d'une estimation de la hauteur des items pour optimiser le layout. Mesurer `ItemCard` :
- Poster `h-16` = 64px
- Padding vertical `py-3` × 2 = 24px
- Margin bottom `mb-2` = 8px
- **Total estimé : ~70px** (valeur à affiner si des sauts visuels sont observés)

### Project Structure Notes

- **Modifié** : `app/(app)/collection.tsx` — FlashList + Fuse.js
- **Modifié** : `components/media/ItemCard.tsx` — suppression animation d'entrée + prop `animationIndex`
- **Inchangé** : `hooks/useCollection.ts` et tous ses consommateurs
- **Nouveau test** : `app/(app)/collection.test.tsx` ou `hooks/useCollectionSearch.test.ts`

### Références

- `app/(app)/collection.tsx` lignes 68-76 — logique de filtrage à adapter
- `app/(app)/collection.tsx` lignes 182-195 — FlatList à remplacer
- `components/media/ItemCard.tsx` — suppression `animationIndex`
- [FlashList docs](https://shopify.github.io/flash-list/)
- [Fuse.js docs](https://www.fusejs.io/api/options.html)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
