---
title: 'Filtres et tri avancés de la collection'
slug: 'filtres-tri-collection'
created: '2026-03-14'
status: 'in-progress'
stepsCompleted: [1, 2]
tech_stack: ['React Native', 'Expo Router', 'TypeScript', 'Zustand', 'Firestore', 'Fuse.js', 'FlashList', 'NativeWind/Tailwind']
files_to_modify:
  - 'types/media.ts'
  - 'constants/statuses.ts'
  - 'components/media/StatusPicker.tsx'
  - 'components/media/StatusPicker.test.tsx'
  - 'stores/filtersStore.ts'
  - 'stores/filtersStore.test.ts'
  - 'app/(app)/collection.tsx'
  - 'app/(app)/collection.test.tsx'
  - 'app/(app)/member/[uid].tsx'
  - 'app/(app)/member/member.test.tsx'
code_patterns:
  - 'Filtres via Zustand store (filtersStore) + useMemo côté client'
  - 'Composant Chip pour les filtres actifs/inactifs (amber-500 actif, #1C1717 inactif)'
  - 'Recherche floue via Fuse.js (threshold 0.35, keys: title/director/author)'
  - 'Statuts définis dans types/media.ts (union) + constants/statuses.ts (labels/icônes/couleurs)'
  - 'FlashList pour la collection propre, FlatList pour la collection amie'
test_patterns:
  - 'Jest + @testing-library/react-native'
  - 'Mocks Firestore, expo-router, firebase'
  - 'Tests filtersStore: état initial, setters, clearFilters'
  - 'Tests CollectionScreen: filtrage par type/statut/recherche floue'
  - 'Tests MemberCollectionScreen: requête Firestore, affichage items'
---

# Tech-Spec: Filtres et tri avancés de la collection

**Created:** 2026-03-14

## Overview

### Problem Statement

Les filtres de la collection présentent plusieurs lacunes : le label du statut `wishlist` est incohérent ("Souhaité" dans la collection vs "À voir" sur la fiche item), le statut `borrowed` ("Emprunté") est absent des filtres, il manque un filtre par tier, et il n'existe pas de statut distinct pour les items souhaités (cadeaux, envies d'achat). Par ailleurs, la page de collection d'un ami ne propose aucune recherche ni filtre. Enfin, le tri actuel (par date d'ajout) ne valorise pas les œuvres récemment vues/lues.

### Solution

1. Corriger le wording : renommer le filtre `wishlist` → "À voir" dans la collection.
2. Créer un nouveau statut `wanted` ("Souhaité") pour les items que l'utilisateur veut se procurer/recevoir.
3. Ajouter les filtres manquants dans la collection : "Emprunté" et les cinq tiers.
4. Ajouter recherche + filtres (type, statut) dans la page collection d'un ami.
5. Trier les œuvres par `endedAt` desc (vues/lues récemment en premier), les items sans date de fin apparaissent en dernier.

### Scope

**In Scope:**
- Renommage du label `wishlist` → "À voir" dans `collection.tsx`
- Nouveau statut `wanted` ("Souhaité") dans les types, constants, StatusPicker
- Ajout du filtre `borrowed` dans la modale filtres de `collection.tsx`
- Ajout d'une section filtre "Tier" dans la modale filtres + `filtersStore`
- Ajout recherche + filtres type/statut dans `member/[uid].tsx`
- Tri par `endedAt` desc côté client (fallback : items sans date en dernier)

**Out of Scope:**
- Migration des données Firestore existantes
- Modification des règles Firestore
- Filtre par tier dans la collection d'un ami (phase 2)

## Context for Development

### Codebase Patterns

