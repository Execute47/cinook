# Story 3.3 : Enregistrement et suivi des prêts

Status: done

## Story

En tant qu'utilisatrice,
Je veux enregistrer à qui j'ai prêté un item et depuis quand,
Afin de ne jamais perdre la trace de mes objets prêtés.

## Acceptance Criteria

### AC1 — Formulaire de prêt

**Given** un item avec le statut "Prêté" sélectionné
**When** la modal de prêt (`LoanModal`) s'ouvre
**Then** deux champs sont disponibles : nom de l'emprunteur (obligatoire) et date de prêt (par défaut : aujourd'hui)

### AC2 — Enregistrement du prêt

**Given** le formulaire de prêt rempli
**When** je valide
**Then** `loanTo` et `loanDate` sont enregistrés dans Firestore avec le statut "Prêté"
**And** l'item apparaît dans la liste des prêts en cours

### AC3 — Liste des prêts

**Given** la liste des prêts (`LoanList` ou filtre statut "Prêté")
**When** je consulte mes prêts
**Then** chaque item affiche le nom de l'emprunteur et la date de prêt (FR18)
**And** la liste est accessible en moins de 2 taps (NFR10)

### AC4 — Retour d'un prêt

**Given** un item prêté retourné
**When** je change son statut (ex: vers "Possédé" ou "Vu")
**Then** `loanTo` et `loanDate` sont effacés automatiquement (FR17)
**And** l'item disparaît de la liste des prêts en cours

## Tasks / Subtasks

- [x] **Task 1 — Composant `components/media/LoanModal.tsx`** (AC1, AC2)
  - [x] Modal avec TextInput "Nom de l'emprunteur" (requis)
  - [x] DatePicker ou TextInput date (par défaut : aujourd'hui)
  - [x] Bouton "Valider" → `updateItem(uid, id, { status: 'loaned', loanTo, loanDate: Timestamp.fromDate(date) })`
  - [x] Bouton "Annuler" → fermer sans modification

- [x] **Task 2 — Intégrer LoanModal dans item/[id].tsx** (AC1, AC2)
  - [x] Quand StatusPicker sélectionne 'loaned' → ouvrir LoanModal avant d'appliquer
  - [x] LoanModal bloque la navigation jusqu'à validation ou annulation

- [x] **Task 3 — Composant `components/media/LoanList.tsx`** (AC3)
  - [x] Filtrer items avec `status === 'loaned'` depuis `useCollection`
  - [x] Afficher : titre, `loanTo`, date du prêt formatée
  - [x] Accessible depuis un onglet ou section dédiée (< 2 taps)

- [x] **Task 4 — AC4 déjà couvert par Story 3.1** (AC4)
  - [x] Vérifier que Story 3.1 efface bien `loanTo`/`loanDate` lors du changement de statut

- [x] **Task 5 — Tests** (tous ACs)
  - [x] Test LoanModal : emprunteur vide → bouton Valider désactivé
  - [x] Test LoanModal : validation → `updateItem` avec `loanTo`, `loanDate` (Timestamp), `status: 'loaned'`
  - [x] Test LoanList : affiche uniquement les items avec `status === 'loaned'`

## Dev Notes

### Timestamp.fromDate pour loanDate

```typescript
import { Timestamp } from 'firebase/firestore'
// Stockage
loanDate: Timestamp.fromDate(selectedDate)
// Lecture / affichage
const date = item.loanDate?.toDate()
const formatted = date?.toLocaleDateString('fr-FR')
```

### DatePicker React Native

Utiliser `TextInput` avec format `dd/mm/yyyy` pour éviter une dépendance externe. Ou `@react-native-community/datetimepicker` si déjà disponible dans le projet.

### References

- [Source: epics.md#Story 3.3]
- [Source: architecture.md#Data Architecture] — champs loanTo, loanDate
- [Source: architecture.md#Format Patterns] — Timestamp pour les dates
- [Source: story 3-1] — deleteField pour loanTo/loanDate au retour

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `components/media/LoanModal.tsx` (nouveau)
- `components/media/LoanModal.test.tsx` (nouveau)
- `components/media/LoanList.tsx` (nouveau)
- `app/(app)/item/[id].tsx` (intégration LoanModal)
