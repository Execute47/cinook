# Story 3.6 : Amélioration du Date Picker Mobile & Saisie de Dates Partielles

Status: review

## Story

En tant qu'utilisatrice de l'application sur mobile,
je veux pouvoir ouvrir le sélecteur de date même sur Android et indiquer une date avec seulement un mois ou une année,
afin d'enregistrer mes dates de visionnage même quand je ne me souviens pas du jour exact.

## Contexte du problème

### Bug : DateTimePicker qui ne s'ouvre pas sur mobile Android

**Cause probable** : `@react-native-community/datetimepicker` avec `display="default"` est rendu inline dans un composant `<Modal>` React Native. Ce pattern est connu pour être problématique sur Android — le picker Android est lui-même une dialog native, et l'imbriquer dans un Modal RN peut bloquer son ouverture.

**Fichier concerné** : `components/media/WatchDateModal.tsx` (lignes 136-155)

**Code actuel problématique** :
```tsx
// Le picker est rendu inline dans un Modal — problème Android
{pickerMode !== 'none' && (
  Platform.OS === 'web' ? (
    <DateTimePicker ... display="default" onChange={handleDateChange} />
  ) : (
    <DateTimePicker
      value={...}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleDateChange}
    />
  )
)}
```

### Feature : Saisie de dates partielles

L'utilisatrice veut pouvoir enregistrer :
- Uniquement l'année (ex : "2023")
- Uniquement le mois et l'année (ex : "mars 2023")
- La date complète (ex : "15/03/2023")

## Acceptance Criteria

1. **[AC1 - Bug Android]** Sur Android, le picker de date s'ouvre correctement depuis le `WatchDateModal`, que ce soit pour "Commencé le" ou "Terminé le"
2. **[AC2 - Précision]** L'utilisatrice peut choisir la précision de la date parmi 3 niveaux : Année / Mois + Année / Date complète
3. **[AC3 - Saisie année]** Si "Année" est sélectionné, l'utilisatrice saisit seulement une année (ex : 2023)
4. **[AC4 - Saisie mois]** Si "Mois + Année" est sélectionné, l'utilisatrice saisit un mois et une année
5. **[AC5 - Saisie complète]** Si "Date complète" est sélectionné, le comportement actuel est préservé
6. **[AC6 - Affichage cohérent]** L'affichage de la date reflète la précision : "2023" / "mars 2023" / "15/03/2023"
7. **[AC7 - Stockage rétro-compatible]** Les items existants avec des dates complètes ne sont pas affectés
8. **[AC8 - Stats]** Les stats annuelles (`useYearStats`) fonctionnent avec les dates partielles (année ou mois+année)
9. **[AC9 - ItemCard]** L'affichage de la date dans `ItemCard.tsx` (ligne 75) respecte la précision
10. **[AC10 - Tests]** Les tests existants de `WatchDateModal.test.tsx` passent toujours

## Tasks / Subtasks

- [x] **Task 1 — Modifier le type `MediaItem` pour supporter les dates partielles** (AC7)
  - [x] Ajouter `endedAtPrecision?: 'day' | 'month' | 'year'` dans `types/media.ts`
  - [x] Ajouter `startedAtPrecision?: 'day' | 'month' | 'year'` dans `types/media.ts`
  - [x] Créer un helper `formatPartialDate(date: Date, precision: DatePrecision): string` dans `lib/dateUtils.ts`

- [x] **Task 2 — Corriger le bug Android dans `WatchDateModal.tsx`** (AC1)
  - [x] Remplacer le rendu inline du `DateTimePicker` par une approche qui fonctionne dans un Modal sur Android
  - [x] Alternative simple : sur Android, utiliser `DateTimePickerAndroid.open()` (API impérative de `@react-native-community/datetimepicker` v7+) déclenché depuis `onPress` — ne nécessite pas de rendu dans le DOM

- [x] **Task 3 — Refactoriser l'UI de `WatchDateModal.tsx` pour la précision** (AC2, AC3, AC4, AC5, AC6)
  - [x] Ajouter un sélecteur de précision (3 boutons radio ou segmented control) : "Année" / "Mois" / "Date"
  - [x] Sur sélection "Année" : afficher un `TextInput` numérique ou un Picker d'année
  - [x] Sur sélection "Mois + Année" : afficher un sélecteur de mois + année
  - [x] Sur sélection "Date complète" : conserver le DateTimePicker actuel (corrigé)
  - [x] Mettre à jour `handleValidate` pour passer la précision avec la date

