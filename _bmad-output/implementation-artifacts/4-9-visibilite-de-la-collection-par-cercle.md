# Story 4.9 : Visibilité de la collection par cercle

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux choisir auprès de quels cercles ma collection est visible,
Afin de contrôler ma vie privée et décider avec qui je partage mes données.

## Contexte technique

### État actuel du code

L'accès à la collection d'un membre est aujourd'hui **tout-ou-rien par cercle** :
- `firestore.rules` ligne 71-74 : `allow read` sur `/users/{userId}/items/{itemId}` si `sharesCircle(userData.circleIds)` → n'importe quel membre d'un cercle commun peut lire les items.
- `app/(app)/member/[uid].tsx` : requête directe `getDocs(query(collection(db, 'users', memberUid, 'items'), orderBy('addedAt', 'desc')))` — si les règles Firestore bloquent, l'accès échoue silencieusement.
- Le profil utilisateur `/users/{uid}` contient `circleIds: string[]` (multi-cercle supporté) mais **aucun champ de visibilité**.

### Approche retenue

Ajouter un champ `collectionVisibleToCircles?: string[]` au profil utilisateur :
- **Non défini ou null** = comportement rétrocompatible (visible à tous les cercles partagés)
- **Tableau de circleIds** = whitelist : seuls les membres de ces cercles peuvent lire la collection
- Par défaut à l'ajout d'un cercle : le circleId est ajouté à `collectionVisibleToCircles` → **visible par défaut**

Les Firestore Security Rules deviennent la source de vérité pour l'enforcement. L'UI reflète et modifie ce champ.

## Dépendances

