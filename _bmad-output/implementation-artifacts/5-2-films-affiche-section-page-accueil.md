# Story 5.2 : Films à l'affiche — section sur la page d'accueil

Status: review

## Story

En tant qu'utilisatrice,
je veux voir les films à l'affiche directement sur ma page d'accueil,
afin de découvrir les nouveautés sans avoir à naviguer vers un onglet dédié.

## Acceptance Criteria

1. L'onglet "Découverte" est supprimé de la barre de navigation principale.
2. La page d'accueil affiche une section "Films à l'affiche" sous les recommandations, avec un scroll horizontal de cartes compactes.
3. Le chargement de la section films est non-bloquant : la page s'affiche immédiatement, la section apparaît quand les données sont prêtes (ActivityIndicator local à la section).
4. En cas d'erreur réseau/offline, la section affiche un message discret sans perturber le reste de la page.
5. Un tap sur une carte ouvre le même bottom-sheet/modal de détail qu'actuellement dans `discover.tsx` (titre, synopsis, réalisateur, boutons "Ajouter à ma collection" et "Ajouter à À voir").
6. La duplication est vérifiée avant ajout (même logique que pour les recommandations dans `index.tsx`).
7. La route `/discover` est masquée de la navigation (tab `href: null`) mais la page peut rester en place pour éviter les erreurs de build.
8. Le fichier `discover.tsx` peut rester inchangé — seule la navigation change.

## Tasks / Subtasks

- [x] Task 1 — Supprimer l'onglet Découverte (AC: 1, 7)
  - [x] Dans `app/(app)/_layout.tsx`, passer l'option `href: null` sur le `<Tabs.Screen name="discover" />`
- [x] Task 2 — Créer le composant `NowPlayingSection` (AC: 2, 3, 4)
  - [x] Créer `components/discovery/NowPlayingSection.tsx`
  - [x] Charger `getNowPlaying()` via `useEffect` au montage (même logique que dans `discover.tsx`)
  - [x] Afficher un `ActivityIndicator` pendant le chargement, un message discret si erreur
  - [x] Scroll horizontal avec `FlatList` horizontal ou `ScrollView` horizontal de `NowPlayingCard` compactes
- [x] Task 3 — Intégrer `NowPlayingSection` dans la page d'accueil (AC: 2, 5, 6)
  - [x] Dans `app/(app)/index.tsx`, importer et monter `<NowPlayingSection>` sous la section recommandations
  - [x] Passer un callback `onSelectFilm` qui ouvre le même `Modal` de détail déjà présent dans `discover.tsx`
  - [x] Réutiliser `handleAdd` de `discover.tsx` — le porter dans `index.tsx` (ou dans `NowPlayingSection`)
  - [x] Vérifier les doublons avec `findDuplicate` (déjà utilisé dans `index.tsx` pour les recos)

## Dev Notes

### Architecture & contraintes

- **Ne pas supprimer `discover.tsx`** : le fichier doit rester pour éviter une erreur de build Expo Router (route manquante). Masquer simplement via `href: null` dans le layout.
- **Pattern tab masqué** : déjà utilisé dans `_layout.tsx` pour `member/[uid]`, `item/[id]`, `item/preview` — appliquer le même pattern à `discover`.
- **`getNowPlaying()`** est dans `lib/tmdb.ts` et appelle la Firebase Function — garder tel quel, aucun changement côté API.
- **`NowPlayingCard`** existe déjà dans `components/discovery/NowPlayingCard.tsx` — réutiliser directement.
- **Modal de détail** : la logique est actuellement dans `discover.tsx` (state `selected`, `handleAdd`, `adding`). Porter ce state dans `NowPlayingSection` ou dans `index.tsx` selon préférence.
- **Vérification doublons** : `findDuplicate(items, {...})` est déjà importé dans `index.tsx` pour les recommandations — réutiliser le même pattern.

### Fichiers impactés

| Fichier | Action |
|---|---|
| `app/(app)/_layout.tsx` | Ajouter `href: null` sur le screen `discover` |
| `app/(app)/index.tsx` | Ajouter `<NowPlayingSection>` + état `selectedFilm` + `handleAddFilm` |
| `components/discovery/NowPlayingSection.tsx` | Créer (nouveau composant) |
| `app/(app)/discover.tsx` | Aucun changement (garder en place) |
| `components/discovery/NowPlayingCard.tsx` | Aucun changement (réutiliser) |

