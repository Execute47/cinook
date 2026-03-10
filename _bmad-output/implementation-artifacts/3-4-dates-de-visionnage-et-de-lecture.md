# Story 3.4 : Dates de visionnage et de lecture

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux enregistrer la date à laquelle j'ai vu un film ou une série, et les dates auxquelles j'ai commencé et terminé un livre,
Afin de garder une trace précise de mon parcours de consommation culturelle.

## Acceptance Criteria

### AC1 — Modal de date au passage en statut "Vu"

**Given** un item avec un statut différent de "Vu"
**When** je sélectionne le statut "Vu" dans le StatusPicker
**Then** une modal `WatchDateModal` s'ouvre avec :
- Pour un **film** : un seul champ "Vu le" pré-rempli avec la date du jour (format `jj/mm/aaaa`)
- Pour une **série** : un champ "Commencé le" (optionnel) + un champ "Terminé le" pré-rempli avec aujourd'hui
- Pour un **livre** : un champ "Commencé le" (optionnel) + un champ "Terminé le" pré-rempli avec aujourd'hui
**And** l'utilisatrice peut modifier les dates avant de valider
**And** si elle annule, le statut reste inchangé (aucune mise à jour Firestore)

### AC2 — Enregistrement des dates

**Given** la modal ouverte avec des dates valides
**When** je valide
**Then** le statut passe à "Vu" et les dates sont enregistrées dans Firestore :
- Film → `endedAt: Timestamp`
- Série → `endedAt: Timestamp` (+ `startedAt: Timestamp` si renseigné)
- Livre → `endedAt: Timestamp` (+ `startedAt: Timestamp` si renseigné)

### AC3 — Affichage dans le détail de l'item

**Given** un item avec statut "Vu" et des dates enregistrées
**When** je consulte le détail
**Then** dans la section Statut, les dates sont affichées sous le StatusPicker :
- Film : "Vu le : XX/XX/XXXX"
- Série : "Commencé le : XX/XX/XXXX" (si renseigné) + "Terminé le : XX/XX/XXXX"
- Livre : "Commencé le : XX/XX/XXXX" (si renseigné) + "Terminé le : XX/XX/XXXX"
**And** un bouton "Modifier les dates" permet de rouvrir la modal pour les corriger

### AC4 — Affichage dans la liste de collection (ItemCard)

**Given** un item avec statut "Vu" et `endedAt` renseigné
**When** je consulte la liste de ma collection
**Then** l'ItemCard affiche la date de fin sous le titre, de façon subtile ("Vu le XX/XX/AAAA")
**And** si `endedAt` est absent, rien n'est affiché (pas de placeholder)

### AC5 — Effacement des dates au changement de statut

**Given** un item avec statut "Vu" et des dates enregistrées
**When** je change le statut vers autre chose que "Vu"
**Then** `startedAt` et `endedAt` sont effacés de Firestore (`deleteField()`)

## Tasks / Subtasks

- [ ] **Task 1 — Mise à jour du type `MediaItem`** (`types/media.ts`)
  - [ ] Ajouter `startedAt?: Timestamp` — date de début (série, livre)
  - [ ] Ajouter `endedAt?: Timestamp` — date de fin / visionnage (tous types)

