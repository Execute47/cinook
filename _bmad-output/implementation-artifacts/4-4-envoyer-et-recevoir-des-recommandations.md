# Story 4.4 : Envoyer et recevoir des recommandations

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux recommander un item à un ou plusieurs membres de mon cercle et recevoir leurs recommandations,
Afin d'enrichir nos échanges culturels de façon asynchrone.

## Acceptance Criteria

### AC1 — Envoyer une recommandation

**Given** la fiche d'un item
**When** j'appuie sur "Recommander" (`RecoComposer`)
**Then** je peux sélectionner un ou plusieurs membres du cercle
**And** la recommandation est enregistrée dans `/circles/{circleId}/recommendations/{id}` avec `fromUserId`, `toUserIds[]`, `itemId`, `itemTitle` (FR26)

### AC2 — Recevoir des recommandations

**Given** une recommandation reçue
**When** j'ouvre l'écran d'accueil (`app/(app)/index.tsx`)
**Then** les recommandations reçues s'affichent via `useRecommendations` avec le nom de l'expéditeur, le titre et l'affiche (FR27)

### AC3 — Ajouter une recommandation à "À voir"

**Given** une recommandation reçue affichée
**When** j'appuie sur "Ajouter à À voir"
**Then** l'item est ajouté à ma collection avec le statut "À voir" en un seul geste (FR28, NFR10)
**And** la recommandation reste visible dans le fil

## Tasks / Subtasks

- [ ] **Task 1 — Composant `components/circle/RecoComposer.tsx`** (AC1)
  - [ ] Liste des membres (depuis `useCircle`) avec checkbox multi-sélection
  - [ ] Bouton "Envoyer" → `addDoc(collection(db, 'circles', circleId, 'recommendations'), { fromUserId: uid, fromUserName, toUserIds, itemId, itemTitle, itemPoster, createdAt: serverTimestamp() })`

- [ ] **Task 2 — Intégrer RecoComposer dans item/[id].tsx** (AC1)
  - [ ] Bouton "Recommander" → ouvrir RecoComposer en modal

- [ ] **Task 3 — Implémenter `hooks/useRecommendations.ts`** (AC2)
  - [ ] Listener `onSnapshot` sur `/circles/{circleId}/recommendations`
  - [ ] Filtrer les recommandations où `toUserIds.includes(uid)` côté client
  - [ ] State : `recommendations: Recommendation[]`, `loading`, `error`
  - [ ] Cleanup `unsubscribe` (OBLIGATOIRE)

- [ ] **Task 4 — Composant `components/circle/RecoCard.tsx`** (AC2, AC3)
  - [ ] Afficher : affiche, titre, expéditeur, date
  - [ ] Bouton "Ajouter à À voir" → `addItem(uid, { ...recoData, status: 'wishlist', addedVia: 'search', tier: 'none' })`

- [ ] **Task 5 — Intégrer dans `app/(app)/index.tsx`** (AC2, AC3)
  - [ ] Section "Recommandations reçues" avec `useRecommendations`
  - [ ] Liste de `RecoCard`

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Test `useRecommendations` : listener avec cleanup, filtre toUserIds
  - [ ] Test RecoComposer : addDoc appelé avec les bons champs
  - [ ] Test RecoCard : "Ajouter à À voir" → addItem avec status wishlist

## Dev Notes

### Filtrage côté client des recommandations

Les règles Firestore donnent accès à toutes les recommandations du cercle. Le filtrage `toUserIds.includes(uid)` est fait côté client pour ne montrer que celles destinées à l'utilisatrice.

### References

- [Source: epics.md#Story 4.4]
- [Source: architecture.md#Data Architecture] — /circles/{circleId}/recommendations
- [Source: story 2-2] — addItem

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `hooks/useRecommendations.ts` (nouveau)
- `hooks/useRecommendations.test.ts` (nouveau)
- `components/circle/RecoComposer.tsx` (nouveau)
- `components/circle/RecoCard.tsx` (nouveau)
- `app/(app)/index.tsx` (mise à jour)
- `app/(app)/item/[id].tsx` (bouton Recommander)
