# Story 4.3 : Consulter la collection et les notes d'un membre

Status: done

## Story

En tant qu'utilisatrice,
Je veux consulter la collection et les notes d'un autre membre du cercle,
Afin de découvrir ses goûts et m'inspirer de ses avis.

## Acceptance Criteria

### AC1 — Collection d'un autre membre

**Given** un membre du cercle sélectionné
**When** j'accède à sa collection
**Then** ses items sont lisibles via les Firestore Rules (isolation cercle, NFR5)
**And** le titre, l'affiche, le statut, la note et le tier de chaque item sont visibles (FR14)

### AC2 — Notes croisées sur mes propres items

**Given** la fiche d'un item de ma propre collection
**When** d'autres membres du cercle ont noté cet item
**Then** leurs notes, tiers et commentaires sont affichés dans une section dédiée (FR23)
**And** seuls les membres de mon cercle sont visibles

## Tasks / Subtasks

- [x] **Task 1 — Créer `app/(app)/member/[uid].tsx`** (AC1)
  - [x] Récupérer la collection d'un autre membre : `collection(db, 'users', memberUid, 'items')`
  - [x] Afficher en lecture seule avec `ItemCard` (pas de bouton modifier/supprimer)
  - [x] Header avec displayName du membre
  - [x] Protégé par Firestore Rules (la règle gère l'accès — côté client, faire confiance)

- [x] **Task 2 — Notes croisées dans item/[id].tsx** (AC2)
  - [x] Pour chaque membre du cercle (depuis `useCircle`), chercher s'ils ont le même item dans leur collection (par `tmdbId` ou `googleBooksId` ou `title`)
  - [x] Afficher section "Ce que pensent les membres" avec rating, tier, comment de chaque membre

- [x] **Task 3 — Navigation depuis MemberCard** (AC1)
  - [x] Tap sur MemberCard → `router.push('/(app)/member/' + member.uid)`

- [x] **Task 4 — Tests** (AC1, AC2)
  - [x] Test : lecture collection membre → requête sur /users/{memberUid}/items
  - [x] Test : notes croisées filtrées par circleId

## Dev Notes

### Accès collection d'un autre membre

```typescript
const memberItems = await getDocs(collection(db, 'users', memberUid, 'items'))
// Les Firestore Rules autorisent la lecture si même cercle
```

### Matching pour notes croisées

Chercher par `tmdbId` ou `googleBooksId` (plus fiable que titre). Si l'item n'a pas d'ID externe (ajout manuel), fallback sur correspondance de titre.

### References

- [Source: epics.md#Story 4.3]
- [Source: architecture.md#Data Architecture] — isolation cercle
- [Source: story 4-2] — useCircle, members

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `app/(app)/member/[uid].tsx` (nouveau)
- `app/(app)/item/[id].tsx` (section notes croisées)
