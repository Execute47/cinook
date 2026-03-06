# Story 4.5 : Cinéclub — mettre en avant un item

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux mettre en avant un item en tant que Cinéclub pour tous les membres de mon cercle,
Afin de partager un coup de cœur ou un film à l'affiche avec mon entourage.

## Acceptance Criteria

### AC1 — Mettre en Cinéclub

**Given** la fiche d'un item
**When** j'appuie sur "Mettre en Cinéclub" (`CineclubButton`)
**Then** le document `/circles/{circleId}/cineclub` est écrasé avec l'item sélectionné, `postedBy` et `postedAt` (FR29)

### AC2 — Bannière Cinéclub sur l'accueil

**Given** un item mis en Cinéclub
**When** n'importe quel membre du cercle ouvre l'écran d'accueil
**Then** la bannière Cinéclub (`CineclubBanner`) affiche l'item en avant via `useCineclub` listener temps réel (FR30)
**And** la mise à jour est visible pour tous les membres en moins de 2 secondes

### AC3 — Ajouter le Cinéclub à "À voir"

**Given** un nouveau Cinéclub mis en place
**When** un membre voit la bannière
**Then** il peut ajouter l'item à sa liste "À voir" en un tap depuis la bannière

## Tasks / Subtasks

- [ ] **Task 1 — Composant `components/circle/CineclubButton.tsx`** (AC1)
  - [ ] Bouton "⭐ Mettre en Cinéclub"
  - [ ] `setDoc(doc(db, 'circles', circleId, 'cineclub'), { itemId, itemTitle, itemPoster, postedBy: uid, postedAt: serverTimestamp() })` (setDoc écrase)

- [ ] **Task 2 — Implémenter `hooks/useCineclub.ts`** (AC2)
  - [ ] Listener `onSnapshot` sur `/circles/{circleId}/cineclub`
  - [ ] State : `cineclub: Cineclub | null`, `loading`
  - [ ] Cleanup `unsubscribe` (OBLIGATOIRE)

- [ ] **Task 3 — Composant `components/circle/CineclubBanner.tsx`** (AC2, AC3)
  - [ ] Afficher : grande affiche, titre, "Mis en avant par {postedBy}"
  - [ ] Bouton "Ajouter à À voir" → `addItem(uid, { ...cineclubData, status: 'wishlist', tier: 'none', addedVia: 'discover' })`
  - [ ] Animation subtile à l'apparition

- [ ] **Task 4 — Intégrer dans `app/(app)/index.tsx`** (AC2)
  - [ ] Afficher `CineclubBanner` en haut de l'accueil si `cineclub !== null`
  - [ ] En dessous : section recommandations (Story 4.4)

- [ ] **Task 5 — Intégrer CineclubButton dans item/[id].tsx** (AC1)
  - [ ] Afficher le bouton uniquement si l'utilisatrice a un cercle

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Test `useCineclub` : listener avec cleanup
  - [ ] Test CineclubButton : setDoc appelé avec les bons champs
  - [ ] Test CineclubBanner : bouton "À voir" → addItem avec status wishlist

## Dev Notes

### setDoc pour le Cinéclub (écrase l'existant)

```typescript
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'

await setDoc(doc(db, 'circles', circleId, 'cineclub'), {
  itemId,
  itemTitle,
  itemPoster,
  postedBy: displayName ?? uid,
  postedAt: serverTimestamp(),
})
// setDoc sans { merge: true } écrase complètement le document
```

### References

- [Source: epics.md#Story 4.5]
- [Source: architecture.md#Data Architecture] — /circles/{circleId}/cineclub (document unique)
- [Source: story 4-4] — index.tsx, addItem

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `hooks/useCineclub.ts` (nouveau)
- `hooks/useCineclub.test.ts` (nouveau)
- `components/circle/CineclubBanner.tsx` (nouveau)
- `components/circle/CineclubButton.tsx` (nouveau)
- `app/(app)/index.tsx` (mise à jour)
- `app/(app)/item/[id].tsx` (CineclubButton)
