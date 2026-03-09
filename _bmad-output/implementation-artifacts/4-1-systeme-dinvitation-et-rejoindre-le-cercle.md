# Story 4.1 : Système d'invitation et rejoindre le cercle

Status: done

## Story

En tant qu'administratrice,
Je veux générer un lien d'invitation pour mon cercle,
Afin que mes proches puissent rejoindre Cinook et accéder à l'espace partagé.

## Acceptance Criteria

### AC1 — Génération du lien d'invitation

**Given** l'écran de gestion du cercle (`app/(app)/circle.tsx`) en mode admin
**When** je génère un lien d'invitation
**Then** un token UUID unique est créé dans `/circles/{circleId}/inviteToken`
**And** le lien copiable est affiché (format : `https://[app-url]/invite/{token}`)

### AC2 — Rejoindre via lien

**Given** une nouvelle utilisatrice qui clique sur le lien d'invitation
**When** elle accède à `app/invite/[token].tsx`
**Then** le token est validé contre Firestore
**And** si valide, son `uid` est ajouté au tableau `members[]` du cercle
**And** son profil `/users/{uid}` est mis à jour avec le `circleId`
**And** elle est redirigée vers l'écran principal

### AC3 — Token invalide

**Given** un token invalide ou expiré
**When** une utilisatrice tente de l'utiliser
**Then** un message d'erreur explicite s'affiche ("Lien invalide ou expiré")
**And** aucune modification Firestore n'est effectuée

## Tasks / Subtasks

- [x] **Task 1 — Création du cercle pour l'admin** (AC1)
  - [x] Si l'utilisatrice connectée n'a pas de `circleId` → créer un cercle automatiquement au premier accès à `circle.tsx`
  - [x] `addDoc(collection(db, 'circles'), { members: [uid], adminId: uid, createdAt: serverTimestamp() })`
  - [x] Mettre à jour `/users/{uid}` avec le `circleId` créé
  - [x] `authStore.setCircle(circleId, true)` (isAdmin: true)

- [x] **Task 2 — Génération du token dans circle.tsx** (AC1)
  - [x] Bouton "Générer un lien d'invitation"
  - [x] Générer UUID côté client : `crypto.randomUUID()` ou `uuid` package
  - [x] `updateDoc(circleRef, { inviteToken: token })`
  - [x] Afficher le lien : `https://cinook-caf55.web.app/invite/${token}`
  - [x] Bouton "Copier" → `Clipboard.setStringAsync(link)` (expo-clipboard)

- [x] **Task 3 — Implémenter `app/invite/[token].tsx`** (AC2, AC3)
  - [x] Lire le token depuis `useLocalSearchParams`
  - [x] Chercher dans Firestore : `query(collection(db, 'circles'), where('inviteToken', '==', token))`
  - [x] Si non trouvé → afficher "Lien invalide ou expiré"
  - [x] Si trouvé → `arrayUnion` pour ajouter uid dans `members[]`
  - [x] Mettre à jour `/users/{uid}` avec `circleId`
  - [x] `authStore.setCircle(circleId, false)` (isAdmin: false)
  - [x] `router.replace('/(app)/')`

- [x] **Task 4 — Tests** (tous ACs)
  - [x] Test : génération token → `updateDoc` avec inviteToken
  - [x] Test : token valide → uid ajouté dans members, circleId mis à jour
  - [x] Test : token invalide → message d'erreur, aucun update Firestore

## Dev Notes

### arrayUnion pour ajouter un membre

```typescript
import { arrayUnion, updateDoc, doc } from 'firebase/firestore'

await updateDoc(doc(db, 'circles', circleId), {
  members: arrayUnion(uid),
})
await updateDoc(doc(db, 'users', uid), { circleId })
```

### expo-clipboard

```bash
npx expo install expo-clipboard
```

```typescript
import * as Clipboard from 'expo-clipboard'
await Clipboard.setStringAsync(link)
```

### URL du lien d'invitation

Utiliser le project ID Firebase Hosting : `https://cinook-caf55.web.app/invite/${token}`

### References

- [Source: epics.md#Story 4.1]
- [Source: architecture.md#Authentication & Security] — Token UUID, members[]
- [Source: architecture.md#Data Architecture] — /circles/{circleId}

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `app/invite/[token].tsx` (stub → implémentation)
- `app/(app)/circle.tsx` (mise à jour)
