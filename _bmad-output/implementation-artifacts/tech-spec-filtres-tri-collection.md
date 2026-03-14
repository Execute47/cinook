---
title: Filtres et tri avances de la collection
slug: filtres-tri-collection
created: '2026-03-14'
status: implementation-complete
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - React Native / Expo Router
  - TypeScript
  - Zustand
  - Firestore
  - Fuse.js
  - FlashList
  - NativeWind/Tailwind
files_to_modify:
  - types/media.ts
  - constants/statuses.ts
  - components/media/StatusPicker.tsx
  - components/media/StatusPicker.test.tsx
  - stores/filtersStore.ts
  - stores/filtersStore.test.ts
  - app/(app)/collection.tsx
  - app/(app)/collection.test.tsx
  - app/(app)/member/[uid].tsx
  - app/(app)/member/member.test.tsx
---

# Tech-Spec: Filtres et tri avances de la collection

**Created:** 2026-03-14

## Overview

### Problem Statement

Les filtres de la collection ont plusieurs lacunes : le label `wishlist` est incoherent ("Souhaite" dans la collection vs "A voir" sur la fiche item), le statut `borrowed` est absent des filtres, il manque un filtre par tier, et il n'existe pas de statut distinct pour les items souhaites (cadeaux/envies d'achat). La page collection d'un ami n'a aucune recherche ni filtre. Le tri actuel (par date d'ajout) ne valorise pas les oeuvres recemment vues/lues.

### Solution

1. Renommer le filtre `wishlist` vers "A voir" dans la collection (unifier avec `constants/statuses.ts`).
2. Creer le statut `wanted` ("Souhaite") pour les items a se procurer/recevoir.
3. Ajouter filtres `borrowed` et les 5 tiers dans la collection.
4. Ajouter recherche + filtres type/statut dans `member/[uid].tsx`.
5. Trier par `endedAt` desc cote client, items sans date en dernier.

### Scope

**In Scope:**
- `wanted` dans types/constants/StatusPicker
- Unification STATUS_OPTIONS de collection.tsx vers constants/statuses.ts
- Filtres `borrowed` + `wanted` + tier dans la modale collection
- Tri `endedAt` desc cote client dans collection.tsx
- Recherche Fuse.js + filtres type/statut dans member/[uid].tsx
- Mise a jour des tests

**Out of Scope:**
- Migration donnees Firestore, modification regles Firestore
- Filtre tier dans la collection d'un ami

## Context for Development

### Codebase Patterns

- **Filtres UI** : modale bottom-sheet avec composant `Chip` local dans `collection.tsx` (amber-500 actif, bg-[#1C1717] inactif).
- **Store filtres** : Zustand `stores/filtersStore.ts` — searchQuery, mediaType, status. Ajouter `tier: TierLevel | null` + `setTier`.
- **Filtrage** : 100% cote client dans `useMemo` (`filteredItems`).
- **Statuts** : union `ItemStatus` dans `types/media.ts`, labels/icones/couleurs dans `constants/statuses.ts`. `collection.tsx` a sa propre copie locale incoherente — a supprimer et remplacer par import.
- **Tiers** : `TierLevel = 'none' | 'disliked' | 'bronze' | 'silver' | 'gold' | 'diamond'` dans `types/media.ts`.
- **Tri actuel** : `orderBy('addedAt', 'desc')` Firestore. Tri `endedAt` ajoute cote client apres filtrage.
- **Collection ami** : `getDocs` one-shot + `FlatList`. Filtrage 100% local via `useState`.
- **Fuse.js** : threshold 0.35, minMatchCharLength 2, keys `['title', 'director', 'author']`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `types/media.ts` | Ajouter `wanted` a ItemStatus |
| `constants/statuses.ts` | Ajouter entree wanted (label/icon/color) |
| `components/media/StatusPicker.tsx` | Ajouter wanted aux options |
| `components/media/StatusPicker.test.tsx` | Mettre a jour count statuts, corriger type current |
| `stores/filtersStore.ts` | Ajouter tier + setTier + clearFilters etendu |
| `stores/filtersStore.test.ts` | Tests setTier + clearFilters |
| `app/(app)/collection.tsx` | Unifier STATUS_OPTIONS, filtres tier/borrowed/wanted, tri endedAt |
| `app/(app)/collection.test.tsx` | Tests filtrage tier + tri endedAt |
| `app/(app)/member/[uid].tsx` | Recherche Fuse + filtres type/statut |
| `app/(app)/member/member.test.tsx` | Tests filtrage local + recherche |

### Technical Decisions

- **Tri `endedAt`** : `.sort((a, b) => (b.endedAt?.toMillis() ?? -Infinity) - (a.endedAt?.toMillis() ?? -Infinity))` apres `.filter(...)`. Items sans `endedAt` -> -Infinity -> fin. Pas d'index Firestore requis.
- **Statut `wanted`** : couleur `#FB923C` (orange), icone `'gift-outline'`, label `"Souhaite"`. Pas de label alternatif par mediaType.
- **Unification STATUS_OPTIONS** : supprimer copie locale `collection.tsx`, importer depuis `constants/statuses.ts`.
- **Filtre tier** : section "Tier" dans la modale apres "Statut". Valeurs : disliked, bronze, silver, gold, diamond. `none` exclu.
- **`hasActiveFilters`** : `!!mediaType || !!status || !!tier`.
- **Collection ami** : `useState` local, pas de store partage. Fuse dans `useMemo`.

## Implementation Plan

### Tasks

- [x] **Tache 1 — `types/media.ts` : Ajouter `wanted` a `ItemStatus`**
  - Action : Ajouter `'wanted'` a la fin de l'union, apres `'favorite'` :
    `ItemStatus = 'owned' | 'watched' | 'loaned' | 'borrowed' | 'wishlist' | 'favorite' | 'wanted'`
  - Notes : Aucune migration Firestore necessaire. L'ordre dans l'union n'affecte pas le runtime mais le placer en dernier est coherent avec l'ordre d'ajout chronologique.

- [x] **Tache 2 — `constants/statuses.ts` : Ajouter entree `wanted`**
  - Action : Ajouter `wanted: { label: 'Souhaite', icon: 'gift-outline', color: '#FB923C' }` dans `STATUS_OPTIONS`.

- [x] **Tache 3 — `components/media/StatusPicker.tsx` : Ajouter `wanted`**
  - Action : Ajouter `{ value: 'wanted', label: 'Souhaite', color: '#FB923C' }` dans le tableau `STATUS_OPTIONS` local du fichier, apres l'entree `favorite`. Ce fichier CONSERVE sa propre copie locale (avec les couleurs) — ne pas importer depuis constants/statuses.ts. Resultat : 7 statuts au total.
  - Notes : `StatusPicker.tsx` maintient son propre tableau car il a besoin de la prop `color` pour le style inline, absente de `constants/statuses.ts`.

- [x] **Tache 4 — `components/media/StatusPicker.test.tsx` : Mettre a jour**
  - Action :
    - Renommer test "5 statuts" -> "7 statuts", ajouter assertions `Emprunte` et `Souhaite`.
    - Corriger `current="owned"` (string) -> `current={['owned']}` (tableau `ItemStatus[]`) partout.

- [x] **Tache 5 — `stores/filtersStore.ts` : Ajouter filtre tier**
  - Action :
    - Importer `TierLevel` depuis `../types/media`.
    - Ajouter `tier: TierLevel | null` (init null) dans `FiltersState`.
    - Ajouter `setTier: (tier: TierLevel | null) => void` avec `set(() => ({ tier }))`.
    - Etendre `clearFilters` : ajouter `tier: null`.

- [x] **Tache 6 — `stores/filtersStore.test.ts` : Mettre a jour**
  - Action :
    - Test "initialise" : ajouter `expect(state.tier).toBeNull()`.
    - Nouveau test "setTier met a jour le filtre" : `setTier('gold')` -> `tier === 'gold'`.
    - Test "clearFilters" : `setTier('bronze')` avant clear, verifier `tier === null`.

- [x] **Tache 7 — `app/(app)/collection.tsx` : Refactorer filtres + tri**
  - PREREQUIS : Taches 1, 2, 5 terminees (types + constants + store mis a jour).
  - Action :
    1. **EN PREMIER** : Supprimer la constante locale `STATUS_OPTIONS` (lignes 22-28) et son import type `ItemStatus` si devenu orphelin.
    2. Importer `STATUS_OPTIONS` depuis `@/constants/statuses` et `TierLevel` depuis `@/types/media`.
    3. Ajouter constante locale `TIER_OPTIONS` :
       `[{ value: 'disliked', label: "J'ai pas aime" }, { value: 'bronze', label: 'Bronze' }, { value: 'silver', label: 'Argent' }, { value: 'gold', label: 'Or' }, { value: 'diamond', label: 'Diamant' }]`
    4. Extraire `tier` et `setTier` depuis `useFiltersStore`.
    5. Dans `filteredItems` useMemo : ajouter `const matchesTier = !tier || item.tier === tier` dans le filter.
    6. Apres `.filter(...)`, enchainer `.sort((a, b) => (b.endedAt?.toMillis() ?? -Infinity) - (a.endedAt?.toMillis() ?? -Infinity))`.
    7. `hasActiveFilters` : `!!mediaType || !!status || !!tier`.
    8. Modale Statut : remplacer les chips par un mapping sur `Object.entries(STATUS_OPTIONS)` (imports).
    9. Modale : ajouter section "Tier" apres "Statut" avec chips `TIER_OPTIONS`.

- [x] **Tache 8 — `app/(app)/collection.test.tsx` : Mettre a jour**
  - PREREQUIS : Taches 5, 7 terminees.
  - Action :
    - Ajouter `tier: 'none'` sur tous les mock items existants.
    - Nouveau test "filtre par tier gold" : ajouter 2 items avec `tier: 'gold'` + 2 avec `tier: 'bronze'`, `setTier('gold')` -> 2 items gold affiches.
    - Nouveau test "filtre par statut borrowed" : ajouter 1 item avec `statuses: ['borrowed']`, `setStatus('borrowed')` -> seul cet item affiche. [F13]
    - Nouveau test "tri endedAt — recents en premier, sans date en dernier" : utiliser 3 items avec :
      - item A : `endedAt: { toMillis: () => 1700000000000 }` (recent)
      - item B : `endedAt: { toMillis: () => 1600000000000 }` (ancien)
      - item C : sans `endedAt` (undefined)
      - Verifier que l'ordre rendu est [A, B, C].
    - Test `clearFilters` : appeler `setTier('diamond')` puis `clearFilters()`, verifier `tier === null`.
    - Mettre a jour le mock `useFiltersStore` si necessaire pour exposer `tier` et `setTier`.

- [x] **Tache 9 — `app/(app)/member/[uid].tsx` : Ajouter recherche + filtres**
  - Action :
    1. Ajouter imports : `useMemo`, `useState`, `TextInput`, `Modal`, `Pressable`, `Fuse` depuis `'fuse.js'`, `FlashList` depuis `'@shopify/flash-list'`, `MediaType`/`ItemStatus` depuis `@/types/media`, `STATUS_OPTIONS` depuis `@/constants/statuses`.
    2. Ajouter `TYPE_OPTIONS` local : `[{ value: 'film' as MediaType, label: 'Films' }, { value: 'serie' as MediaType, label: 'Series' }, { value: 'livre' as MediaType, label: 'Livres' }]`.
    3. Copier le composant `Chip` local (identique a collection.tsx).
    4. Ajouter etat local : `searchQuery`, `mediaType`, `status`, `filterModalVisible`. Ces etats sont en `useState` LOCAL — ils sont reinitialises a chaque navigation vers une nouvelle page membre (comportement voulu : chaque consultation repart d'une liste non filtree). [F15]
    5. `fuse` dans `useMemo` sur `items`. Config : `{ keys: ['title', 'director', 'author'], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 }`. Note : Fuse ignore silencieusement les cles absentes (ex: `author` sur un film) — comportement acceptable. [F8/F9]
    6. `filteredItems` dans `useMemo` : Fuse si `searchQuery.length >= 2`, sinon `items` bruts. Puis filter par `mediaType` et `status`. Tri `endedAt` desc (meme formule que Tache 7).
    7. Remplacer `FlatList` par `FlashList` avec `filteredItems`, `estimatedItemSize={70}`.
    8. Ajouter barre recherche + bouton filtre sous le header (meme structure HTML/JSX que collection.tsx).
    9. Ajouter modale filtres avec sections "Type" et "Statut". PAS de section Tier (hors scope).
    10. `hasActiveFilters = !!mediaType || !!status` (tier exclu — page ami uniquement).

- [x] **Tache 10 — `app/(app)/member/member.test.tsx` : Mettre a jour**
  - Action :
    - Ajouter mock `@shopify/flash-list` -> `{ FlashList: FlatList }`.
    - Enrichir items mockés : `type`, `statuses: []`, `tier: 'none'`.
    - Nouveau test "filtre par type film" via `fireEvent.press` sur chip.
    - Nouveau test "recherche floue" via `fireEvent.changeText` sur TextInput.
    - Nouveau test "affiche vide quand aucun item ne correspond".

### Acceptance Criteria

- [x] **AC1** : Etant donne un item `wishlist`, quand l'utilisateur ouvre la modale filtres, alors le chip est libelle "A voir" (et non "Souhaite").
- [x] **AC2** : Etant donne un item `wanted`, quand l'utilisateur selectionne "Souhaite", alors cet item apparait et les autres sont exclus.
- [x] **AC3** : Etant donne des items `borrowed`, quand l'utilisateur selectionne "Emprunte", alors seuls les items empruntes sont affiches.
- [x] **AC4** : Etant donne des items avec tiers varies, quand l'utilisateur selectionne "Or", alors seuls les items `tier === 'gold'` sont affiches.
- [x] **AC5** : Etant donne Statut ET Tier actifs, alors seuls les items correspondant aux deux criteres sont affiches.
- [x] **AC6** : Etant donne des items avec/sans `endedAt`, quand la collection s'affiche, alors items avec `endedAt` en premier (recents en tete), sans date en dernier.
- [x] **AC7** : Etant donne un filtre Tier actif, quand l'utilisateur clique "Effacer les filtres", alors `tier` revient a `null`.
- [x] **AC8** : Etant donne la page collection d'un ami, quand l'utilisateur saisit >= 2 caracteres, alors filtrage flou sur titre/realisateur/auteur.
- [x] **AC9** : Etant donne la page collection d'un ami, quand l'utilisateur selectionne un filtre type ou statut, alors seuls les items correspondants sont affiches (combinable avec recherche).
- [x] **AC10a** : Etant donne qu'un filtre est actif dans la collection propre (statut, type, OU tier), alors le bouton filtre a le fond amber. [collection.tsx uniquement — tier inclus]
- [x] **AC10b** : Etant donne qu'un filtre est actif dans la collection d'un ami (statut OU type), alors le bouton filtre a le fond amber. [member/[uid].tsx — tier hors scope, non applicable ici]

## Additional Context

### Dependencies

Aucune nouvelle dependance npm. `fuse.js` et `@shopify/flash-list` deja presents.

### Testing Strategy

- `filtersStore.test.ts` : setTier + clearFilters etendu
- `collection.test.tsx` : filtrage tier, tri endedAt
- `member/member.test.tsx` : filtrage local, recherche via interactions UI (fireEvent)
- `StatusPicker.test.tsx` : count statuts mis a jour, type `current` corrige
- Tests manuels : wording "A voir", statut "Souhaite" sur fiche item, tri endedAt, filtres collection ami

### Notes

- `wishlist` reste le nom technique interne (Firestore) — seul le label affiche change.
- `wanted` nouveau statut : items existants non affectes, aucune migration.
- `StatusPicker.test.tsx` avait un bug type (`current` string au lieu de tableau) — corrige en Tache 4.
- La spec "Multi-admin Cineclub" en WIP archivee : `tech-spec-multi-admin-cineclub-choix-cercle-archived-2026-03-14.md`.
- Risque : l'ordre des statuts dans la modale changera apres unification — verifier UX manuellement.
