# Story 3.1 : Gestion des statuts d'un item

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux attribuer un statut à chaque item de ma collection,
Afin de savoir en un coup d'œil ce que j'ai vu, possédé, prêté ou souhaite regarder.

## Acceptance Criteria

### AC1 — Sélecteur de statut

**Given** la fiche d'un item (`app/(app)/item/[id].tsx`)
**When** j'ouvre le sélecteur de statut (`StatusPicker`)
**Then** les 5 options s'affichent clairement : Possédé · Vu · Prêté · À voir · Favori

### AC2 — Mise à jour du statut

**Given** le sélecteur de statut ouvert
**When** je sélectionne un statut
**Then** le champ `status` est mis à jour dans Firestore
**And** le badge de statut sur la fiche se met à jour immédiatement

### AC3 — Effacement prêt lors de changement de statut

**Given** un item dont je change le statut de "Prêté" vers un autre statut
**When** je valide le changement
**Then** les champs `loanTo` et `loanDate` sont effacés automatiquement

## Tasks / Subtasks

- [ ] **Task 1 — Composant `components/media/StatusPicker.tsx`** (AC1, AC2)
  - [ ] Afficher les 5 statuts depuis `STATUS_OPTIONS`
  - [ ] Statut actif mis en évidence (amber)
  - [ ] `onSelect(status: ItemStatus)` callback
  - [ ] Peut s'afficher en modal bottom sheet ou inline

- [ ] **Task 2 — Intégrer StatusPicker dans item/[id].tsx** (AC1, AC2, AC3)
  - [ ] Afficher le badge statut actuel
  - [ ] Au tap → ouvrir StatusPicker
  - [ ] Sur sélection → appeler `updateItem(uid, id, { status })`
  - [ ] Si nouveau statut !== 'loaned' et ancien === 'loaned' → inclure `{ loanTo: null, loanDate: null }` dans l'update (AC3)
  - [ ] Note : Firestore v10 → utiliser `deleteField()` plutôt que `null` pour effacer

- [ ] **Task 3 — Badge statut dans ItemCard.tsx** (AC2)
  - [ ] Afficher badge coloré avec le label du statut

- [ ] **Task 4 — Tests** (tous ACs)
  - [ ] Test : sélection statut → `updateItem` appelé avec `{ status }`
  - [ ] Test : passage de 'loaned' → autre statut → `loanTo` et `loanDate` effacés
  - [ ] Test : passage vers 'loaned' → `loanTo`/`loanDate` non effacés

## Dev Notes

### deleteField() pour effacer des champs Firestore

```typescript
import { updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'

// Effacer loanTo et loanDate
await updateItem(uid, id, {
  status: newStatus,
  loanTo: deleteField() as any,
  loanDate: deleteField() as any,
  updatedAt: serverTimestamp(),
})
```

### Couleurs statuts (STATUS_OPTIONS dans constants/statuses.ts)

- owned → `#60A5FA` (bleu)
- watched → `#34D399` (vert)
- loaned → `#FBBF24` (amber)
- wishlist → `#A78BFA` (violet)
- favorite → `#F87171` (rouge)

### References

- [Source: epics.md#Story 3.1]
- [Source: architecture.md#Data Architecture] — champs status, loanTo, loanDate
- [Source: story 2-5] — updateItem dans lib/firestore.ts

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `components/media/StatusPicker.tsx` (nouveau)
- `components/media/StatusPicker.test.tsx` (nouveau)
- `app/(app)/item/[id].tsx` (mise à jour)
- `components/media/ItemCard.tsx` (ajout badge statut)
