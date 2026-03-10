# Story 6.3 : Suppression des données et du compte (RGPD)

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux pouvoir supprimer uniquement mes données ou supprimer intégralement mon compte,
Afin d'exercer mon droit à l'effacement conformément au RGPD.

## Dépendances

- **Story 4.6** doit être implémentée avant cette story (pour les fonctions `leaveCircle` et `deleteCircle`)
- **Story 6.2 AC4** : cette story **remplace et étend** l'AC4 de Story 6.2. Le dev qui implémente 6.2 doit laisser l'AC4 en suspens ou implémenter une version minimale sans logique cercle, à remplacer ici.

## Acceptance Criteria

### AC1 — Deux actions distinctes dans les Paramètres

**Given** l'écran Paramètres (`app/(app)/settings.tsx`)
**When** je consulte la section "Danger"
**Then** deux boutons distincts sont affichés :
- "Supprimer mes données" (orange)
- "Supprimer mon compte" (rouge)
**And** chaque action déclenche sa propre modal de confirmation

### AC2 — Supprimer mes données (compte conservé)

**Given** je confirme "Supprimer mes données"
**When** la suppression s'exécute
**Then** tous les documents de `users/{uid}/items` sont supprimés (batch delete)
**And** mon compte Firebase Auth est conservé
**And** mon profil `users/{uid}` est conservé (displayName, email, circleId)
**And** mon appartenance au cercle est conservée
**And** un message de confirmation s'affiche : "Vos données ont été supprimées."
**And** la collection locale (Zustand/cache) est vidée

### AC3 — Supprimer mon compte — membre simple

**Given** je suis membre du cercle (non-admin) et je confirme "Supprimer mon compte"
**When** la suppression s'exécute, dans cet ordre :
1. Suppression de tous les items `users/{uid}/items` (batch delete)
2. Sortie du cercle : `leaveCircle(circleId, uid)` (Story 4.6)
3. Suppression du document `users/{uid}`
4. Suppression du compte Firebase Auth : `deleteUser(auth.currentUser)`
**Then** je suis redirigée vers l'écran de création de compte

### AC4 — Supprimer mon compte — admin avec autres membres

**Given** je suis admin du cercle avec d'autres membres et je confirme "Supprimer mon compte"
**When** la modal de confirmation s'affiche
**Then** un avertissement est visible : "Vous êtes admin du cercle. Un autre membre deviendra admin automatiquement."
**And** après confirmation, le membre le plus ancien est automatiquement promu admin via `leaveCircle(circleId, uid)` (sans sélection manuelle de successeur)
**And** les étapes de suppression de AC3 s'enchaînent ensuite

> **Justification :** la promotion manuelle est disponible dans la gestion du cercle (Story 4.6). La suppression de compte est une action définitive — on évite d'ajouter une étape de sélection dans un flux de haute gravité.

### AC5 — Supprimer mon compte — admin dernier membre

**Given** je suis admin et le seul membre du cercle et je confirme "Supprimer mon compte"
**When** la modal de confirmation s'affiche
**Then** un avertissement est visible : "Vous êtes seul dans ce cercle. Il sera supprimé."
**And** après confirmation, `deleteCircle(circleId, uid)` est appelé (Story 4.6)
**And** les étapes de suppression de AC3 s'enchaînent ensuite

### AC6 — Gestion de l'erreur requires-recent-login

**Given** Firebase Auth exige une authentification récente pour supprimer le compte
**When** l'erreur `auth/requires-recent-login` est levée
**Then** un message s'affiche : "Pour des raisons de sécurité, reconnectez-vous avant de supprimer votre compte."
**And** l'utilisatrice est redirigée vers l'écran de connexion
**And** aucune donnée n'est supprimée (opération atomique : suppression Auth en dernier)

### AC7 — État de chargement

**Given** une suppression en cours
**When** les opérations Firestore s'exécutent
**Then** les boutons sont désactivés et un indicateur de chargement est visible
**And** l'utilisatrice ne peut pas lancer une deuxième suppression en parallèle

## Tasks / Subtasks

- [ ] **Task 1 — Fonction `deleteAllItems(uid)` dans `lib/firestore.ts`** (AC2, AC3)
  - [ ] `getDocs(collection(db, 'users', uid, 'items'))` → boucle `deleteDoc` sur chaque document
  - [ ] Utiliser `writeBatch` si le nombre d'items peut dépasser 500 (Firestore batch limit)
  - [ ] Retourner le nombre d'items supprimés

