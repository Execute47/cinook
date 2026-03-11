# Story 5.1 : Parcourir les films à l'affiche et les ajouter

Status: review

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

- [x] **Task 1 — `getNowPlaying` dans `lib/tmdb.ts`** (AC1) *(adapté — Firebase Functions supprimées en story 2-1)*
  - [x] `export async function getNowPlaying(): Promise<MediaResult[]>`
  - [x] Appeler TMDB `GET /3/movie/now_playing?language=fr-FR&page=1`
  - [x] Mapper résultats → `MediaResult[]` (réutilise `mapMovie`, ajoute `releaseDate`)
  - [x] `releaseDate?: string` ajouté à `types/api.ts#MediaResult`

- [x] **Task 2 — N/A** (lib/functions.ts supprimé en story 2-1)

- [x] **Task 3 — Implémenter `app/(app)/discover.tsx`** (AC1, AC5)
  - [x] Charger la liste au montage via `getNowPlaying()`
  - [x] `uiStore.loading.search` pendant le chargement
  - [x] Afficher `NowPlayingCard` pour chaque film
  - [x] Gestion offline : try/catch → message explicite si réseau absent

- [x] **Task 4 — Composant `components/discovery/NowPlayingCard.tsx`** (AC1)
  - [x] Affiche poster, titre, date de sortie (formatée fr-FR)
  - [x] Tap → ouvrir fiche détail (Modal)

- [x] **Task 5 — Fiche film depuis Découverte** (AC2, AC3, AC4)
  - [x] Modal slide-up avec synopsis, réalisateur, année
  - [x] Bouton "Ajouter à ma collection" (`addedVia: 'discover'`, `status: 'owned'`)
  - [x] Bouton "Ajouter à À voir" (`status: 'wishlist'`)
  - [x] Toast de confirmation après ajout

- [x] **Task 6 — Tests** (tous ACs)
  - [x] `getNowPlaying` appelé au montage
  - [x] Films retournés affichés
  - [x] Erreur réseau → message affiché, pas de crash
  - [x] "Ajouter à ma collection" → addItem avec `addedVia: 'discover'`, `status: 'owned'`
  - [x] "Ajouter à À voir" → addItem avec `status: 'wishlist'`

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
claude-sonnet-4-6

### Debug Log References
- Architecture Firebase Functions obsolète : Tasks 1 et 2 adaptées — `getNowPlaying` ajouté directement dans `lib/tmdb.ts` (même pattern que `searchMovies`), conforme à l'architecture mise en place en story 2-1.
- `SafeAreaView` (react-native) remplacé par `View` dans le modal — deprecation warning éliminé.

### Completion Notes List
- `lib/tmdb.ts` : `getNowPlaying()` ajouté. `mapMovie` mis à jour avec `releaseDate`. `types/api.ts#MediaResult` enrichi de `releaseDate?: string`.
- `components/discovery/NowPlayingCard.tsx` : carte film avec poster, titre, date formatée fr-FR. Tap → Modal.
- `app/(app)/discover.tsx` : liste films à l'affiche + Modal fiche complète avec 2 boutons d'ajout. Gestion offline par try/catch.
- 11 nouveaux tests ajoutés (4 dans tmdb.test.ts, 6 dans discover.test.tsx), 249 tests passent au total.

### File List

- `lib/tmdb.ts` (modifié — ajout `getNowPlaying`, `releaseDate` dans `mapMovie`)
- `lib/tmdb.test.ts` (modifié — 4 tests `getNowPlaying`)
- `types/api.ts` (modifié — `releaseDate?: string` dans `MediaResult`)
- `app/(app)/discover.tsx` (modifié — stub → implémentation complète)
- `app/(app)/discover.test.tsx` (nouveau — 6 tests AC1/AC3/AC4/AC5)
- `components/discovery/NowPlayingCard.tsx` (nouveau)