- [ ] **Task 2 — Composant `components/media/WatchDateModal.tsx`** (AC1, AC2)
  - [ ] Props : `visible`, `type: MediaType`, `onValidate(endedAt: Timestamp, startedAt?: Timestamp)`, `onCancel`
  - [ ] Réutiliser les helpers `todayStr()` et `parseDate()` du pattern LoanModal
  - [ ] Film : un seul champ "Vu le" (obligatoire, pré-rempli à aujourd'hui)
  - [ ] Série / Livre : champ "Commencé le" (optionnel) + champ "Terminé le" (obligatoire, pré-rempli)
  - [ ] Bouton "Valider" actif uniquement si `endedAt` est une date valide
  - [ ] Bouton "Annuler" → fermer sans modification

- [ ] **Task 3 — Intégration dans `app/(app)/item/[id].tsx`** (AC1, AC2, AC3, AC5)
  - [ ] Ajouter état `showWatchDateModal: boolean`
  - [ ] Dans `handleStatusChange` : si `newStatus === 'watched'` → ouvrir `WatchDateModal` au lieu d'appliquer directement
  - [ ] Handler `handleWatchDateValidate(endedAt, startedAt?)` → `updateItem(uid, item.id, { status: 'watched', endedAt, startedAt? })`
  - [ ] Si l'ancien statut était 'watched' et le nouveau ne l'est pas → ajouter `startedAt: deleteField(), endedAt: deleteField()` aux updates (AC5)
  - [ ] Dans la section Statut : afficher les dates sous le StatusPicker quand `item.status === 'watched'` (AC3)
  - [ ] Bouton "Modifier les dates" → rouvre WatchDateModal pré-remplie avec les dates existantes

- [ ] **Task 4 — Mise à jour de `components/media/ItemCard.tsx`** (AC4)
  - [ ] Si `item.status === 'watched' && item.endedAt` → afficher `"Vu le XX/XX/AAAA"` sous le bloc titre/badges
  - [ ] Formatage : `item.endedAt.toDate().toLocaleDateString('fr-FR')`

- [ ] **Task 5 — Tests** (tous ACs)
  - [ ] WatchDateModal film : champ "Vu le" vide → bouton Valider désactivé
  - [ ] WatchDateModal film : validation → `onValidate` appelé avec `Timestamp` correct, sans `startedAt`
  - [ ] WatchDateModal série : "Terminé le" valide + "Commencé le" vide → `onValidate` sans `startedAt`
  - [ ] WatchDateModal série : deux dates valides → `onValidate` avec les deux `Timestamp`
  - [ ] `handleStatusChange` : statut → 'watched' → `showWatchDateModal === true` (pas d'update Firestore direct)
  - [ ] `handleStatusChange` : ancien statut 'watched' → nouveau statut ≠ 'watched' → `deleteField()` sur `startedAt` et `endedAt`
  - [ ] ItemCard : `endedAt` présent + statut 'watched' → affiche la date ; absent → pas de date

## Dev Notes

### Nouveaux champs `MediaItem`

```typescript
// types/media.ts
startedAt?: Timestamp   // début (série, livre) — optionnel
endedAt?: Timestamp     // fin / visionnage (tous) — optionnel
```

### Pattern de date (réutiliser depuis LoanModal)

```typescript
const todayStr = () => {
  const d = new Date()
  return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('/')
}
const parseDate = (str: string): Date | null => { /* ... */ }
// Stockage
endedAt: Timestamp.fromDate(parsedDate)
// Affichage
item.endedAt?.toDate().toLocaleDateString('fr-FR')
```

### Effacement des dates au changement de statut

```typescript
import { deleteField } from 'firebase/firestore'
// Dans handleStatusChange, si ancien statut était 'watched' et nouveau ≠ 'watched' :
updates.startedAt = deleteField()
updates.endedAt = deleteField()
```

### WatchDateModal pré-remplissage (édition)

Passer des props optionnelles `initialEndedAt?: Timestamp` et `initialStartedAt?: Timestamp` pour que la modal se pré-remplisse avec les dates existantes lors du "Modifier les dates".

### Libellés selon le type de média

| Type  | Champ `startedAt`  | Champ `endedAt`   |
|-------|--------------------|-------------------|
| film  | —                  | "Vu le"           |
| serie | "Commencé le"      | "Terminé le"      |
| livre | "Commencé le"      | "Terminé le"      |

### References

- [Source: story 3-3] — pattern LoanModal (todayStr, parseDate, Modal, deleteField)
- [Source: types/media.ts] — interface MediaItem, Timestamp
- [Source: app/(app)/item/[id].tsx] — handleStatusChange, intégration LoanModal
- [Source: components/media/ItemCard.tsx] — affichage conditionnel (pattern loanTo)
- [Source: components/media/LoanModal.tsx] — composant de référence pour WatchDateModal

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `types/media.ts` (modification — ajout startedAt, endedAt)
- `components/media/WatchDateModal.tsx` (nouveau)
- `components/media/WatchDateModal.test.tsx` (nouveau)
- `app/(app)/item/[id].tsx` (intégration WatchDateModal, affichage dates)
- `components/media/ItemCard.tsx` (affichage endedAt)
