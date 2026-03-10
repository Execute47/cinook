# Story 4.6 : Gestion avancée des membres du cercle

Status: ready-for-dev

## Story

En tant qu'administratrice,
Je veux pouvoir expulser un membre, promouvoir un autre admin, et quitter le cercle en désignant un successeur,
Afin de garder le contrôle de la composition et de la gouvernance de mon cercle.

En tant que membre,
Je veux pouvoir quitter le cercle librement,
Afin de gérer mon appartenance de façon autonome.

## Acceptance Criteria

### AC1 — Expulsion d'un membre (admin uniquement)

**Given** l'écran cercle, connectée en tant qu'admin
**When** je tape sur un membre (autre que moi-même) dans la liste
**Then** un menu d'actions apparaît avec : "Expulser du cercle" et "Promouvoir admin"
**And** après confirmation, "Expulser" retire le membre de `circles/{circleId}.members` (arrayRemove) et efface son `users/{uid}.circleId`
**And** l'opération est silencieuse (aucune notification au membre)
**And** le membre expulsé voit son cercle disparaître à sa prochaine session

### AC2 — Promotion d'un membre en admin

**Given** l'écran cercle, connectée en tant qu'admin
**When** je sélectionne "Promouvoir admin" sur un membre
**Then** une confirmation est demandée : "Cet utilisateur deviendra admin. Vous resterez membre."
**And** après confirmation, `circles/{circleId}.adminId` est mis à jour avec le UID du nouveau membre
**And** l'interface se met à jour immédiatement (mon badge "Admin" disparaît, le nouveau admin est affiché)
**And** l'ex-admin reste membre du cercle

### AC3 — Membre simple quitte le cercle

**Given** l'écran cercle, connectée en tant que membre (non-admin)
**When** je tape "Quitter le cercle"
**Then** une confirmation est demandée : "Vous quitterez ce cercle. Votre collection reste intacte."
**And** après confirmation, mon UID est retiré de `circles/{circleId}.members` et `users/{uid}.circleId` est effacé
**And** je suis redirigée vers l'écran cercle qui proposera de créer ou rejoindre un nouveau cercle

### AC4 — Admin quitte le cercle — avec d'autres membres

**Given** je suis admin et il y a d'autres membres dans le cercle
**When** je tape "Quitter le cercle"
**Then** une modal `LeaveCircleModal` s'ouvre avec :
  - La liste des membres (hors moi) pour choisir un successeur
  - Un bouton "Confirmer sans choisir" (sélectionne automatiquement le membre le plus ancien)
**And** après confirmation avec ou sans choix, le nouveau `adminId` est mis à jour AVANT que mon UID soit retiré de `members`
**And** je suis redirigée vers l'écran cercle (création/rejoindre)

> **"Membre le plus ancien"** = premier UID dans `circle.members` qui n'est pas le mien (l'array reflète l'ordre d'arrivée).

### AC5 — Admin quitte le cercle — dernier membre

**Given** je suis admin ET le seul membre du cercle
**When** je tape "Quitter le cercle"
**Then** une confirmation est demandée : "Vous êtes seul dans ce cercle. Le quitter supprimera le cercle définitivement."
**And** après confirmation, le document `circles/{circleId}` est supprimé et `users/{uid}.circleId` est effacé
**And** je suis redirigée vers l'écran cercle (qui créera un nouveau cercle automatiquement)

## Tasks / Subtasks

- [ ] **Task 1 — Fonctions Firestore dans `lib/circle.ts`** (tous ACs)
  - [ ] `removeMember(circleId, targetUid)` : arrayRemove + effacer `users/{targetUid}.circleId`
  - [ ] `promoteMember(circleId, newAdminUid)` : updateDoc `{ adminId: newAdminUid }`
  - [ ] `leaveCircle(circleId, uid, successorUid?)` :
    - Si `successorUid` fourni → `promoteMember` puis `removeMember(uid)`
    - Si non fourni → lire members, prendre le premier ≠ uid → `promoteMember` puis `removeMember(uid)`
    - Effacer `users/{uid}.circleId` (deleteField)
    - Mettre à jour `authStore` : `setCircle(null, false)`
  - [ ] `deleteCircle(circleId, uid)` : deleteDoc circle + deleteField sur `users/{uid}.circleId`

- [ ] **Task 2 — Mise à jour `components/circle/MemberCard.tsx`** (AC1, AC2)
  - [ ] Ajouter prop optionnelle `onAdminAction?: (action: 'remove' | 'promote') => void`
  - [ ] Si prop présente (admin connecté) et membre ≠ soi-même → afficher icône/bouton "•••" ou similaire
  - [ ] Tap sur "•••" → ActionSheet ou modal avec "Expulser" (rouge) et "Promouvoir admin"

