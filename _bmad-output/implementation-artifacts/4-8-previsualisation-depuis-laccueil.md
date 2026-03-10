# Story 4.8 : Prévisualisation d'un item depuis l'accueil

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux pouvoir taper sur un item du Cinéclub ou d'une recommandation pour consulter ses informations (synopsis, réalisateur, etc.),
Afin de décider si je veux l'ajouter à ma collection avant de le faire.

## Dépendances

- **Story 2.7** (Prévention des doublons) — le helper `findDuplicate` est utilisé pour savoir si l'item est déjà dans la collection et proposer la navigation vers la fiche existante.
- **Story 4.7** (Cinéclub confirmation et retrait) — `itemType` est déjà ajouté au document Cinéclub dans cette story. Les champs enrichis ici s'y ajoutent.

## Acceptance Criteria

### AC1 — Enrichissement des documents à l'écriture

**Given** un item est mis en Cinéclub via `CineclubButton`
**When** le `setDoc` est exécuté
**Then** les champs suivants sont stockés en plus des champs existants :
`synopsis`, `year`, `director` (film/série) ou `author` (livre), `tmdbId`, `googleBooksId`, `isbn`
(tous optionnels — stockés uniquement si présents sur l'item)

**Given** une recommandation est envoyée via `RecoComposer`
**When** le `addDoc` est exécuté
**Then** les mêmes champs enrichis sont stockés, plus `itemType: MediaType`

### AC2 — Cartes cliquables sur l'accueil

**Given** l'écran d'accueil
**When** je tape sur la bannière Cinéclub (hors boutons "Retirer" et "+ À voir")
**Then** je suis naviguée vers l'écran de prévisualisation de l'item

**When** je tape sur une carte de recommandation (hors bouton "+ À voir")
**Then** je suis naviguée vers l'écran de prévisualisation de l'item

### AC3 — Écran de prévisualisation (read-only)

**Given** la navigation vers `/item/preview`
**When** l'écran s'affiche
**Then** les informations suivantes sont visibles (si disponibles) :
- Affiche (poster)
- Titre
- Badge type (Film / Série / Livre)
- Année
- Réalisateur ou Auteur
- Synopsis
- "Recommandé par {fromUserName}" (si c'est une recommandation) ou "En Cinéclub · Mis en avant par {postedBy}"

**And** aucun champ de notation, statut ou modification n'est affiché (lecture seule)

### AC4 — Navigation contextuelle depuis la prévisualisation

**Given** l'écran de prévisualisation
**When** l'item est déjà dans ma collection (détecté via `findDuplicate`)
**Then** un bouton "Voir dans ma collection" s'affiche, qui navigue vers `/(app)/item/[id]`
**And** le bouton "Ajouter à ma collection" n'est pas affiché

**When** l'item n'est pas dans ma collection
**Then** un bouton "Ajouter à ma collection" s'affiche, qui ajoute l'item avec `status: 'owned'`
**And** après ajout réussi, navigation vers la fiche créée `/(app)/item/[id]`

### AC5 — Rétrocompatibilité des anciens documents

**Given** un document Cinéclub ou une recommandation créée avant cette story (sans champs enrichis)
**When** l'utilisatrice tape dessus
**Then** l'écran de prévisualisation s'affiche avec les champs disponibles (titre, affiche)
**And** les champs absents sont simplement masqués (pas d'erreur)

## Tasks / Subtasks

- [ ] **Task 1 — Enrichissement de `CineclubButton.tsx`** (AC1)
  - [ ] Ajouter dans le payload `setDoc` : `synopsis: item.synopsis ?? null`, `year: item.year ?? null`, `director: item.director ?? null`, `author: item.author ?? null`, `tmdbId: item.tmdbId ?? null`, `googleBooksId: item.googleBooksId ?? null`, `isbn: item.isbn ?? null`

- [ ] **Task 2 — Enrichissement de `RecoComposer.tsx`** (AC1)
  - [ ] Ajouter dans le payload `addDoc` : `itemType: item.type`, `synopsis: item.synopsis ?? null`, `year: item.year ?? null`, `director: item.director ?? null`, `author: item.author ?? null`, `tmdbId: item.tmdbId ?? null`, `googleBooksId: item.googleBooksId ?? null`, `isbn: item.isbn ?? null`

- [ ] **Task 3 — Mise à jour des interfaces** (AC1, AC3, AC5)
  - [ ] `hooks/useCineclub.ts` — ajouter à `Cineclub` : `synopsis?: string | null`, `year?: number | null`, `director?: string | null`, `author?: string | null`, `tmdbId?: string | null`, `googleBooksId?: string | null`, `isbn?: string | null`
  - [ ] `hooks/useRecommendations.ts` — ajouter à `Recommendation` : `itemType?: MediaType`, `synopsis?: string | null`, `year?: number | null`, `director?: string | null`, `author?: string | null`, `tmdbId?: string | null`, `googleBooksId?: string | null`, `isbn?: string | null`

- [ ] **Task 4 — Créer `app/item/preview.tsx`** (AC3, AC4, AC5)
  - [ ] Lire les params Expo Router : `title`, `type`, `poster?`, `synopsis?`, `year?`, `director?`, `author?`, `tmdbId?`, `googleBooksId?`, `isbn?`, `source?` (valeur : `'cineclub'` ou `'reco'`), `sourceName?` (postedBy ou fromUserName)
  - [ ] Utiliser `useCollection` + `findDuplicate` pour détecter si l'item est déjà en collection
  - [ ] Afficher les informations disponibles (masquer les champs `null`/`undefined`)
  - [ ] Bouton "Voir dans ma collection" si doublon → `router.push('/(app)/item/' + existingItem.id)`
  - [ ] Bouton "Ajouter à ma collection" sinon → `addItem(uid, {..., status: 'owned', tier: 'none', addedVia: 'discover'})` → `router.replace('/(app)/item/' + newId)`
  - [ ] Bouton "← Retour" (header)
  - [ ] Déclarer la route dans `app/(app)/_layout.tsx` : `<Tabs.Screen name="item/preview" options={{ href: null }} />`

- [ ] **Task 5 — Mise à jour `CineclubBanner.tsx`** (AC2)
  - [ ] Ajouter prop `onPress: () => void`
  - [ ] Envelopper le contenu de la bannière dans un `TouchableOpacity` qui appelle `onPress`
  - [ ] S'assurer que les boutons "Retirer" et "+ À voir" stoppent la propagation (`e.stopPropagation()` ou structure imbriquée)

- [ ] **Task 6 — Mise à jour `RecoCard.tsx`** (AC2)
  - [ ] Ajouter prop `onPress: () => void`
  - [ ] Envelopper la zone titre+affiche+expéditeur dans un `TouchableOpacity` (pas le bouton "+ À voir")

- [ ] **Task 7 — Mise à jour `app/(app)/index.tsx`** (AC2)
  - [ ] Handler `handleCineclubPress()` → `router.push({ pathname: '/item/preview', params: { title: cineclub.itemTitle, type: cineclub.itemType ?? 'film', poster: cineclub.itemPoster, synopsis: cineclub.synopsis, year: cineclub.year, director: cineclub.director, author: cineclub.author, tmdbId: cineclub.tmdbId, googleBooksId: cineclub.googleBooksId, isbn: cineclub.isbn, source: 'cineclub', sourceName: cineclub.postedBy } })`
  - [ ] Handler `handleRecoPress(reco)` → même pattern avec les champs de la recommandation
  - [ ] Passer `onPress` à `CineclubBanner` et à chaque `RecoCard`

- [ ] **Task 8 — Tests** (AC1, AC2, AC3, AC4, AC5)
  - [ ] `CineclubButton` : payload setDoc contient `synopsis`, `year`, `director`, `tmdbId`, etc.
  - [ ] `RecoComposer` : payload addDoc contient `itemType`, `synopsis`, `year`, etc.
  - [ ] `CineclubBanner` : tap sur la carte → `onPress` appelé ; tap sur "+ À voir" → `onAddToWishlist` appelé, pas `onPress`
  - [ ] `RecoCard` : tap sur la zone info → `onPress` appelé ; tap sur "+ À voir" → `onAddToWishlist` appelé, pas `onPress`
  - [ ] preview.tsx : item en collection → bouton "Voir dans ma collection" affiché, pas "Ajouter"
  - [ ] preview.tsx : item absent → bouton "Ajouter à ma collection" affiché
  - [ ] preview.tsx : champs null → pas d'erreur, champs simplement absents du rendu

## Dev Notes

### Passage des params vers /item/preview

Expo Router params sont des strings. Convertir les valeurs non-string :

```typescript
router.push({
  pathname: '/item/preview',
  params: {
    title: cineclub.itemTitle,
    type: cineclub.itemType ?? 'film',
    poster: cineclub.itemPoster ?? '',
    synopsis: cineclub.synopsis ?? '',
    year: String(cineclub.year ?? ''),
    director: cineclub.director ?? '',
    author: cineclub.author ?? '',
    tmdbId: cineclub.tmdbId ?? '',
    googleBooksId: cineclub.googleBooksId ?? '',
    isbn: cineclub.isbn ?? '',
    source: 'cineclub',
    sourceName: cineclub.postedBy,
  }
})
```

Dans `preview.tsx`, lire et re-typer :
```typescript
const params = useLocalSearchParams<{ title: string; type: string; year: string; ... }>()
const year = params.year ? parseInt(params.year, 10) : undefined
const poster = params.poster || undefined  // '' → undefined pour masquer
```

### Stopper la propagation dans CineclubBanner

React Native ne supporte pas `e.stopPropagation()` nativement sur les événements de presse. Utiliser une structure qui évite l'imbrication problématique :

```tsx
// Option : TouchableOpacity wrapper + zIndex ou onStartShouldSetResponder
// Option simple : passer onPress uniquement sur la zone non-bouton
<TouchableOpacity onPress={onPress} activeOpacity={0.8}>
  {/* contenu */}
  <View>
    {/* Les boutons internes utilisent leur propre onPress sans problème */}
    {/* car React Native remonte l'événement au premier handler touché */}
    {/* → utiliser des TouchableOpacity pour les boutons enfants suffit */}
  </View>
</TouchableOpacity>
```

En React Native, un `TouchableOpacity` enfant capture l'événement avant le parent — pas besoin de stopPropagation.

### Enregistrement de la route dans _layout.tsx

```tsx
<Tabs.Screen name="item/preview" options={{ href: null }} />
```

### References

- [Source: components/circle/CineclubButton.tsx] — payload setDoc actuel
- [Source: components/circle/RecoComposer.tsx] — payload addDoc actuel
- [Source: hooks/useCineclub.ts] — interface Cineclub
- [Source: hooks/useRecommendations.ts] — interface Recommendation
- [Source: components/circle/CineclubBanner.tsx] — structure Props
- [Source: components/circle/RecoCard.tsx] — structure Props
- [Source: app/(app)/index.tsx] — handlers existants, intégration composants
- [Source: app/(app)/item/[id].tsx] — référence pour le layout de la prévisualisation (read-only)
- [Source: story 2-7] — findDuplicate, DuplicateCandidate

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `hooks/useCineclub.ts` (modification — champs enrichis)
- `hooks/useRecommendations.ts` (modification — champs enrichis)
- `components/circle/CineclubButton.tsx` (modification — payload setDoc enrichi)
- `components/circle/RecoComposer.tsx` (modification — payload addDoc enrichi)
- `components/circle/CineclubBanner.tsx` (modification — prop onPress)
- `components/circle/RecoCard.tsx` (modification — prop onPress)
- `app/(app)/index.tsx` (modification — handlers press + passage props)
- `app/item/preview.tsx` (nouveau)
- `app/(app)/_layout.tsx` (modification — déclarer route preview)