- [ ] **Task 2 — Fonction `deleteAccount(uid, circleId?)` dans `lib/account.ts`** (AC3, AC4, AC5)
  - [ ] Appeler `deleteAllItems(uid)`
  - [ ] Si `circleId` : appeler `leaveCircle(circleId, uid)` ou `deleteCircle(circleId, uid)` selon le nombre de membres restants
  - [ ] `deleteDoc(doc(db, 'users', uid))`
  - [ ] `deleteUser(auth.currentUser!)` — EN DERNIER (point de non-retour)
  - [ ] Propager l'erreur `requires-recent-login` sans avoir supprimé les données Firestore

  ```typescript
  // Ordre critique : Auth en dernier
  // Si deleteUser échoue avec requires-recent-login,
  // les données Firestore ont déjà été supprimées — acceptable (RGPD-compliant)
  // mais l'utilisatrice doit se reconnecter pour finaliser
  ```

- [ ] **Task 3 — Modal de confirmation `DeleteConfirmModal`** (AC1, AC4, AC5, AC6, AC7)
  - [ ] Props : `type: 'data' | 'account'`, `isAdmin`, `isLastMember`, `onConfirm`, `onCancel`
  - [ ] Message adapté selon `type` + `isAdmin` + `isLastMember`
  - [ ] Texte de confirmation en rouge : "Cette action est irréversible."

- [ ] **Task 4 — Mise à jour `app/(app)/settings.tsx`** (AC1, AC2, AC3)
  - [ ] Section "Danger" avec les deux boutons
  - [ ] Lire `isAdmin` et nombre de membres depuis `useCircle()`
  - [ ] État `isDeleting: boolean` pour AC7
  - [ ] Handler `handleDeleteData()` : confirmation → `deleteAllItems` → vider le store collection → toast succès
  - [ ] Handler `handleDeleteAccount()` : confirmation avec avertissement si admin → `deleteAccount` → redirection

- [ ] **Task 5 — Tests** (tous ACs)
  - [ ] `deleteAllItems` : getDocs + deleteDoc appelé pour chaque item
  - [ ] `deleteAccount` : ordre des opérations (items → cercle → users doc → Auth)
  - [ ] `deleteAccount` : erreur `requires-recent-login` → propagée, données Firestore déjà supprimées
  - [ ] Modal : message admin + autres membres → avertissement succession automatique
  - [ ] Modal : message admin + seul membre → avertissement suppression cercle
  - [ ] Handler : `isDeleting === true` pendant l'opération → boutons désactivés

## Dev Notes

### Ordre des opérations (deleteAccount)

```typescript
// lib/account.ts
import { deleteUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { deleteAllItems } from '@/lib/firestore'
import { leaveCircle, deleteCircle, getCircle } from '@/lib/circle'

export async function deleteAccount(uid: string, circleId: string | null) {
  // 1. Supprimer les items
  await deleteAllItems(uid)

  // 2. Gérer le cercle
  if (circleId) {
    const circle = await getCircle(circleId)
    if (circle) {
      const isLastMember = circle.members.length === 1
      if (isLastMember) {
        await deleteCircle(circleId, uid)
      } else {
        await leaveCircle(circleId, uid) // auto-promote oldest
      }
    }
  }

  // 3. Supprimer le profil utilisateur
  await deleteDoc(doc(db, 'users', uid))

  // 4. EN DERNIER : supprimer le compte Auth
  // Cette ligne peut lever auth/requires-recent-login
  await deleteUser(auth.currentUser!)
}
```

### Batch delete pour les items

```typescript
import { writeBatch, collection, getDocs } from 'firebase/firestore'

export async function deleteAllItems(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'items'))
  if (snap.empty) return 0
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}
```

### Vider le store collection après deleteAllItems

```typescript
// Dans le handler settings.tsx
await deleteAllItems(uid)
useCollectionStore.getState().setItems([]) // ou équivalent selon l'implémentation du store
```

### References

- [Source: story 6-2] — AC4 (suppression de compte basique, supersédé par cette story)
- [Source: story 4-6] — leaveCircle, deleteCircle (dépendance obligatoire)
- [Source: lib/circle.ts] — getCircle, Circle.members
- [Source: hooks/useCircle.ts] — isAdmin, members.length
- [Source: lib/firestore.ts] — deleteItem (pattern à étendre en batch)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `lib/account.ts` (nouveau)
- `lib/account.test.ts` (nouveau)
- `lib/firestore.ts` (modification — ajout deleteAllItems)
- `components/settings/DeleteConfirmModal.tsx` (nouveau)
- `app/(app)/settings.tsx` (modification — section Danger)
