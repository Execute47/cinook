# Story 7.1 : Stylisation et Modernisation UI

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisatrice de Cinook,
je veux une interface plus moderne, cohérente et expressive,
afin que l'app soit agréable à utiliser au quotidien et reflète la qualité du contenu qu'elle contient.

## Acceptance Criteria

1. **AC1 — Icônes sur la tab bar** : Les 6 onglets de la tab bar affichent chacun une icône Ionicons pertinente (en plus ou à la place du texte), colorée en amber-400 quand actif, en #6B5E5E quand inactif.

2. **AC2 — Icônes dans les boutons d'action (collection)** : Les boutons 🔍, 📷, ✏️ dans le header de la page Collection sont remplacés par des icônes Ionicons (`search`, `barcode`, `create-outline`) de taille appropriée (20px).

3. **AC3 — Chevrons à la place des flèches texte** : Toutes les occurrences de `→` ou `>` utilisées comme indicateurs de navigation (ex : `→ {loanTo}` dans ItemCard, flèches dans d'autres composants) sont remplacées par une icône Ionicons `chevron-forward` ou `arrow-forward`.

4. **AC4 — Icône ⭐ dans CineclubButton** : L'emoji ⭐ dans `CineclubButton` est remplacé par une icône Ionicons `star` de couleur amber.

5. **AC5 — Animation d'entrée pour les ItemCard** : Les cartes de la collection apparaissent avec une légère animation fade-in + slide-up (via `Animated.timing`) lors du premier rendu de la liste. Délai progressif par index (staggered, max 6 items animés).

6. **AC6 — Animation de feedback sur les chips filtre** : Appuyer sur un chip type/statut produit un léger effet de scale (`Animated.spring`, scale 0.95 → 1.0) pour signaler l'interaction.

7. **AC7 — Bouton "Effacer les filtres" avec icône** : Le texte `✕ Effacer les filtres` est remplacé par une icône Ionicons `close-circle` + texte, avec une couleur cohérente (amber-400).

8. **AC8 — Aucune régression fonctionnelle** : Tous les tests existants passent. La navigation, les filtres, la collection, et les actions demeurent identiques fonctionnellement.

## Tasks / Subtasks

- [ ] Task 1 — Icônes tab bar (AC1)
  - [ ] Importer `Ionicons` depuis `@expo/vector-icons` dans `app/(app)/_layout.tsx`
  - [ ] Ajouter `tabBarIcon` dans les options de chaque `Tabs.Screen` (index, collection, discover, circle, stats, settings)
  - [ ] Choisir les icônes : `home`, `albums`, `compass`, `people`, `bar-chart`, `settings-outline`
  - [ ] Vérifier rendu actif/inactif sur iOS, Android et Web

- [ ] Task 2 — Icônes boutons header Collection (AC2)
  - [ ] Remplacer les emojis 🔍 → `<Ionicons name="search" />`, 📷 → `<Ionicons name="barcode" />`, ✏️ → `<Ionicons name="create-outline" />`
  - [ ] Taille 20, couleur `#FBBF24` pour la recherche (bouton primaire), `#FFFFFF` pour les secondaires
  - [ ] Ajuster le padding des boutons si nécessaire

- [ ] Task 3 — Chevrons navigation (AC3)
  - [ ] `components/media/ItemCard.tsx` : remplacer `→ {item.loanTo}` par `<Ionicons name="arrow-forward" size={12} color="#FBBF24" />` + texte
  - [ ] Rechercher toutes les autres occurrences de `→` ou `>` utilisées comme navigation dans les composants

- [ ] Task 4 — Icône CineclubButton (AC4)
  - [ ] `components/circle/CineclubButton.tsx` : remplacer `⭐` par `<Ionicons name="star" size={14} color="#FBBF24" />`
  - [ ] Maintenir l'alignement flex-row avec le texte

- [ ] Task 5 — Animation ItemCard (AC5)
  - [ ] Créer un composant `AnimatedItemCard` ou ajouter la logique dans `ItemCard` via une prop `animationIndex?: number`
  - [ ] Utiliser `Animated.timing` (opacity + translateY) avec délai basé sur index
  - [ ] Limiter à 6 items max animés (index 0-5), les suivants apparaissent directement
  - [ ] S'assurer que l'animation ne joue qu'au montage initial (useRef pour le flag)

- [ ] Task 6 — Animation chips filtre (AC6)
  - [ ] Créer un composant `FilterChip` réutilisable (ou wrapper) qui gère l'animation `Animated.spring`
  - [ ] Utiliser `scale` avec `useRef(new Animated.Value(1))` par chip
  - [ ] Déclencher l'animation `onPressIn` (scale 0.95) et `onPressOut` (scale 1.0)
  - [ ] Remplacer les `TouchableOpacity` chips dans `collection.tsx` par ce composant

- [ ] Task 7 — Bouton effacer filtres (AC7)
  - [ ] `app/(app)/collection.tsx` : remplacer `✕ Effacer les filtres` par `<Ionicons name="close-circle" />` + `<Text>Effacer</Text>`
  - [ ] Layout flex-row, aligné à droite ou à gauche selon le design choisi

- [ ] Task 8 — Vérification aucune régression (AC8)
  - [ ] Lancer `npx jest --no-coverage` et confirmer 283 tests passants
  - [ ] Tester visuellement sur simulateur iOS et/ou Android

## Dev Notes

### Stack technique
- **`@expo/vector-icons`** : déjà installé dans le projet. Utiliser exclusivement `Ionicons` pour la cohérence. Import : `import { Ionicons } from '@expo/vector-icons'`
- **NativeWind v4** : utilisé pour tout le styling. Continuer à utiliser les classes Tailwind. Les icônes n'ont pas de classes NativeWind — utiliser les props `size` et `color` directement.
- **React Native `Animated`** : utiliser **uniquement** `Animated` de `react-native` (pas Reanimated, pas d'autre bibliothèque d'animation — aucune dépendance native à ajouter pour éviter un EAS Build).
- **Pas de nouvelles dépendances** : tout ce qui est nécessaire est déjà installé.

### Palette de couleurs actuelle (à respecter)
```
Fond principal    : #0E0B0B
Fond secondaire   : #1C1717
Bordures          : #3D3535
Texte secondaire  : #6B5E5E
Amber principal   : #FBBF24 (amber-400)
Amber action      : #F59E0B (amber-500)
Texte sur amber   : #000000
```

### Icônes Ionicons recommandées par écran
```
Tab bar :
  - Accueil      → "home"
  - Collection   → "albums"
  - Découverte   → "compass"
  - Cercle       → "people"
  - Bilan        → "bar-chart"
  - Paramètres   → "settings-outline"

Header Collection :
  - Recherche    → "search"
  - Scan         → "barcode"
  - Ajout manuel → "create-outline"

Composants :
  - CineclubButton star → "star"
  - Flèche prêt   → "arrow-forward"
  - Effacer filtre → "close-circle"
```

### Pattern d'animation à utiliser (Animated API)

**Fade-in + slide-up pour ItemCard :**
```typescript
// Dans le composant ou un wrapper
const fadeAnim = useRef(new Animated.Value(0)).current
const slideAnim = useRef(new Animated.Value(12)).current

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, delay: index * 40, useNativeDriver: true }),
    Animated.timing(slideAnim, { toValue: 0, duration: 200, delay: index * 40, useNativeDriver: true }),
  ]).start()
}, [])

// Dans le JSX :
<Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
  {/* contenu ItemCard */}
</Animated.View>
```

**Scale feedback pour FilterChip :**
```typescript
const scaleAnim = useRef(new Animated.Value(1)).current

const onPressIn = () => {
  Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()
}
const onPressOut = () => {
  Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
}

// Remplacer TouchableOpacity par :
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} ...>
```

### Fichiers à modifier

| Fichier | Raison |
|---------|--------|
| `app/(app)/_layout.tsx` | Icônes tab bar (AC1) |
| `app/(app)/collection.tsx` | Icônes boutons header + animation chips + effacer filtres (AC2, AC6, AC7) |
| `components/media/ItemCard.tsx` | Chevron prêt + animation staggered (AC3, AC5) |
| `components/circle/CineclubButton.tsx` | Icône star (AC4) |

### Fichiers à NE PAS modifier
- Aucune modification de la logique métier (hooks, stores, lib/)
- Aucune modification des tests existants (sauf si un composant est refactorisé en composant séparé qui nécessite un test)
- Aucune modification du routing ou de la navigation

### Project Structure Notes
- `components/media/` : composants visuels liés aux items. `ItemCard.tsx` est le seul composant de liste à modifier.
- `components/circle/` : `CineclubButton.tsx` est standalone, facile à modifier sans effet de bord.
- La tab bar est définie dans `app/(app)/_layout.tsx` uniquement.

### Attention : Web vs Native
- `Ionicons` fonctionne sur iOS, Android ET Web via `@expo/vector-icons`.
- `Animated` avec `useNativeDriver: true` fonctionne sur iOS et Android mais peut nécessiter `useNativeDriver: false` pour certaines propriétés sur Web. Si un problème apparaît sur Web, utiliser `useNativeDriver: false` uniquement pour les propriétés non-transform (opacity fonctionne partout avec `true`).

### References

- Architecture tech stack : [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter]
- UX Design principles : [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles]
- Tab layout actuel : `app/(app)/_layout.tsx`
- Collection screen : `app/(app)/collection.tsx` (lignes 46-136)
- ItemCard : `components/media/ItemCard.tsx`
- CineclubButton : `components/circle/CineclubButton.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