- [x] **Task 4 — Mettre à jour `handleWatchDateValidate` dans `app/(app)/item/[id].tsx`** (AC7)
  - [x] Adapter la signature de `onValidate` pour inclure la précision : `onValidate(endedAt?, startedAt?, endedAtPrecision?, startedAtPrecision?)`
  - [x] Stocker `endedAtPrecision` et `startedAtPrecision` dans Firestore via `updateItem`

- [x] **Task 5 — Mettre à jour l'affichage des dates** (AC6, AC9)
  - [x] `components/media/ItemCard.tsx` (ligne 75) : utiliser `formatPartialDate` avec `item.endedAtPrecision`
  - [x] `app/(app)/item/[id].tsx` (lignes 349-382) : idem pour l'affichage dans la fiche item
  - [x] `WatchDateModal.tsx` : affichage respecte la précision via `formatPartialDate`

- [x] **Task 6 — Mettre à jour `useYearStats.ts`** (AC8)
  - [x] Le filtre `item.endedAt.toDate().getFullYear() === year` fonctionne avec la stratégie date représentative
  - [x] Les items year-only et month-only sont bien comptés dans le total annuel
  - [x] Les items year-only ne sont pas attribués à un mois spécifique dans `byMonth`

- [x] **Task 7 — Tests** (AC10)
  - [x] Mettre à jour `WatchDateModal.test.tsx` pour couvrir les 3 modes de précision
  - [x] Ajouter un test pour l'initialisation d'un item existant avec date complète (rétro-compat)
  - [x] Tester que `useYearStats` compte correctement les items year-only

## Dev Notes

### Architecture de stockage des dates partielles

**Stratégie retenue : champ de précision + date représentative**

Ne pas changer le type de `endedAt` (reste Firestore `Timestamp`). Ajouter uniquement la précision :
- `year` : stocker le 1er janvier de l'année (ex: `2023-01-01`)
- `month` : stocker le 1er du mois (ex: `2023-03-01`)
- `day` : stocker la date exacte (comportement actuel)

Cela garantit la **rétro-compatibilité** totale (tous les items existants ont implicitement `precision = 'day'`).

### Fix Android — Approche recommandée

`@react-native-community/datetimepicker` v7+ expose `DateTimePickerAndroid.open()` comme API impérative :

```typescript
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

const openAndroidPicker = (mode: PickerMode) => {
  DateTimePickerAndroid.open({
    value: mode === 'started' ? (startedDate || new Date()) : (endedDate || new Date()),
    mode: 'date',
    onChange: (event, date) => handleDateChange(event, date),
  })
}

// Dans le onPress du TouchableOpacity :
onPress={() => {
  if (Platform.OS === 'android') {
    openAndroidPicker('ended')
  } else {
    setPickerMode('ended')  // iOS conserve le rendu inline
  }
}}
```

Cette approche **évite entièrement** le problème de Modal imbriqué sur Android, sans changer le rendu iOS.

### Helper `formatPartialDate`

À créer dans `lib/dateUtils.ts` (fichier nouveau) :

```typescript
export type DatePrecision = 'day' | 'month' | 'year'

export function formatPartialDate(date: Date, precision: DatePrecision = 'day'): string {
  if (precision === 'year') {
    return date.getFullYear().toString()
  }
  if (precision === 'month') {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    // → "mars 2023"
  }
  return date.toLocaleDateString('fr-FR') // → "15/03/2023"
}
```

### Structure de données mise à jour

```typescript
// types/media.ts — ajouts
export type DatePrecision = 'day' | 'month' | 'year'

export interface MediaItem {
  // ... champs existants ...
  endedAt?: Timestamp           // inchangé
  startedAt?: Timestamp         // inchangé
  endedAtPrecision?: DatePrecision    // NOUVEAU — absent = 'day' (rétro-compat)
  startedAtPrecision?: DatePrecision  // NOUVEAU — absent = 'day' (rétro-compat)
}
```