### Composant NowPlayingSection — structure suggérée

```tsx
// components/discovery/NowPlayingSection.tsx
export function NowPlayingSection({ onSelectFilm }: { onSelectFilm: (film: MediaResult) => void }) {
  const [films, setFilms] = useState<MediaResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getNowPlaying()
      .then(setFilms)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className="mb-6">
      <Text className="text-white font-semibold mb-3">Films à l'affiche</Text>
      {loading && <ActivityIndicator color="#f59e0b" />}
      {error && <Text className="text-[#6B5E5E] text-sm">Connexion requise</Text>}
      {!loading && !error && (
        <FlatList
          horizontal
          data={films}
          keyExtractor={(f) => String(f.tmdbId ?? f.title)}
          renderItem={({ item }) => (
            <NowPlayingCard film={item} onPress={() => onSelectFilm(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        />
      )}
    </View>
  )
}
```

### Intégration dans index.tsx — diff minimum

```tsx
// Ajouter dans index.tsx :
const [selectedFilm, setSelectedFilm] = useState<MediaResult | null>(null)
const [addingFilm, setAddingFilm] = useState(false)

const handleAddFilm = async (status: 'owned' | 'wishlist') => {
  if (!uid || !selectedFilm) return
  setAddingFilm(true)
  try {
    const duplicate = findDuplicate(items, { title: selectedFilm.title, type: 'film', tmdbId: selectedFilm.tmdbId ?? undefined })
    if (duplicate) { showDuplicateMessage(); setSelectedFilm(null); return }
    await addItem(uid, { title: selectedFilm.title, type: 'film', poster: selectedFilm.poster,
      synopsis: selectedFilm.synopsis, director: selectedFilm.director, year: selectedFilm.year,
      tmdbId: selectedFilm.tmdbId, status, tier: 'none', addedVia: 'discover' })
    addToast(status === 'owned' ? 'Ajouté à ta collection !' : 'Ajouté à ta liste À voir !', 'success')
    setSelectedFilm(null)
  } catch { addToast('Erreur lors de l\'ajout', 'error') }
  finally { setAddingFilm(false) }
}
```

### Pattern tab masqué (référence existante)

```tsx
// _layout.tsx — pattern déjà utilisé (lignes 63-65) :
<Tabs.Screen name="member/[uid]" options={{ href: null }} />
<Tabs.Screen name="item/[id]" options={{ href: null }} />
<Tabs.Screen name="item/preview" options={{ href: null }} />

// À appliquer identiquement :
<Tabs.Screen name="discover" options={{ href: null }} />
```

### Style des cartes dans le scroll horizontal

Les `NowPlayingCard` actuelles sont en style liste (full-width). Pour le scroll horizontal, adapter la largeur à ~120-140px (affiche portrait) dans `NowPlayingSection` via une prop `compact` ou un style `style={{ width: 130 }}` sur le conteneur.

### Imports nécessaires dans index.tsx

```tsx
import { getNowPlaying } from '@/lib/tmdb'          // déjà dans discover.tsx
import { NowPlayingSection } from '@/components/discovery/NowPlayingSection'
import type { MediaResult } from '@/types/api'       // déjà dans discover.tsx
// addItem, findDuplicate, useUIStore déjà importés dans index.tsx
```

### Project Structure Notes

- Alignement avec la structure existante : composants discovery dans `components/discovery/`
- `NowPlayingSection` suit le pattern des autres composants de section de l'accueil (`CineclubBanner`, `RecoCard`)
- Pas de nouveau hook nécessaire — logique inline dans le composant suffisante

### References

- Pattern onglet masqué : `app/(app)/_layout.tsx` lignes 63-65
- Logique discover existante : `app/(app)/discover.tsx` (à ne pas supprimer)
- Modal de détail : `app/(app)/discover.tsx` lignes 97-165
- `getNowPlaying` : `lib/tmdb.ts`
- `NowPlayingCard` : `components/discovery/NowPlayingCard.tsx`
- `findDuplicate` : `lib/duplicates.ts` (utilisé dans `index.tsx`)
- `addItem` : `lib/firestore.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
