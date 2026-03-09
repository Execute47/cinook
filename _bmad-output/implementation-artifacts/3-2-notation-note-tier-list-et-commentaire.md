# Story 3.2 : Notation — note, tier-list et commentaire

Status: done

## Story

En tant qu'utilisatrice,
Je veux noter un item avec une note chiffrée, un niveau de tier-list et un commentaire libre,
Afin d'exprimer précisément mon ressenti et retrouver mes avis facilement.

## Acceptance Criteria

### AC1 — Trois composants de notation

**Given** la fiche d'un item
**When** j'ouvre la section notation
**Then** trois composants distincts sont disponibles : `RatingWidget` (0-10), `TierPicker` (6 niveaux), `CommentInput` (texte libre)

### AC2 — Note chiffrée

**Given** le widget de note affiché
**When** j'attribue une note entre 0 et 10
**Then** le champ `rating` est enregistré dans Firestore
**And** la note s'affiche sur la carte dans la collection

### AC3 — Tier-list

**Given** le TierPicker affiché
**When** je sélectionne un niveau (Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant)
**Then** le champ `tier` est enregistré dans Firestore
**And** le badge tier s'affiche sur la fiche avec la couleur correspondante

### AC4 — Modification et suppression

**Given** une note, un tier ou un commentaire existant
**When** je le modifie ou le supprime
**Then** Firestore est mis à jour ou le champ est effacé
**And** les modifications sont visibles immédiatement

## Tasks / Subtasks

- [x] **Task 1 — Composant `components/media/RatingWidget.tsx`** (AC1, AC2)
  - [x] Slider ou boutons 0-10
  - [x] Affichage de la note actuelle
  - [x] `onRate(value: number | null)` callback
  - [x] Bouton "Effacer" pour supprimer la note

- [x] **Task 2 — Composant `components/media/TierPicker.tsx`** (AC1, AC3)
  - [x] 6 boutons pour les niveaux depuis `TIER_LEVELS`
  - [x] Couleur et emoji de chaque niveau
  - [x] Niveau actif mis en évidence
  - [x] `onSelect(tier: TierLevel)` callback

- [x] **Task 3 — Composant `components/media/CommentInput.tsx`** (AC1, AC4)
  - [x] TextInput multiline
  - [x] Bouton "Enregistrer" → `updateItem(uid, id, { comment })`
  - [x] Bouton "Effacer" → `updateItem(uid, id, { comment: deleteField() })`

- [x] **Task 4 — Composant `components/media/TierBadge.tsx`** (AC3)
  - [x] Badge avec couleur + emoji + label du tier
  - [x] Réutilisable dans ItemCard et fiche détail

- [x] **Task 5 — Intégrer dans item/[id].tsx** (AC1, AC2, AC3, AC4)
  - [x] Section "Mon avis" avec les 3 composants
  - [x] Chaque modification → `updateItem` avec le champ concerné
  - [x] Utiliser `deleteField()` pour effacer rating/comment

- [x] **Task 6 — Tests** (tous ACs)
  - [x] Test RatingWidget : onRate appelé avec la bonne valeur
  - [x] Test TierPicker : onSelect appelé avec le bon tier
  - [x] Test : effacement note → `updateItem` avec `deleteField()`
  - [x] Test : affichage TierBadge avec la bonne couleur

## Dev Notes

### TIER_LEVELS (constants/tiers.ts)

```
none → '#6B7280' · disliked → '#EF4444' · seen → '#9CA3AF'
bronze → '#CD7F32' · silver → '#C0C0C0' · gold → '#FFD700' · diamond → '#B9F2FF'
```

### RatingWidget — slider React Native

```typescript
import Slider from '@react-native-community/slider'
// OU utiliser des boutons 0-10 sans dépendance externe
```

Préférer les boutons 0-10 pour éviter une dépendance supplémentaire.

### References

- [Source: epics.md#Story 3.2]
- [Source: architecture.md#Data Architecture] — champs rating, tier, comment
- [Source: story 2-5] — updateItem, deleteField

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `components/media/RatingWidget.tsx` (nouveau)
- `components/media/RatingWidget.test.tsx` (nouveau)
- `components/media/TierPicker.tsx` (nouveau)
- `components/media/TierPicker.test.tsx` (nouveau)
- `components/media/TierBadge.tsx` (nouveau)
- `components/media/CommentInput.tsx` (nouveau)
- `app/(app)/item/[id].tsx` (mise à jour)