### Signature mise à jour de `onValidate`

```typescript
// WatchDateModal.tsx Props
onValidate: (
  endedAt?: Timestamp,
  startedAt?: Timestamp,
  endedAtPrecision?: DatePrecision,
  startedAtPrecision?: DatePrecision,
) => void
```

### Project Structure Notes

- **Fichier principal** : `components/media/WatchDateModal.tsx` (172 lignes) — refactoring complet
- **Nouveau fichier** : `lib/dateUtils.ts` — helper de formatage
- **Types** : `types/media.ts` — ajout de `DatePrecision` et 2 champs
- **Fiche item** : `app/(app)/item/[id].tsx` (lignes 101-111 et 349-382) — mise à jour stockage + affichage
- **ItemCard** : `components/media/ItemCard.tsx` (ligne 75) — affichage formaté
- **Stats** : `hooks/useYearStats.ts` (lignes 28-45) — vérification compatibilité
- **Tests** : `components/media/WatchDateModal.test.tsx` — mise à jour

### Contraintes à respecter

- NativeWind / Tailwind pour tous les styles (pas de `StyleSheet.create`)
- Palette de couleurs : fond `#1C1717`, bordures `#3D3535`, accent `amber-500` (#FBBF24), texte secondaire `#6B5E5E`
- Ionicons pour les icônes
- Pas de librairie tierce supplémentaire — utiliser `@react-native-community/datetimepicker` déjà installé
- Conserver le support web (le DateTimePicker web peut rester tel quel)

### Références

- `components/media/WatchDateModal.tsx` — implémentation actuelle complète
- `types/media.ts` — structure MediaItem avec Timestamp
- `app/(app)/item/[id].tsx#handleWatchDateValidate` (lignes 101-111) — point d'entrée savedate
- `components/media/ItemCard.tsx#line75` — affichage date dans les cartes
- `hooks/useYearStats.ts#line28` — stats annuelles
- `components/media/WatchDateModal.test.tsx` — tests existants à conserver

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucune régression introduite. Les 10 échecs constatés dans `stats.test.tsx`, `item-status.test.tsx`, `member.test.tsx`, `discover.test.tsx` sont des régressions pré-existantes (données mock incomplètes, non liées à cette story)._

### Completion Notes List

- **Task 1** : `DatePrecision` exporté depuis `lib/dateUtils.ts` et ré-exporté depuis `types/media.ts`. `endedAtPrecision` et `startedAtPrecision` ajoutés dans `MediaItem`.
- **Task 2** : Fix Android via `DateTimePickerAndroid.open()` — évite le bug de Modal imbriqué. iOS conserve le rendu inline spinner.
- **Task 3** : 3 boutons de précision (Année/Mois/Date) dans le modal. Saisie année via `TextInput`, saisie mois via grille de 12 boutons + `TextInput` année.
- **Task 4** : `handleWatchDateValidate` étendu pour persister les précisions dans Firestore.
- **Task 5** : `ItemCard.tsx` et `[id].tsx` utilisent `formatPartialDate` avec la précision de l'item. Rétro-compat : `?? 'day'` pour les items sans précision.
- **Task 6** : `useYearStats` exclut les items `endedAtPrecision === 'year'` du comptage mensuel. Le total annuel les inclut toujours.
- **Task 7** : 30 tests ajoutés/mis à jour, tous passent.

### File List

- `lib/dateUtils.ts` (nouveau)
- `lib/dateUtils.test.ts` (nouveau)
- `types/media.ts` (modifié — ajout `DatePrecision`, `endedAtPrecision`, `startedAtPrecision`)
- `components/media/WatchDateModal.tsx` (modifié — refactoring complet)
- `components/media/WatchDateModal.test.tsx` (modifié — nouveaux tests précision)
- `components/media/ItemCard.tsx` (modifié — `formatPartialDate`)
- `app/(app)/item/[id].tsx` (modifié — signature `handleWatchDateValidate` + affichage)
- `hooks/useYearStats.ts` (modifié — exclusion year-only du byMonth)
- `hooks/useYearStats.test.ts` (modifié — nouveaux tests dates partielles)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié — statut 3-6)
