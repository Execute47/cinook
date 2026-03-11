# Story 3.5 : Statistiques et bilan annuel

Status: review

## Story

En tant qu'utilisatrice,
Je veux consulter un bilan de mes consommations culturelles pour une année donnée,
Afin de visualiser mon activité (comptages, tops, répartition mensuelle) et de faire le bilan d'une année ou de toute ma vie de lectrice/spectatrice.

## Acceptance Criteria

### AC1 — Accès permanent

**Given** l'utilisatrice est connectée
**When** elle navigue dans l'app
**Then** un accès permanent aux statistiques est disponible dans la navigation principale
**And** l'écran est accessible en 1 tap

> **Note d'implémentation :** la nav contient déjà 5 onglets (Accueil, Collection, Découverte, Cercle, Paramètres). Deux options acceptables :
> - Ajouter un 6e onglet "Stats" (ou "Bilan") — possible mais chargé sur petits écrans
> - Ajouter un bouton "Bilan" dans l'en-tête de l'écran Collection — plus épuré
> Le dev choisit l'option la plus adaptée visuellement ; les autres ACs restent identiques.

### AC2 — Sélecteur d'année

**Given** l'écran de statistiques est ouvert
**When** je consulte l'écran
**Then** l'année en cours est sélectionnée par défaut
**And** je peux naviguer vers les années précédentes (et suivantes si des données existent) via des boutons `< 2024  >` ou un sélecteur équivalent
**And** toutes les sections se recalculent instantanément au changement d'année

### AC3 — Comptages

