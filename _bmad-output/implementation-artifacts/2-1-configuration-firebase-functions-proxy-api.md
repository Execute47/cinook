# Story 2.1 : Configuration Firebase Functions — Proxy API

Status: ready-for-dev

## Story

En tant que développeuse,
Je veux configurer Firebase Functions comme proxy pour TMDB et Google Books,
Afin que les clés API ne soient jamais exposées côté client et que le scan et la recherche puissent fonctionner.

## Acceptance Criteria

### AC1 — Functions déployées et fonctionnelles

**Given** un projet Firebase configuré (Story 1.1)
**When** les Firebase Functions sont déployées avec `searchMedia(query, type)` et `getMediaByBarcode(barcode)`
**Then** un appel depuis le client via `lib/functions.ts` retourne un `FunctionResponse<MediaResult[]>` valide
**And** les clés TMDB et Google Books sont uniquement dans `functions/.env`, jamais dans le code client (NFR8)

### AC2 — Barcode → résultat en < 3s

**Given** une Function appelée avec un barcode EAN-13 valide
**When** `getMediaByBarcode` s'exécute
**Then** la Function interroge Google Books (ISBN) ou TMDB (EAN DVD/Blu-ray) et retourne `{ success: true, data: MediaResult }`
**And** la réponse est reçue en moins de 3 secondes sur connexion 4G standard (NFR1)

### AC3 — API indisponible

**Given** une API tierce indisponible
**When** la Function est appelée
**Then** elle retourne `{ success: false, error: "Service temporairement indisponible" }` sans crash (NFR14)

## Tasks / Subtasks

- [ ] **Task 1 — Implémenter `functions/src/searchMedia.ts`** (AC1, AC3)
  - [ ] Fonction HTTPS callable `searchMedia({ query, type })` → `FunctionResponse<MediaResult[]>`
  - [ ] Si `type === 'film' | 'serie'` → appeler TMDB `/search/movie` ou `/search/tv`
  - [ ] Si `type === 'livre'` → appeler Google Books `/volumes?q=`
  - [ ] Mapper les résultats vers `MediaResult[]`
  - [ ] Try/catch sur chaque appel API → retourner `{ success: false, error }` si échec

- [ ] **Task 2 — Implémenter `functions/src/getMediaByBarcode.ts`** (AC2, AC3)
  - [ ] Fonction HTTPS callable `getMediaByBarcode({ barcode })` → `FunctionResponse<MediaResult>`
  - [ ] Si barcode commence par `978` ou `979` → ISBN → Google Books
  - [ ] Sinon → EAN DVD/Blu-ray → TMDB search par EAN (ou recherche titre si non trouvé)
  - [ ] Timeout 2500ms max par appel API externe
  - [ ] Try/catch → `{ success: false, error }` si échec

- [ ] **Task 3 — Utilitaires API** (AC1, AC2)
  - [ ] `functions/src/utils/tmdb.ts` — client TMDB avec `Authorization: Bearer ${TMDB_API_KEY}`
  - [ ] `functions/src/utils/googleBooks.ts` — client Google Books avec `key=${GOOGLE_BOOKS_API_KEY}`
  - [ ] Mapper TMDB movie → `MediaResult` et TMDB tv → `MediaResult`
  - [ ] Mapper Google Books volume → `MediaResult`

- [ ] **Task 4 — Exporter depuis index.ts** (AC1)
  - [ ] `functions/src/index.ts` — exporter `searchMedia` et `getMediaByBarcode`
  - [ ] Déployer : `firebase deploy --only functions`

- [ ] **Task 5 — Implémenter `lib/functions.ts` côté client** (AC1)
  - [ ] `import { getFunctions, httpsCallable } from 'firebase/functions'`
  - [ ] Exporter `searchMedia(params: SearchParams): Promise<FunctionResponse<MediaResult[]>>`
  - [ ] Exporter `getMediaByBarcode(barcode: string): Promise<FunctionResponse<MediaResult>>`

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Tests unitaires Functions : mock fetch, vérifier mapping TMDB → MediaResult
  - [ ] Tests unitaires Functions : mock fetch, vérifier mapping Google Books → MediaResult
  - [ ] Test : barcode ISBN → route Google Books
  - [ ] Test : barcode EAN non-ISBN → route TMDB
  - [ ] Test : fetch échoue → `{ success: false, error }`
  - [ ] Test client : `lib/functions.ts` appelle la bonne Function

## Dev Notes

### Type FunctionResponse (rappel — défini dans types/api.ts)

```typescript
type FunctionResponse<T> = { success: true; data: T } | { success: false; error: string }
```

### Firebase Functions v6 (callable)

```typescript
// functions/src/searchMedia.ts
import { onCall } from 'firebase-functions/v2/https'

export const searchMedia = onCall(async (request) => {
  const { query, type } = request.data
  try {
    // ... appel TMDB ou Google Books
    return { success: true, data: results }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Service temporairement indisponible' }
  }
})
```

### Détection ISBN vs EAN

```typescript
const isISBN = (barcode: string) =>
  barcode.startsWith('978') || barcode.startsWith('979')
```

### Client Functions côté app

```typescript
// lib/functions.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase' // exporter app depuis firebase.ts
import type { FunctionResponse, MediaResult, SearchParams } from '@/types/api'

const functions = getFunctions(app)

export const searchMedia = async (params: SearchParams): Promise<FunctionResponse<MediaResult[]>> => {
  const fn = httpsCallable<SearchParams, FunctionResponse<MediaResult[]>>(functions, 'searchMedia')
  const result = await fn(params)
  return result.data
}
```

### TMDB API endpoints

- Films : `GET https://api.themoviedb.org/3/search/movie?query={q}&language=fr-FR`
- Séries : `GET https://api.themoviedb.org/3/search/tv?query={q}&language=fr-FR`
- Poster : `https://image.tmdb.org/t/p/w500{poster_path}`
- Auth header : `Authorization: Bearer ${process.env.TMDB_API_KEY}`

### Google Books API endpoint

- `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key=${GOOGLE_BOOKS_API_KEY}`
- `GET https://www.googleapis.com/books/v1/volumes?q={query}&key=${GOOGLE_BOOKS_API_KEY}`

### Modification requise dans lib/firebase.ts

Exporter `app` en plus de `db` et `auth` :
```typescript
export { app, db }
export const auth = getAuth(app)
```

### References

- [Source: epics.md#Story 2.1]
- [Source: architecture.md#API & Communication Patterns] — FunctionResponse<T>, Functions MVP
- [Source: architecture.md#Architectural Boundaries] — Frontière API, clés dans functions/.env
- [Source: story 1-1] — structure functions/

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `functions/src/index.ts`
- `functions/src/searchMedia.ts` (nouveau)
- `functions/src/getMediaByBarcode.ts` (nouveau)
- `functions/src/utils/tmdb.ts` (nouveau)
- `functions/src/utils/googleBooks.ts` (nouveau)
- `lib/firebase.ts` (exporter `app`)
- `lib/functions.ts` (stub → implémentation)
