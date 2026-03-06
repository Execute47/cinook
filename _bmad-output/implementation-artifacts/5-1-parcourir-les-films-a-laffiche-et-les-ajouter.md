# Story 5.1 : Parcourir les films à l'affiche et les ajouter

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux consulter la liste des films actuellement en salle et en ajouter à ma collection,
Afin de ne rater aucune sortie et préparer mes prochaines sorties cinéma depuis Cinook.

## Acceptance Criteria

### AC1 — Liste des films à l'affiche

**Given** l'écran Découverte (`app/(app)/discover.tsx`)
**When** je l'ouvre avec une connexion active
**Then** la liste des films en salle s'affiche via l'endpoint TMDB `now_playing` (proxié par Firebase Functions)
**And** chaque film affiche son affiche, son titre et sa date de sortie (FR24)

### AC2 — Fiche et actions d'ajout

**Given** la liste des films à l'affiche
**When** je sélectionne un film
**Then** sa fiche complète s'affiche (synopsis, réalisateur, durée)
**And** deux actions sont disponibles : "Ajouter à ma collection" et "Ajouter à À voir" (FR25)

### AC3 — Ajouter à la collection

**Given** l'action "Ajouter à ma collection" choisie
**When** je valide
**Then** le film est enregistré dans Firestore avec `addedVia: 'discover'`
**And** il apparaît immédiatement dans ma collection

### AC4 — Ajouter à la wishlist

**Given** l'action "Ajouter à À voir" choisie
**When** je valide
**Then** le film est enregistré avec le statut `wishlist` en un seul geste (NFR10)

### AC5 — Mode hors-ligne

**Given** l'écran Découverte ouvert sans connexion
**When** la liste ne peut pas être chargée
**Then** un message explicite s'affiche ("Connexion requise pour les films à l'affiche")
**And** aucun crash ne se produit (NFR18)

## Tasks / Subtasks

- [ ] **Task 1 — Ajouter `getNowPlaying` dans Firebase Functions** (AC1)
  - [ ] Nouvelle fonction HTTPS callable `getNowPlaying()` → `FunctionResponse<MediaResult[]>`
  - [ ] Appeler TMDB `GET /3/movie/now_playing?language=fr-FR&page=1`
  - [ ] Mapper résultats → `MediaResult[]`
  - [ ] Exporter depuis `functions/src/index.ts`

- [ ] **Task 2 — Ajouter `getNowPlaying` dans `lib/functions.ts`** (AC1)
  - [ ] `export const getNowPlaying = async (): Promise<FunctionResponse<MediaResult[]>>`

- [ ] **Task 3 — Implémenter `app/(app)/discover.tsx`** (AC1, AC5)
  - [ ] Charger la liste au montant via `getNowPlaying()`
  - [ ] `uiStore.loading.search` pendant le chargement
  - [ ] Afficher `NowPlayingCard` pour chaque film
  - [ ] Gestion offline : try/catch → message explicite si réseau absent

- [ ] **Task 4 — Composant `components/discovery/NowPlayingCard.tsx`** (AC1)
  - [ ] Affiche poster, titre, date de sortie
  - [ ] Tap → ouvrir fiche détail

- [ ] **Task 5 — Fiche film depuis Découverte** (AC2, AC3, AC4)
  - [ ] Modal ou navigation vers une fiche simplifiée
  - [ ] Deux boutons : "Ajouter à ma collection" (`addedVia: 'discover'`, `status: 'owned'`) et "Ajouter à À voir" (`status: 'wishlist'`)
  - [ ] Confirmation toast après ajout

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Test : getNowPlaying appelé au montant
  - [ ] Test : erreur réseau → message affiché, pas de crash
  - [ ] Test : "Ajouter" → addItem avec addedVia: 'discover'
  - [ ] Test : "À voir" → addItem avec status: 'wishlist'

## Dev Notes

### TMDB now_playing endpoint

```
GET https://api.themoviedb.org/3/movie/now_playing?language=fr-FR&page=1
Authorization: Bearer ${TMDB_API_KEY}
```

### Gestion offline dans discover.tsx

```typescript
try {
  const res = await getNowPlaying()
  if (res.success) setFilms(res.data)
  else addToast(res.error, 'error')
} catch {
  setOfflineError(true)
}
```

### References

- [Source: epics.md#Story 5.1]
- [Source: architecture.md#API & Communication Patterns] — Firebase Functions proxy TMDB
- [Source: story 2-1] — Firebase Functions pattern
- [Source: story 2-2] — addItem

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `functions/src/getNowPlaying.ts` (nouveau)
- `functions/src/index.ts` (export getNowPlaying)
- `lib/functions.ts` (ajout getNowPlaying)
- `app/(app)/discover.tsx` (stub → implémentation)
- `components/discovery/NowPlayingCard.tsx` (nouveau)
- `components/discovery/NowPlayingList.tsx` (nouveau)