- [ ] **Task 3 — Composant `components/circle/LeaveCircleModal.tsx`** (AC4)
  - [ ] Props : `visible`, `members: Member[]` (hors admin courant), `onConfirm(successorUid?: string)`, `onCancel`
  - [ ] Liste des membres sélectionnables (radio-style)
  - [ ] Bouton "Confirmer sans choisir" → appelle `onConfirm(undefined)`
  - [ ] Bouton "Confirmer" (actif si un membre sélectionné) → appelle `onConfirm(selectedUid)`

- [ ] **Task 4 — Mise à jour `app/(app)/circle.tsx`** (AC1, AC2, AC3, AC4, AC5)
  - [ ] Passer `onAdminAction` à `MemberList` → `MemberCard` (admin uniquement, hors soi-même)
  - [ ] Handler `handleRemoveMember(targetUid)` : Alert confirmation → `removeMember`
  - [ ] Handler `handlePromoteMember(targetUid)` : Alert confirmation → `promoteMember`
  - [ ] Bouton "Quitter le cercle" visible pour tous les membres (y compris admin)
  - [ ] Handler `handleLeaveCircle()` :
    - Si non-admin → Alert confirmation simple → `leaveCircle`
    - Si admin + seul membre → Alert "cercle supprimé" → `deleteCircle`
    - Si admin + autres membres → ouvrir `LeaveCircleModal` → `leaveCircle(circleId, uid, successorUid?)`

- [ ] **Task 5 — Mise à jour `authStore`** (AC3, AC4, AC5)
  - [ ] Vérifier que `setCircle(null, false)` + redirection vers circle screen déclenchent bien la création automatique d'un nouveau cercle (logique déjà dans `circle.tsx` useEffect)

- [ ] **Task 6 — Règles Firestore** (AC1, AC2)
  - [ ] Vérifier que `firestore.rules` autorise uniquement l'admin à modifier `adminId` et `members`
  - [ ] Autoriser un membre à retirer son propre UID de `members` (pour AC3)

- [ ] **Task 7 — Tests** (tous ACs)
  - [ ] `removeMember` : arrayRemove sur members + deleteField sur users/{uid}.circleId
  - [ ] `promoteMember` : adminId mis à jour
  - [ ] `leaveCircle` sans successeur : prend le premier membre ≠ uid comme successeur
  - [ ] `leaveCircle` avec successeur : promeut le successeur fourni
  - [ ] `deleteCircle` : deleteDoc circle + deleteField circleId
  - [ ] MemberCard : boutons admin absents si non-admin ou si membre = soi-même

## Dev Notes

### Ordre des opérations critique pour `leaveCircle`

```typescript
// IMPORTANT : promouvoir d'abord, retirer ensuite
// Sinon l'admin perd ses droits Firestore avant la promotion
export async function leaveCircle(circleId: string, uid: string, successorUid?: string) {
  const circle = await getCircle(circleId)
  if (!circle) return

  const isAdmin = circle.adminId === uid
  if (isAdmin) {
    const successor = successorUid ?? circle.members.find(m => m !== uid)
    if (!successor) throw new Error('Aucun successeur disponible')
    await updateDoc(doc(db, 'circles', circleId), { adminId: successor })
  }
  await updateDoc(doc(db, 'circles', circleId), { members: arrayRemove(uid) })
  await updateDoc(doc(db, 'users', uid), { circleId: deleteField() })
}
```

### Supprimer le cercle

```typescript
import { deleteDoc } from 'firebase/firestore'

export async function deleteCircle(circleId: string, uid: string) {
  await deleteDoc(doc(db, 'circles', circleId))
  await updateDoc(doc(db, 'users', uid), { circleId: deleteField() })
}
```

### Effacer circleId dans authStore après départ

```typescript
useAuthStore.getState().setCircle(null, false)
router.replace('/(app)/circle')
// Le useEffect de circle.tsx détecte circleId === null → crée un nouveau cercle
```

### Réutilisation par Story 6-3

Les fonctions `leaveCircle` et `deleteCircle` seront également appelées par Story 6-3 (suppression de compte) lors de la sortie automatique du cercle.

### References

- [Source: lib/circle.ts] — createCircle, joinCircle, structure Circle
- [Source: hooks/useCircle.ts] — members[], adminId, isAdmin
- [Source: app/(app)/circle.tsx] — useEffect init circle, setCircle
- [Source: components/circle/MemberCard.tsx] — composant existant à étendre
- [Source: firestore.rules] — règles d'accès cercle

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `lib/circle.ts` (modification — ajout removeMember, promoteMember, leaveCircle, deleteCircle)
- `components/circle/MemberCard.tsx` (modification — actions admin)
- `components/circle/LeaveCircleModal.tsx` (nouveau)
- `app/(app)/circle.tsx` (modification — handlers + bouton Quitter)