- **Story 4.1** (Système d'invitation et rejoindre le cercle) — la logique `circleIds` dans le profil utilisateur.
- **Story 4.2** (Gestion du cercle) — `useCircle()` et `CircleData` utilisés pour lister les cercles.
- **Story 4.3** (Consulter la collection d'un membre) — `app/(app)/member/[uid].tsx` à mettre à jour pour gérer le cas "accès refusé".

## Acceptance Criteria

### AC1 — Réglage de visibilité dans les Paramètres

**Given** l'écran Paramètres (`app/(app)/settings.tsx`)
**When** j'accède à la section "Confidentialité"
**Then** la liste de tous mes cercles s'affiche (via `authStore.circleIds` + `useCircle`)
**And** chaque cercle affiche un toggle "Collection visible" activé par défaut

**Given** je désactive le toggle d'un cercle
**When** je confirme
**Then** ce `circleId` est retiré de `collectionVisibleToCircles` dans `/users/{uid}`
**And** le toggle s'affiche désactivé immédiatement

**Given** je réactive le toggle d'un cercle
**When** je confirme
**Then** ce `circleId` est rajouté à `collectionVisibleToCircles` dans `/users/{uid}`
**And** le toggle s'affiche activé immédiatement

### AC2 — Enforcement via Firestore Security Rules

**Given** `collectionVisibleToCircles` défini sur le profil cible
**When** un membre d'un cercle **présent** dans `collectionVisibleToCircles` tente de lire les items
**Then** la lecture est autorisée par les règles Firestore

**Given** `collectionVisibleToCircles` défini sur le profil cible
**When** un membre d'un cercle **absent** de `collectionVisibleToCircles` tente de lire les items
**Then** la lecture est refusée par les règles Firestore (PERMISSION_DENIED)

**Given** `collectionVisibleToCircles` absent ou null sur le profil cible (rétrocompatibilité)
**When** un membre d'un cercle commun tente de lire les items
**Then** la lecture est autorisée (comportement identique à avant cette story)

### AC3 — Affichage "Collection privée" sur la page membre

**Given** un membre dont la collection est masquée pour mon cercle
**When** j'accède à `/(app)/member/{uid}`
**Then** un message "Collection privée" s'affiche à la place de la liste d'items
**And** aucune erreur silencieuse ne se produit (pas de crash, pas de liste vide sans explication)

### AC4 — Visibilité par défaut lors de l'adhésion à un cercle

**Given** un utilisateur qui rejoint un nouveau cercle
**When** son profil est mis à jour avec le nouveau `circleId`
**Then** ce `circleId` est automatiquement ajouté à `collectionVisibleToCircles`
**And** sa collection reste visible dans ce nouveau cercle par défaut

## Tasks / Subtasks

- [ ] **Task 1 — Mise à jour des Firestore Security Rules** (AC2)
  - [ ] Ajouter la fonction helper `isCollectionVisibleToRequester(userData)` dans `firestore.rules`
  - [ ] Remplacer la règle `allow read` sur `/users/{userId}/items/{itemId}` pour utiliser ce helper
  - [ ] Déployer les règles : `firebase deploy --only firestore:rules`
  - [ ] Tester : membre d'un cercle autorisé → accès OK ; membre d'un cercle bloqué → PERMISSION_DENIED

- [ ] **Task 2 — Mise à jour du type UserProfile** (AC1, AC4)
  - [ ] Ajouter `collectionVisibleToCircles?: string[]` dans le type `UserProfile` (chercher dans `types/` ou `lib/auth.ts`)
  - [ ] Mettre à jour `authStore` si nécessaire pour exposer ce champ

- [ ] **Task 3 — Fonction lib de mise à jour de la visibilité** (AC1)
  - [ ] Créer `updateCollectionVisibility(uid: string, visibleCircleIds: string[])` dans `lib/user.ts` (ou `lib/auth.ts` selon l'existant)
  - [ ] Utiliser `updateDoc(doc(db, 'users', uid), { collectionVisibleToCircles: visibleCircleIds })`

- [ ] **Task 4 — Mise à jour de la logique rejoindre un cercle** (AC4)
  - [ ] Dans `lib/circle.ts`, fonction `joinCircle()` (ou équivalent) : après avoir ajouté le `circleId` dans le profil, ajouter aussi ce `circleId` dans `collectionVisibleToCircles` (arrayUnion ou reconstruction du tableau)

- [ ] **Task 5 — UI Paramètres — section Confidentialité** (AC1)
  - [ ] Dans `app/(app)/settings.tsx`, ajouter une section "Confidentialité" après les sections existantes
  - [ ] Charger les données des cercles via `useCircle` pour chaque `circleId` de l'utilisateur (nom du cercle)
  - [ ] Afficher un `Switch` (React Native) ou toggle NativeWind par cercle avec label = nom du cercle
  - [ ] État local initialisé depuis `user.collectionVisibleToCircles` (si undefined → tous les cercles activés)
  - [ ] Sur changement de toggle : appeler `updateCollectionVisibility(uid, newVisibleCircleIds)`
  - [ ] Gérer l'état loading/error pendant la mise à jour

- [ ] **Task 6 — Gestion du cas "Collection privée" dans la page membre** (AC3)
  - [ ] Dans `app/(app)/member/[uid].tsx`, dans le `catch` du `getDocs`, détecter l'erreur `PERMISSION_DENIED`
  - [ ] Si PERMISSION_DENIED → afficher un `EmptyState` avec message "Collection privée" (icône cadenas recommandée)
  - [ ] Sinon → comportement d'erreur existant

- [ ] **Task 7 — Tests** (AC1, AC2, AC3, AC4)
  - [ ] `lib/user.ts` : `updateCollectionVisibility` met bien à jour `collectionVisibleToCircles` dans Firestore
  - [ ] `lib/circle.ts` : `joinCircle` ajoute le circleId dans `collectionVisibleToCircles`
  - [ ] `settings.tsx` : toggle désactivé → `collectionVisibleToCircles` ne contient plus ce circleId
  - [ ] `member/[uid].tsx` : PERMISSION_DENIED → affiche "Collection privée"

## Dev Notes

### Implémentation des Firestore Security Rules

La nouvelle fonction helper à ajouter dans `firestore.rules` :

```javascript
// Vérifie que la collection du profil cible est visible pour le requêteur
// en croisant les circleIds partagés avec la whitelist collectionVisibleToCircles
function isCollectionVisibleToRequester(userData) {
  // Rétrocompatibilité : si collectionVisibleToCircles absent → visible à tous les cercles partagés
  let visibleIds = 'collectionVisibleToCircles' in userData
    ? userData.collectionVisibleToCircles
    : userData.circleIds;

  return visibleIds != null && visibleIds.size() > 0 && (
    isCircleMember(visibleIds[0]) ||
    (visibleIds.size() > 1 && isCircleMember(visibleIds[1])) ||
    (visibleIds.size() > 2 && isCircleMember(visibleIds[2]))
  );
}
```

Remplacer la règle items existante (ligne 71-74) :

```javascript
// AVANT
allow read: if isAuth() &&
  exists(/databases/$(database)/documents/users/$(userId)) &&
  sharesCircle(get(/databases/$(database)/documents/users/$(userId)).data.circleIds);

// APRÈS
allow read: if isAuth() &&
  exists(/databases/$(database)/documents/users/$(userId)) &&
  isCollectionVisibleToRequester(get(/databases/$(database)/documents/users/$(userId)).data);
```

**Note importante** : Firestore Security Rules ne supportent pas `let`/variables locales dans les fonctions de la même façon que JavaScript. Si le compilateur de règles rejette `let`, utiliser cette version alternative :

```javascript
function isCollectionVisibleToRequester(userData) {
  return (
    !('collectionVisibleToCircles' in userData) && sharesCircle(userData.circleIds)
  ) || (
    'collectionVisibleToCircles' in userData &&
    userData.collectionVisibleToCircles != null &&
    userData.collectionVisibleToCircles.size() > 0 && (
      isCircleMember(userData.collectionVisibleToCircles[0]) ||
      (userData.collectionVisibleToCircles.size() > 1 && isCircleMember(userData.collectionVisibleToCircles[1])) ||
      (userData.collectionVisibleToCircles.size() > 2 && isCircleMember(userData.collectionVisibleToCircles[2]))
    )
  );
}
```

### Détection PERMISSION_DENIED dans member/[uid].tsx

```typescript
try {
  const snap = await getDocs(q)
  // ... traitement normal
} catch (error: unknown) {
  if (
    error instanceof Error &&
    'code' in error &&
    (error as { code: string }).code === 'permission-denied'
  ) {
    setIsPrivate(true)  // nouvel état local
  } else {
    console.error('Erreur chargement collection membre', error)
  }
}
```

Puis dans le rendu :
```tsx
{isPrivate ? (
  <EmptyState
    icon="lock-closed-outline"  // ou icône NativeWind/Ionicons
    title="Collection privée"
    subtitle="Ce membre a choisi de ne pas partager sa collection avec ton cercle."
  />
) : items.length === 0 ? (
  <EmptyState title="Collection vide" />
) : (
  <FlashList ... />
)}
```

### Mise à jour de joinCircle dans lib/circle.ts

Lors d'un `joinCircle`, ajouter `arrayUnion` pour `collectionVisibleToCircles` :

```typescript
import { arrayUnion, updateDoc, doc } from 'firebase/firestore'

// Dans joinCircle() après avoir mis à jour le document cercle :
await updateDoc(doc(db, 'users', uid), {
  circleIds: arrayUnion(circleId),
  collectionVisibleToCircles: arrayUnion(circleId),  // ← visible par défaut
})
```

### Conventions à respecter

- `collectionVisibleToCircles` en `camelCase` (convention Firestore du projet)
- Utiliser `updateDoc` (pas `setDoc` avec `merge`) pour ne pas écraser les autres champs
- Respecter le pattern `FunctionResponse<T>` si `updateCollectionVisibility` est exposé en tant que lib function
- Co-localiser les tests : `lib/user.test.ts`

### Structure fichiers touchés

```
firestore.rules                          ← modifier helper + règle items
types/                                   ← ajouter collectionVisibleToCircles au type user
lib/user.ts  (ou lib/auth.ts)            ← updateCollectionVisibility()
lib/circle.ts                            ← joinCircle() → arrayUnion sur collectionVisibleToCircles
app/(app)/settings.tsx                   ← section Confidentialité
app/(app)/member/[uid].tsx               ← gestion PERMISSION_DENIED → état "Collection privée"
```

### Project Structure Notes

- Les règles Firestore supportent jusqu'à **3 cercles** dans `sharesCircle()` / fonctions similaires — `collectionVisibleToCircles` doit respecter la même limite (max 3 entrées indexées).
- `useCircle()` hook charge les données d'un cercle via `circleId`. Pour afficher le **nom** de chaque cercle dans les paramètres, itérer sur `authStore.circleIds` et appeler `useCircle` pour chacun — attention aux règles des hooks React (ne pas appeler dans une boucle). Solution : créer un composant `CircleVisibilityToggle` qui reçoit un `circleId` et gère son propre `useCircle`.
- **Ne pas confondre** `circleIds` (cercles dont l'utilisateur est membre) et `collectionVisibleToCircles` (sous-ensemble des précédents où la collection est partagée). Un circleId dans `collectionVisibleToCircles` mais **absent** de `circleIds` ne devrait pas exister — valider côté client.

### References

- [Source: firestore.rules#L31-L48] — `sharesCircle()` et `isAdminOfSharedCircle()` — modèle pour la nouvelle fonction helper
- [Source: firestore.rules#L67-L75] — règle items existante à modifier
- [Source: types/circle.ts] — `CircleData`, `Member`
- [Source: lib/circle.ts] — `joinCircle()`, `leaveCircle()` à mettre à jour
- [Source: app/(app)/settings.tsx] — écran paramètres existant à compléter
- [Source: app/(app)/member/[uid].tsx] — page collection membre, gestion PERMISSION_DENIED
- [Source: story 4-1] — `joinCircle` pattern d'origine (inviteToken → membres)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `firestore.rules` (modification — nouvelle fonction helper + règle items mise à jour)
- `types/` (modification — ajouter `collectionVisibleToCircles?: string[]` au type user)
- `lib/user.ts` ou `lib/auth.ts` (modification — `updateCollectionVisibility()`)
- `lib/circle.ts` (modification — `joinCircle()` → `arrayUnion` sur `collectionVisibleToCircles`)
- `app/(app)/settings.tsx` (modification — section Confidentialité)
- `app/(app)/member/[uid].tsx` (modification — gestion PERMISSION_DENIED)
