# Story 2.1 : Configuration des clients API — TMDB & Google Books

Status: done

## Story

En tant que développeuse,
Je veux configurer des clients API directs pour TMDB et Google Books dans l'app Expo,
Afin que la recherche et le scan puissent fonctionner sans passer par Firebase Functions.

## Acceptance Criteria

### AC1 — Interface unifiée `searchMedia`

**Given** une requête avec `query` et `type` (`film`, `serie`, `livre`)
**When** `searchMedia(params)` est appelé depuis `lib/mediaSearch.ts`
**Then** il retourne `{ success: true, data: MediaResult[] }` avec les résultats de TMDB ou Google Books selon le type
**And** les clés API sont dans `.env` avec préfixe `EXPO_PUBLIC_`

### AC2 — Barcode → résultat en < 3s

**Given** un barcode EAN-13 valide
**When** `getMediaByBarcode(barcode)` s'exécute
**Then** si barcode commence par `978`/`979` → route Google Books (ISBN)
**And** sinon → route TMDB (EAN)
**And** timeout 2500ms max par appel API externe
**And** retourne `{ success: true, data: MediaResult }`

### AC3 — API indisponible

**Given** une API tierce indisponible
**When** `searchMedia` ou `getMediaByBarcode` est appelé
**Then** retourne `{ success: false, error: "Service temporairement indisponible" }` sans crash (NFR14)

### AC4 — Clés dans `.env` / `.env.example`

**Given** le projet cloné
**When** `.env.example` est copié en `.env` et les clés remplies
**Then** l'app peut appeler TMDB et Google Books sans erreur d'authentification

## Tasks / Subtasks

- [x] **Task 1 — Supprimer l'ancienne architecture Firebase Functions**
  - [x] Supprimer `functions/` (répertoire complet)
  - [x] Supprimer `lib/functions.ts`
  - [x] Supprimer `lib/functions.test.ts`

- [x] **Task 2 — Créer `lib/tmdb.ts`** (AC1, AC2)
  - [x] Client TMDB avec `Authorization: Bearer ${EXPO_PUBLIC_TMDB_API_KEY}`
  - [x] `searchMovies(query)` → `MediaResult[]` (films)
  - [x] `searchTv(query)` → `MediaResult[]` (séries)
  - [x] `searchByEan(ean)` → `MediaResult | null`
  - [x] Mapper TMDB movie → `MediaResult`, TMDB tv → `MediaResult`

- [x] **Task 3 — Créer `lib/googleBooks.ts`** (AC1, AC2)
  - [x] Client Google Books avec `key=${EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY}`
  - [x] `searchBooks(query)` → `MediaResult[]`
  - [x] `searchByIsbn(isbn)` → `MediaResult | null`
  - [x] Mapper Google Books volume → `MediaResult`

- [x] **Task 4 — Créer `lib/mediaSearch.ts`** (AC1, AC2, AC3)
  - [x] `searchMedia({ query, type })` → `FunctionResponse<MediaResult[]>`
  - [x] Si `type === 'film'` → `searchMovies`, `'serie'` → `searchTv`, `'livre'` → `searchBooks`
  - [x] `getMediaByBarcode(barcode)` → `FunctionResponse<MediaResult>`
  - [x] Si barcode commence par `978`/`979` → `searchByIsbn`, sinon → `searchByEan`
  - [x] Timeout 2500ms max, try/catch → `{ success: false, error }`

- [x] **Task 5 — Clés API dans `.env` et `.env.example`** (AC4)
  - [x] Ajouter `EXPO_PUBLIC_TMDB_API_KEY=` dans `.env.example`
  - [x] Ajouter `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=` dans `.env.example`
  - [x] Ajouter les vrais placeholders dans `.env`

- [x] **Task 6 — Tests** (tous ACs)
  - [x] `lib/tmdb.test.ts` : mock fetch, vérifier mapping TMDB movie → MediaResult
  - [x] `lib/tmdb.test.ts` : vérifier mapping TMDB tv → MediaResult
  - [x] `lib/tmdb.test.ts` : searchByEan → premier résultat / null
  - [x] `lib/googleBooks.test.ts` : mock fetch, vérifier mapping volume → MediaResult
  - [x] `lib/googleBooks.test.ts` : searchByIsbn → résultat / null
  - [x] `lib/mediaSearch.test.ts` : film → searchMovies, serie → searchTv, livre → searchBooks
  - [x] `lib/mediaSearch.test.ts` : ISBN → searchByIsbn, EAN → searchByEan
  - [x] `lib/mediaSearch.test.ts` : erreur API → `{ success: false, error }`

## Dev Notes

### Types (existants dans `types/api.ts`)

```typescript
type FunctionResponse<T> = { success: true; data: T } | { success: false; error: string }

interface MediaResult {
  title: string; type: MediaType; poster?: string; synopsis?: string
  director?: string; author?: string; year?: number
  tmdbId?: string; googleBooksId?: string; isbn?: string
}

interface SearchParams { query: string; type: MediaType }
```

### Variables d'environnement Expo

```
EXPO_PUBLIC_TMDB_API_KEY=...
EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=...
```

Accès côté client : `process.env.EXPO_PUBLIC_TMDB_API_KEY`

### TMDB API

- Films : `GET https://api.themoviedb.org/3/search/movie?query={q}&language=fr-FR`
- Séries : `GET https://api.themoviedb.org/3/search/tv?query={q}&language=fr-FR`
- Auth header : `Authorization: Bearer ${EXPO_PUBLIC_TMDB_API_KEY}`
- Poster : `https://image.tmdb.org/t/p/w500{poster_path}`

### Google Books API

- `GET https://www.googleapis.com/books/v1/volumes?q={query}&key=${EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY}`
- `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key=...`

### Détection ISBN vs EAN

```typescript
const isISBN = (barcode: string) =>
  barcode.startsWith('978') || barcode.startsWith('979')
```

### References

- [Source: epics.md#Story 2.1] — architecture révisée, sans Firebase Functions
- [Source: architecture.md#API & Communication Patterns] — FunctionResponse<T>

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Architecture migrée : Firebase Functions proxy → clients API directs Expo
- Timer leak dans tests (withTimeout setTimeout) : bénin, tous les tests passent

### Completion Notes List
- Supprimé `functions/` (Firebase Functions) et `lib/functions.ts` + `lib/functions.test.ts`
- Créé `lib/tmdb.ts` : clients TMDB (film, serie, EAN) avec `EXPO_PUBLIC_TMDB_API_KEY`, mappers movie/tv → `MediaResult`
- Créé `lib/googleBooks.ts` : clients Google Books (query, ISBN) avec `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`, mapper volume → `MediaResult`
- Créé `lib/mediaSearch.ts` : interface unifiée `searchMedia` + `getMediaByBarcode`, timeout 2500ms, try/catch → `{ success: false }`
- Mis à jour `.env` et `.env.example` : ajout `EXPO_PUBLIC_TMDB_API_KEY` et `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`
- 26 tests nouveaux : 10 tmdb + 8 googleBooks + 8 mediaSearch — 55/55 suite complète, zéro régression

### File List

- `lib/tmdb.ts` (nouveau)
- `lib/googleBooks.ts` (nouveau)
- `lib/mediaSearch.ts` (nouveau)
- `lib/tmdb.test.ts` (nouveau)
- `lib/googleBooks.test.ts` (nouveau)
- `lib/mediaSearch.test.ts` (nouveau)
- `.env` (ajout clés)
- `.env.example` (ajout clés)
- `functions/` (supprimé)
- `lib/functions.ts` (supprimé)
- `lib/functions.test.ts` (supprimé)
