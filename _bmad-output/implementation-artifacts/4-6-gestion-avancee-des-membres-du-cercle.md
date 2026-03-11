# Story 4.6 : Gestion avancée des membres du cercle

Status: done

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

- [x] **Task 1 — Fonctions Firestore dans `lib/circle.ts`** (tous ACs)
  - [x] `removeMember(circleId, targetUid)` : arrayRemove + effacer `users/{targetUid}.circleId`
  - [x] `promoteMember(circleId, newAdminUid)` : updateDoc `{ adminId: newAdminUid }`
  - [x] `leaveCircle(circleId, uid, successorUid?)` : promoteMember + arrayRemove + deleteField
  - [x] `deleteCircle(circleId, uid)` : deleteDoc circle + deleteField sur `users/{uid}.circleId`

- [x] **Task 2 — Mise à jour `components/circle/MemberCard.tsx`** (AC1, AC2)
  - [x] Prop `onAdminAction?: (action: 'remove' | 'promote') => void`
  - [x] Bouton "•••" si prop présente, menu inline au tap

- [x] **Task 3 — Composant `components/circle/LeaveCircleModal.tsx`** (AC4)
  - [x] Liste membres sélectionnables + "Confirmer sans choisir"

- [x] **Task 4 — Mise à jour `app/(app)/circle.tsx`** (AC1, AC2, AC3, AC4, AC5)
  - [x] handleRemoveMember / handlePromoteMember avec confirmation
  - [x] Bouton "Quitter le cercle" pour tous
  - [x] handleLeaveCircle : 3 cas (non-admin, admin seul, admin + membres)

- [x] **Task 5 — authStore** : setCircle(null, false) + router.replace dans circle.tsx

- [x] **Task 6 — Règles Firestore**
  - [x] Membre peut se retirer de members (AC3)
  - [x] Admin peut effacer circleId d'un membre (AC1)

- [x] **Task 7 — Tests**
  - [x] removeMember, promoteMember, leaveCircle (avec/sans successeur), deleteCircle
  - [x] MemberCard : boutons admin absents / présents selon onAdminAction

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
claude-sonnet-4-6

### Debug Log References
Aucun bug. Implémentation conforme aux Dev Notes.

### Completion Notes List
- leaveCircle ne modifie pas authStore (séparation des responsabilités) — circle.tsx appelle setCircle(null, false) après
- MemberCard : menu inline toggleable (pas d'ActionSheet pour compatibilité web)
- MemberList étendu avec currentUid + isCurrentUserAdmin pour filtrer le bouton ••• sur soi-même
- Règles Firestore : membre peut se retirer + admin peut effacer circleId d'un membre cible
- 189/189 tests passent

### File List

- `lib/circle.ts` (modification — ajout removeMember, promoteMember, leaveCircle, deleteCircle)
- `components/circle/MemberCard.tsx` (modification — actions admin)
- `components/circle/LeaveCircleModal.tsx` (nouveau)
- `app/(app)/circle.tsx` (modification — handlers + bouton Quitter)