- **Filtres UI** : modale bottom-sheet avec composant `Chip` local dans `collection.tsx` (amber-500 quand actif, bg-[#1C1717] sinon)
- **Store de filtres** : Zustand dans `stores/filtersStore.ts` — actuellement `searchQuery`, `mediaType`, `status`. Doit accueillir `tier`.
- **Filtrage** : 100% côté client dans `useMemo` (`filteredItems`) dans `collection.tsx`. Le store Zustand drive le filtrage.
- **Statuts** : `ItemStatus` dans `types/media.ts` (union type), labels/icônes/couleurs dans `constants/statuses.ts`. `collection.tsx` a sa propre copie locale des `STATUS_OPTIONS` avec des labels différents (source d'incohérence : "Souhaité" au lieu de "À voir").
- **Tiers** : `TierLevel = 'none' | 'disliked' | 'bronze' | 'silver' | 'gold' | 'diamond'` dans `types/media.ts`. Icônes/couleurs à définir dans `constants/statuses.ts` ou localement.
- **Tri actuel** : `orderBy('addedAt', 'desc')` dans `useCollection` (Firestore). Le tri par `endedAt` sera ajouté côté client dans `collection.tsx`.
- **Collection ami** : `member/[uid].tsx` — `getDocs` one-shot, `FlatList`, aucun filtre. Devra intégrer Fuse.js + filtres locaux.
- **Recherche floue** : Fuse.js, `threshold: 0.35`, `minMatchCharLength: 2`, keys `['title', 'director', 'author']`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `types/media.ts` | Ajouter `wanted` à `ItemStatus` |
| `constants/statuses.ts` | Ajouter entrée `wanted` (label, icon, color) |
| `components/media/StatusPicker.tsx` | Ajouter `wanted` aux STATUS_OPTIONS |
| `components/media/StatusPicker.test.tsx` | Mettre à jour le compte de statuts (5→7 avec borrowed+wanted) |
| `stores/filtersStore.ts` | Ajouter `tier: TierLevel \| null` + `setTier` + `clearFilters` étendu |
| `stores/filtersStore.test.ts` | Ajouter tests `setTier` et `clearFilters` avec tier |
| `app/(app)/collection.tsx` | Renommer wishlist→"À voir", ajouter filtres borrowed/wanted/tier, tri endedAt |
| `app/(app)/collection.test.tsx` | Ajouter tests filtrage tier + tri endedAt |
| `app/(app)/member/[uid].tsx` | Ajouter Fuse.js + barre recherche + filtres type/statut |
| `app/(app)/member/member.test.tsx` | Ajouter tests recherche + filtrage |

### Technical Decisions

- **Tri `endedAt`** : côté client uniquement. Comparateur : items avec `endedAt` triés par timestamp desc, items sans `endedAt` placés après (Infinity en valeur de sort). Pas de changement d'index Firestore.
- **Statut `wanted`** : couleur `#FB923C` (orange) pour se distinguer de `wishlist` (violet `#A78BFA`). Icône : `'gift-outline'`. Label : "Souhaité". Pas de label alternatif par `mediaType`.
- **`collection.tsx` STATUS_OPTIONS locale** : supprimer la copie locale, utiliser `STATUS_OPTIONS` de `constants/statuses.ts` (single source of truth), + ajouter `borrowed` et `wanted`.
- **Filtre tier** : section distincte "Tier" dans la modale filtres (après Statut), même pattern Chip. Le `filtersStore` ajoute `tier: TierLevel | null`.
- **`hasActiveFilters`** : étendre à `!!mediaType || !!status || !!tier`.
- **Collection ami** : filtrage 100% local (données déjà chargées via `getDocs`). Pas de nouveau store — state local `useState` pour searchQuery/mediaType/status de la page membre.

## Implementation Plan

### Tasks

_(à compléter en Step 2)_

### Acceptance Criteria

_(à compléter en Step 2)_

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm

### Testing Strategy

_(à compléter en Step 2)_

### Notes

- `wishlist` reste le nom technique interne — seul le label affiché change ("Souhaité" → "À voir")
- `wanted` = nouveau statut pour "je veux me procurer / me faire offrir cet item"
- Le tri par `endedAt` ne change pas la requête Firestore (pas d'index composite nécessaire)