**Given** une année sélectionnée
**When** l'écran affiche les statistiques
**Then** les comptages suivants sont affichés :
- Nombre de **films** vus (items `type === 'film'` avec `endedAt` dans l'année)
- Nombre de **séries** terminées (items `type === 'serie'` avec `endedAt` dans l'année)
- Nombre de **livres** lus (items `type === 'livre'` avec `endedAt` dans l'année)
- Total tous types confondus
**And** si aucun item pour l'année → afficher "Aucune activité enregistrée pour cette année"

### AC4 — Top tier et meilleure note

**Given** une année sélectionnée avec des items ayant `endedAt` dans l'année
**When** l'écran affiche la section "Mes tops"
**Then** sont affichés :
- **Meilleur tier** : item(s) avec le tier le plus élevé (priorité : diamond > gold > silver > bronze > seen > disliked > none) — si ex-aequo, afficher jusqu'à 3 items
- **Meilleure note** : item(s) avec la note (`rating`) la plus élevée — si ex-aequo, afficher jusqu'à 3 items
**And** chaque item affiché montre : titre, type, tier badge ou note
**And** si aucun item n'a de tier ou de note → la section correspondante est masquée

### AC5 — Activité par mois

**Given** une année sélectionnée avec des items ayant `endedAt` dans l'année
**When** l'écran affiche la section "Activité mensuelle"
**Then** un graphique en barres horizontal (ou vertical) affiche le nombre d'items terminés par mois (Jan → Déc)
**And** les mois sans activité affichent une barre vide (hauteur zéro)
**And** le mois le plus chargé a la barre la plus haute (échelle relative)
**And** chaque barre est labellisée (initiale du mois) et affiche le compte au-dessus si > 0

> **Note d'implémentation :** utiliser uniquement des composants `View` avec hauteur proportionnelle — pas de librairie de charts externe.

### AC6 — Données basées sur `endedAt`

**Given** le calcul des statistiques
**When** l'app filtre les items pour l'année sélectionnée
**Then** seuls les items avec `endedAt` défini ET dont `endedAt.toDate().getFullYear() === selectedYear` sont comptabilisés
**And** les items sans `endedAt` (ajoutés avant la Story 3.4 ou sans statut "Vu") ne sont **pas** comptabilisés — pas d'erreur, juste ignorés
**And** le filtre porte uniquement sur `endedAt`, pas sur `addedAt`

## Tasks / Subtasks

- [x] **Task 1 — Écran `app/(app)/stats.tsx`** (AC1, AC2, AC3, AC4, AC5)
  - [x] Créer l'écran avec ScrollView + fond `#0E0B0B`
  - [x] État `selectedYear: number` initialisé à `new Date().getFullYear()`
  - [x] Sélecteur d'année : boutons `<` / `>` avec label année au centre
  - [x] Désactiver `>` si `selectedYear >= currentYear` (pas de données futures)
  - [x] Section Comptages (AC3)
  - [x] Section Tops (AC4)
  - [x] Section Activité mensuelle (AC5)

- [x] **Task 2 — Hook ou helper `useYearStats(year: number)`** (AC3, AC4, AC5, AC6)
  - [x] Utiliser `useCollection()` comme source de données (pas de nouvelle requête Firestore)
  - [x] Filtrer : `item.endedAt && item.endedAt.toDate().getFullYear() === year`
  - [x] Retourner :
    ```typescript
    {
      counts: { film: number, serie: number, livre: number, total: number }
      topTier: MediaItem[]        // jusqu'à 3, tier le plus élevé
      topRating: MediaItem[]      // jusqu'à 3, note la plus élevée
      byMonth: number[]           // tableau de 12 valeurs (index 0 = janvier)
      hasData: boolean
    }
    ```
  - [x] Ordre de priorité des tiers : `['diamond','gold','silver','bronze','seen','disliked','none']`

- [x] **Task 3 — Intégration dans la navigation** (AC1)
  - [x] Ajouter l'accès à l'écran stats dans la nav principale
  - [x] Option A : nouveau `<Tabs.Screen name="stats" options={{ title: 'Bilan' }} />` dans `app/(app)/_layout.tsx`
  - [x] Choisir l'option la mieux adaptée visuellement (5 onglets existants)

- [x] **Task 4 — Composant barre mensuelle** (AC5)
  - [x] Composant `MonthBar` : props `count`, `label`, `maxCount`
  - [x] Hauteur = `(count / maxCount) * MAX_HEIGHT` (ex: MAX_HEIGHT = 80)
  - [x] Si `maxCount === 0` → toutes les barres à hauteur minimale (2px)
  - [x] Label initiale du mois sous la barre, count au-dessus si > 0

- [x] **Task 5 — Tests** (AC2, AC3, AC4, AC5, AC6)
  - [x] `useYearStats` : items sans `endedAt` → non comptabilisés
  - [x] `useYearStats` : items avec `endedAt` d'une autre année → non comptabilisés
  - [x] `useYearStats` : comptages corrects par type
  - [x] `useYearStats` : `byMonth` — item en mars → index 2 incrémenté
  - [x] `useYearStats` : topTier → diamond avant gold ; ex-aequo → max 3 items
  - [x] `useYearStats` : topRating → meilleure note uniquement ; items sans rating ignorés
  - [x] Sélecteur d'année : bouton `>` désactivé sur l'année courante

## Dev Notes

### Filtrage des items par année

```typescript
import { useCollection } from '@/hooks/useCollection'

function useYearStats(year: number) {
  const { items } = useCollection()
  const filtered = items.filter(
    (item) => item.endedAt && item.endedAt.toDate().getFullYear() === year
  )
  // ... calculs sur filtered
}
```

### Ordre des tiers (priorité décroissante)

```typescript
const TIER_RANK: Record<TierLevel, number> = {
  diamond: 6, gold: 5, silver: 4, bronze: 3, seen: 2, disliked: 1, none: 0,
}
```

### Calcul byMonth

```typescript
const byMonth = Array(12).fill(0)
filtered.forEach((item) => {
  const month = item.endedAt!.toDate().getMonth() // 0 = janvier
  byMonth[month]++
})
```

### Graphique en barres sans librairie

```tsx
const MAX_BAR_HEIGHT = 80
const maxCount = Math.max(...byMonth, 1)
// Pour chaque mois :
<View style={{ height: (count / maxCount) * MAX_BAR_HEIGHT, backgroundColor: '#FBBF24', minHeight: 2 }} />
```

### Dépendance sur Story 3.4

Cette story est fonctionnelle dès maintenant mais les statistiques seront vides pour les items ajoutés avant l'implémentation de Story 3.4 (absence de `endedAt`). C'est le comportement attendu — les dates s'accumuleront au fil de l'utilisation.

### References

- [Source: hooks/useCollection] — source unique des données, aucune requête Firestore supplémentaire
- [Source: types/media.ts] — TierLevel, MediaType, MediaItem.endedAt (Story 3.4)
- [Source: app/(app)/_layout.tsx] — navigation Tabs existante (5 onglets)
- [Source: story 3-4] — champ `endedAt` utilisé comme pivot des statistiques

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Test "tri décroissant par rating" corrigé : la spec dit "meilleure note = items au rang le plus haut (ex-aequo max 3)", pas un top-3 toutes notes confondues. Test mis à jour pour refléter la spec.
- Timeouts sur `settings.test.tsx` et `login.test.tsx` lors de l'exécution parallèle : préexistants, passent en isolation, sans lien avec cette story.

### Completion Notes List
- `hooks/useYearStats.ts` : hook pur basé sur `useCollection()`, calcule counts/topTier/topRating/byMonth/hasData via `useMemo`. Aucune requête Firestore supplémentaire.
- `components/stats/MonthBar.tsx` : composant barre proportionnelle, hauteur min 2px, count affiché si > 0.
- `app/(app)/stats.tsx` : écran ScrollView avec sélecteur d'année, sections Comptages/Tops/Activité mensuelle. Bouton `>` désactivé sur l'année courante.
- `app/(app)/_layout.tsx` : 6e onglet "Bilan" ajouté (Option A choisie — accès direct en 1 tap).
- 18 tests ajoutés (12 pour `useYearStats`, 6 pour `StatsScreen`), tous passent à 100%.

### File List

- `app/(app)/stats.tsx` (nouveau)
- `app/(app)/stats.test.tsx` (nouveau)
- `hooks/useYearStats.ts` (nouveau)
- `hooks/useYearStats.test.ts` (nouveau)
- `components/stats/MonthBar.tsx` (nouveau)
- `app/(app)/_layout.tsx` (modifié — ajout onglet Bilan)
