---
title: 'Multi-admin et sélection de cercle pour le Cinéclub'
slug: 'multi-admin-cineclub-choix-cercle'
created: '2026-03-14'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React Native', 'Expo Router', 'TypeScript', 'Zustand', 'Firestore', 'NativeWind/Tailwind']
files_to_modify:
  - 'types/circle.ts'
  - 'lib/circle.ts'
  - 'hooks/useCircle.ts'
  - 'app/(app)/circle.tsx'
  - 'components/circle/MemberList.tsx'
  - 'components/circle/MemberCard.tsx'
  - 'components/circle/CineclubButton.tsx'
  - 'hooks/useCircle.test.ts'
  - 'lib/circle.test.ts'
  - 'components/circle/CineclubButton.test.tsx'
code_patterns:
  - 'adminId: string → adminIds: string[] avec fallback rétrocompat (data.adminIds ?? [data.adminId])'
  - 'addAdmin: arrayUnion, demoteAdmin: arrayRemove avec garde last-admin'
  - 'MemberCard menu contextuel: cible admin → Rétrograder, cible membre → Promouvoir'
  - 'CineclubButton: modal sélecteur cercle si circleIds.length > 1, sinon activeCircleId direct'
  - 'leaveCircle: si adminIds.length > 1 → départ libre, si === 1 → successeur requis'
test_patterns:
  - 'Jest + @testing-library/react-native'
  - 'Mocks Firestore (arrayUnion/arrayRemove), authStore, firebase'
  - 'makeCircleSnap migré: adminIds: string[] au lieu de adminId: string'
  - 'Tests addAdmin/demoteAdmin dans circle.test.ts'
  - 'Tests CineclubButton: modal sélecteur, setDoc vers le bon cercle choisi'
---

# Tech-Spec: Multi-admin et sélection de cercle pour le Cinéclub

**Created:** 2026-03-14

## Overview

### Problem Statement

Deux limitations actuelles :
1. Un cercle ne peut avoir qu'un seul administrateur (`adminId: string` dans Firestore). La fonction `promoteMember` **remplace** l'admin existant au lieu d'en ajouter un. Il est impossible d'avoir plusieurs admins simultanément, ni de rétrograder un admin.
2. Quand un utilisateur appartient à plusieurs cercles, le `CineclubButton` (cinéclub/coin lecture) poste systématiquement vers le cercle actif (`activeCircleId`) sans permettre de choisir le cercle cible.

### Solution

1. Migrer `adminId: string` → `adminIds: string[]` dans le modèle Firestore et tout le code qui l'utilise. Ajouter les fonctions `addAdmin` (arrayUnion) et `demoteAdmin` (arrayRemove). Adapter la logique de départ (si dernier admin, successeur requis ; sinon départ libre).
2. Dans `CineclubButton`, quand `circleIds.length > 1`, afficher une modal de sélection de cercle avant de poster. Si un seul cercle, comportement actuel inchangé.

### Scope

**In Scope:**
- Migration `adminId` → `adminIds` dans : `types/circle.ts`, `lib/circle.ts`, `hooks/useCircle.ts`, `app/(app)/circle.tsx`, `components/circle/MemberList.tsx`, `components/circle/MemberCard.tsx`
- Promotion : ajouter un admin (arrayUnion sur `adminIds`)
- Rétrogradation : retirer un admin (arrayRemove sur `adminIds`), bloquée si c'est le dernier admin
- Départ d'un admin : si `adminIds.length === 1` → demander successeur ; si `adminIds.length > 1` → départ libre sans successeur
- `CineclubButton` : sélecteur de cercle si `circleIds.length > 1`, comportement actuel si `circleIds.length === 1`
- Rétrocompatibilité lecture : si un document Firestore a encore `adminId` (sans `adminIds`), l'utiliser comme fallback

**Out of Scope:**
- Notion de "super-admin" avec droits supplémentaires
- Nouveau design de l'écran cercle
- Gestion des droits granulaires par rôle
- Script de migration Firestore (migration lazy au premier accès)

## Context for Development

### Codebase Patterns

- **Firestore** : pattern `onSnapshot` avec cleanup obligatoire (`return unsub`). Fonctions lib async pures, `arrayUnion`/`arrayRemove` de Firestore.
- **State management** : Zustand (`useAuthStore`), `circleIds: string[]` et `activeCircleId` déjà disponibles.
- **Hooks** : `useCircle` lit `activeCircleId` depuis le store, retourne `members`, `isAdmin`, `adminId`, `loading`, `error`.
- **UI admin conditionnelle** : `isAdmin` contrôle invitation, renommage, actions membres. Sections entières masquées/affichées.
- **MemberCard menu** : bouton "•••" ouvre un menu inline (pas de bottom-sheet natif). Actions textuelles colorées (`text-amber-400`, `text-red-400`).
- **CineclubButton** : `setDoc` pour poster (écrase/crée), `deleteDoc` pour retirer. Label déjà dynamique via `getLabel(item.type)`.
- **LeaveCircleModal** : pattern `Modal` RN avec liste scrollable de membres-successeurs, identique à réutiliser pour le sélecteur de cercle.
- **Tests** : Jest + @testing-library/react-native. Mocks Firestore, authStore, firebase. Pattern `makeCircleSnap` dans `useCircle.test.ts`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `types/circle.ts` | `CircleData.adminId: string` → `adminIds: string[]`. Interface `Circle` dans `lib/circle.ts` aussi à migrer. |
| `lib/circle.ts` | `createCircle` (init), `promoteMember` (→ `addAdmin`), nouveau `demoteAdmin`, `leaveCircle` (logique admin), `getCircle` (utilisé dans CineclubButton) |
| `hooks/useCircle.ts` | `setAdminId` → `setAdminIds: string[]`, `isAdmin = adminIds.includes(uid)`, fallback rétrocompat |
| `app/(app)/circle.tsx` | `CircleSummary.adminId` → `adminIds`, `handlePromoteMember`/`handleLeaveCircle` (logique multi-admin), `MemberList` props |
| `components/circle/MemberList.tsx` | Prop `adminId: string \| null` → `adminIds: string[]`, passe `isAdmin` à `MemberCard` |
| `components/circle/MemberCard.tsx` | Prop `isAdmin: boolean` OK. Action `'promote' \| 'remove'` → `'addAdmin' \| 'demoteAdmin' \| 'remove'`. Menu contextuel selon statut cible. |
| `components/circle/CineclubButton.tsx` | Lire aussi `circleIds` depuis authStore. Modal sélecteur si `circleIds.length > 1`. |
| `components/circle/LeaveCircleModal.tsx` | Pattern de référence pour la modal sélecteur de cercle (Modal RN, ScrollView, TouchableOpacity) |
| `stores/authStore.ts` | `circleIds` et `activeCircleId` disponibles — aucune modif nécessaire |
| `hooks/useCircle.test.ts` | `makeCircleSnap(adminId, members)` → `makeCircleSnap(adminIds, members)`, tests `isAdmin` mis à jour |
| `lib/circle.test.ts` | Tests `createCircle` (adminIds), `addAdmin`, `demoteAdmin`, `leaveCircle` multi-admin |
| `components/circle/CineclubButton.test.tsx` | Nouveaux tests : modal sélecteur, `setDoc` vers le cercle choisi |

### Technical Decisions

**Multi-admin :**
- `createCircle` : écrire `adminIds: [uid]` (Firestore) — `adminId` n'est plus écrit sur les nouveaux cercles
- `addAdmin(circleId, uid)` : `updateDoc` avec `{ adminIds: arrayUnion(uid) }` — remplace `promoteMember`
- `demoteAdmin(circleId, uid)` : lit d'abord `getCircle`, résout `adminIds` via le fallback rétrocompat (voir ci-dessous), vérifie `adminIds.length > 1`, puis `updateDoc({ adminIds: arrayRemove(uid) })`. Lève `Error('Impossible de rétrograder le dernier administrateur')` si seul admin.
- **Fallback rétrocompat (F4)** — priorité stricte dans tous les points d'accès (lib, hook) : `const adminIds = Array.isArray(data.adminIds) && data.adminIds.length > 0 ? data.adminIds : data.adminId ? [data.adminId] : []`. Règle : si `adminIds` est présent ET non-vide → l'utiliser. Si absent ou vide ET `adminId` présent → `[adminId]`. Si les deux sont absents → `[]` (cercle en état corrompu, traiter comme "aucun admin").
- `leaveCircle` : résoudre `adminIds` via le fallback ci-dessus. Si `adminIds.includes(uid) && adminIds.length === 1` → successeur requis (comportement modal actuel). Si `adminIds.includes(uid) && adminIds.length > 1` → `updateDoc({ adminIds: arrayRemove(uid) })` puis retirer de `members` et `users/{uid}/circleIds` (pas de successeur). Si uid absent de `adminIds` (membre simple) → retirer uniquement de `members` et `users/{uid}/circleIds` (pas d'appel à `addAdmin`/`demoteAdmin`).
- `useCircle` : appliquer le même fallback rétrocompat. Retourner `adminIds: string[]` (jamais `adminId`).
- **Signature `onAdminAction` (F1)** — `MemberCard` reçoit `onAdminAction?: (action: 'addAdmin' | 'demoteAdmin' | 'remove') => void` (sans `targetUid` — le UID est connu par closure dans `MemberList`). `MemberList` enveloppe : `(action) => onAdminAction?.(item.uid, action)`. `circle.tsx` reçoit `(targetUid, action)` depuis `MemberList`.
- **`canDemote` (F3)** — flag global calculé dans `MemberList` : `const canDemote = adminIds.length > 1`. Signification : "le cercle a plusieurs admins, donc un admin peut être rétrogradé sans bloquer le cercle". Passé à chaque `MemberCard`. Dans `MemberCard` : afficher "Rétrograder" uniquement si `isAdmin && canDemote`. Si `isAdmin && !canDemote` : ne pas afficher "Rétrograder" (seul admin). Toujours afficher "Expulser".
- `circle.tsx` `CircleSummary` : `adminId: string` → `adminIds: string[]`.

**CineclubButton — sélecteur de cercle :**
- Lire `circleIds` depuis `useAuthStore` en plus de `activeCircleId`
- Si `circleIds.length <= 1` : comportement actuel inchangé (poster vers `activeCircleId`)
- Si `circleIds.length > 1` : au clic, charger les noms via `Promise.all(circleIds.map(id => getCircle(id)))`, filtrer les résultats null, puis ouvrir une `Modal`
- L'utilisateur sélectionne un cercle → `doPost(option.id)` + fermer modal
- **États locaux initialisés (F10)** : `const [showPicker, setShowPicker] = useState(false)`, `const [circleOptions, setCircleOptions] = useState<{id:string,name:string}[]>([])`, `const [loadingPicker, setLoadingPicker] = useState(false)`
- **Gestion d'erreur picker (F8)** : entourer le chargement dans un `try/catch` ; si erreur → `alert('Cinéclub', 'Impossible de charger vos cercles.')` via `useAlert`, ne pas ouvrir la modal
- **Cache (F11)** : si `circleOptions.length > 0`, ne pas recharger — réutiliser la valeur en cache et ouvrir directement la modal

## Implementation Plan

### Tasks

- [x] **Task 1 — Migrer `types/circle.ts`**
  - File: `types/circle.ts`
  - Action: Dans `CircleData`, remplacer `adminId: string` par `adminIds: string[]` ET ajouter `adminId?: string` comme champ optionnel déprécié. Dans l'interface `Circle` de `lib/circle.ts`, même traitement. Le champ optionnel permet au TypeScript d'accéder à `data.adminId` dans le fallback rétrocompat sans erreur de type.
  - Notes: Ne pas supprimer `adminId?` — c'est le seul moyen d'éviter des erreurs TypeScript dans le code de fallback qui lit `data.adminId` sur des documents Firestore legacy.

- [x] **Task 2 — Mettre à jour `lib/circle.ts`**
  - File: `lib/circle.ts`
  - Action:
    1. Interface `Circle` : `adminId: string` → `adminIds: string[]`
    2. `createCircle` : écrire `adminIds: [uid]` (retirer `adminId`)
    3. Ajouter `addAdmin(circleId: string, uid: string): Promise<void>` → `updateDoc({ adminIds: arrayUnion(uid) })`
    4. Ajouter `demoteAdmin(circleId: string, uid: string): Promise<void>` → lit le cercle, vérifie `(circle.adminIds ?? [circle.adminId]).length > 1`, puis `updateDoc({ adminIds: arrayRemove(uid) })`. Lève `Error('Impossible de rétrograder le dernier administrateur')` sinon.
    5. `leaveCircle` : appliquer le fallback rétrocompat strict pour résoudre `adminIds` (voir Technical Decisions). Si `adminIds.includes(uid) && adminIds.length === 1` → successeur requis (comportement modal actuel, appel `addAdmin` sur le successeur). Si `adminIds.includes(uid) && adminIds.length > 1` → `updateDoc({ adminIds: arrayRemove(uid) })` puis retirer de `members` et `users/{uid}/circleIds` (pas de successeur). Si uid absent de `adminIds` (membre simple) → retirer uniquement de `members` et `users/{uid}/circleIds` — aucun appel à `addAdmin`.
    6. Retirer `promoteMember` (remplacé par `addAdmin`). Avant suppression : vérifier via grep que `promoteMember` n'est importé nulle part ailleurs dans le projet.
  - Notes: `getCircle` reste inchangé. Le chemin non-admin de `leaveCircle` était déjà indépendant de `promoteMember` dans l'implémentation actuelle.

- [x] **Task 3 — Mettre à jour `hooks/useCircle.ts`**
  - File: `hooks/useCircle.ts`
  - Action:
    1. État : `const [adminIds, setAdminIds] = useState<string[]>([])`
    2. Dans le callback `onSnapshot` : `const adminIds = data.adminIds ?? (data.adminId ? [data.adminId] : [])` puis `setAdminIds(adminIds)`
    3. `isAdmin = adminIds.includes(uid ?? '')`
    4. Retourner `{ members, isAdmin, adminIds, loading, error }` (supprimer `adminId` du retour)
  - Notes: Le fallback `data.adminId` assure la rétrocompatibilité pour les cercles non migrés.

- [x] **Task 4 — Mettre à jour `components/circle/MemberCard.tsx`**
  - File: `components/circle/MemberCard.tsx`
  - Action:
    1. Props : `onAdminAction?: (action: 'addAdmin' | 'demoteAdmin' | 'remove') => void` (sans `targetUid` — fourni par closure dans MemberList). Ajouter prop `canDemote?: boolean`.
    2. Menu contextuel : si `isAdmin && canDemote` → afficher "Rétrograder" (`text-orange-400`, action `'demoteAdmin'`) ; si `isAdmin && !canDemote` → ne pas afficher "Rétrograder" (seul admin du cercle) ; si `!isAdmin` → afficher "Promouvoir admin" (`text-amber-400`, action `'addAdmin'`). Toujours afficher "Expulser" (`text-red-400`, action `'remove'`).
  - Notes: Le bouton "•••" n'apparaît que si `onAdminAction` est défini (logique actuelle inchangée). `MemberList` est responsable de fournir le UID via closure.

- [ ] **Task 5 — Mettre à jour `components/circle/MemberList.tsx`**
  - File: `components/circle/MemberList.tsx`
  - Action:
    1. Prop `adminId: string | null` → `adminIds: string[]`
    2. Calculer `const canDemote = adminIds.length > 1` (flag global : "le cercle a plusieurs admins")
    3. `renderItem` : `isAdmin={adminIds.includes(item.uid)}`, passer `canDemote={canDemote}` à `MemberCard`
    4. `onAdminAction` vers `MemberCard` : `(action) => onAdminAction?.(item.uid, action)` — closure sur `item.uid`
    5. Prop de sortie vers `circle.tsx` : `onAdminAction?: (targetUid: string, action: 'addAdmin' | 'demoteAdmin' | 'remove') => void`

- [ ] **Task 6 — Mettre à jour `app/(app)/circle.tsx`**
  - File: `app/(app)/circle.tsx`
  - Action:
    1. Interface `CircleSummary` : `adminId: string` → `adminIds: string[]`
    2. `useCircle()` : déstructurer `adminIds` au lieu de `adminId`
    3. Remplacer `handlePromoteMember` par `handleAddAdmin(targetUid)` : appelle `addAdmin(activeCircleId, targetUid)` puis met à jour `circleSummaries`
    4. Ajouter `handleDemoteAdmin(targetUid)` : `confirm` "Cet utilisateur redeviendra simple membre.", appelle `demoteAdmin(activeCircleId, targetUid)` dans un `try/catch` → en cas d'erreur, afficher via `setInitError("Impossible de rétrograder ce membre.")`. En cas de succès, mettre à jour `circleSummaries` (retirer `targetUid` de `adminIds`). Après `demoteAdmin` réussi, si `circleSummaries` est désynchronisé, le listener `onSnapshot` de `useCircle` corrige automatiquement l'état via temps réel.
    5. `handleLeaveCircle` : calculer `const isLastAdmin = isAdmin && adminIds.length === 1`. Si `isAdmin && !isLastAdmin` → partir directement sans modal (`leaveCircle` retire l'uid des `adminIds` + `members`). Si `isLastAdmin && otherMembers.length > 0` → `setShowLeaveModal(true)`. Si `isLastAdmin && otherMembers.length === 0` → `deleteCircle` (Alice est seule : le cercle est supprimé).
    6. `loadSummaries` : `adminIds: circle.adminIds ?? (circle.adminId ? [circle.adminId] : [])`
    7. `MemberList` : prop `adminId={adminId}` → `adminIds={adminIds}`
    8. `onAdminAction` : gérer les cas `'addAdmin'` → `handleAddAdmin`, `'demoteAdmin'` → `handleDemoteAdmin`, `'remove'` → `handleRemoveMember`
    9. Import : ajouter `addAdmin`, `demoteAdmin`. Retirer `promoteMember`.

- [ ] **Task 7 — Mettre à jour `components/circle/CineclubButton.tsx`**
  - File: `components/circle/CineclubButton.tsx`
  - Action:
    1. Lire `circleIds = useAuthStore(s => s.circleIds)` en plus de `activeCircleId`
    2. Ajouter états locaux : `showPicker`, `circleOptions: {id:string, name:string}[]`, `loadingPicker`
    3. Extraire `doPost(targetCircleId: string)` depuis la logique `setDoc` existante
    4. `handleSet` :
       - Si `circleIds.length <= 1` → `doPost(circleId!)` directement.
       - Sinon : si `circleOptions.length > 0` → réutiliser le cache, `setShowPicker(true)` directement (pas de fetch). Si `circleOptions` vide → `setLoadingPicker(true)`, `try { const results = await Promise.all(circleIds.map(id => getCircle(id))); setCircleOptions(results.filter(Boolean).map(c => ({ id: c!.id, name: c!.name }))); setShowPicker(true) } catch { alert(label, 'Impossible de charger vos cercles.') } finally { setLoadingPicker(false) }`
    5. Ajouter une `Modal` avec `ScrollView` : afficher `ActivityIndicator` si `loadingPicker`. Liste des cercles via `circleOptions`, chaque item `TouchableOpacity` → `doPost(option.id)` + `setShowPicker(false)`. Bouton "Annuler" en bas → `setShowPicker(false)` sans poster.
    6. Import : ajouter `Modal, ScrollView, ActivityIndicator` depuis RN. Ajouter `getCircle` depuis `@/lib/circle`.

- [ ] **Task 8 — Mettre à jour `hooks/useCircle.test.ts`**
  - File: `hooks/useCircle.test.ts`
  - Action:
    1. `makeCircleSnap` : paramètre `adminId: string` → `adminIds: string[]`, retourner `{ adminIds, members }` dans `data()`
    2. Mettre à jour tous les appels : `makeCircleSnap('uid-1', [...])` → `makeCircleSnap(['uid-1'], [...])`
    3. Tests isAdmin mis à jour pour utiliser des tableaux
    4. Ajouter test : `isAdmin true si uid dans adminIds avec plusieurs admins`
    5. Ajouter test rétrocompat : snap avec `adminId: 'uid-1'` (sans `adminIds`) → `isAdmin: true` pour uid-1
    6. Vérifier que `result.current.adminIds` est exposé (tableau)

- [ ] **Task 9 — Mettre à jour `lib/circle.test.ts`**
  - File: `lib/circle.test.ts`
  - Action:
    1. Import : remplacer `promoteMember` par `addAdmin, demoteAdmin`
    2. `createCircle` test : expect `adminIds: ['uid-1']` dans le payload (retirer `adminId`)
    3. `describe('promoteMember')` → `describe('addAdmin')` : expect `{ adminIds: { __arrayUnion: 'uid-new-admin' } }`
    4. Ajouter `describe('demoteAdmin')` avec les cas :
       - Happy path (2 admins) : mock `circle.adminIds = ['uid-admin', 'uid-co']`, appel `demoteAdmin('circle-1', 'uid-co')` → expect `updateDoc` avec `{ adminIds: { __arrayRemove: 'uid-co' } }`
       - Garde dernier admin : mock `circle.adminIds = ['uid-admin']` → expect `throw Error` (pas de `updateDoc`)
       - Auto-rétrogradation (self-demote) : mock `circle.adminIds = ['uid-admin', 'uid-self']`, appel `demoteAdmin('circle-1', 'uid-self')` → doit réussir (2 admins), expect `arrayRemove('uid-self')`
    5. `leaveCircle` tests : migrer mocks `{ adminId }` → `{ adminIds: [...] }` dans tous les `data()` existants
    6. Ajouter test `leaveCircle` multi-admin : `adminIds: ['uid-admin', 'uid-co']`, uid = 'uid-admin' → expect `updateDoc` `{ adminIds: { __arrayRemove: 'uid-admin' } }` ET `{ members: { __arrayRemove: 'uid-admin' } }` ET `circleIds arrayRemove`, et PAS d'appel à `addAdmin`
    7. Ajouter test `leaveCircle` rétrocompat : mock `{ adminId: 'uid-admin', members: ['uid-admin', 'uid-other'] }` sans `adminIds` → doit se comporter comme si `adminIds = ['uid-admin']` (successeur requis)

- [ ] **Task 10 — Mettre à jour `components/circle/CineclubButton.test.tsx`**
  - File: `components/circle/CineclubButton.test.tsx`
  - Action:
    1. Ajouter `let mockCircleIds: string[] = ['circle-1']` et l'inclure dans le mock authStore : `{ uid: 'uid-me', displayName: 'Moi', activeCircleId: mockCircleId, circleIds: mockCircleIds }`
    2. Ajouter mock `@/lib/circle` avec `mockGetCircle = jest.fn()`
    3. `describe('CineclubButton — sélecteur de cercle')` avec les cas :
       - **1 cercle** : `mockCircleIds = ['circle-1']`, clic sur "Mettre en Cinéclub" → `setDoc` appelé, `mockGetCircle` non appelé
       - **2 cercles, affichage modal** : `mockCircleIds = ['circle-1', 'circle-2']`, `mockGetCircle` retourne `{ id: 'circle-1', name: 'Famille' }` et `{ id: 'circle-2', name: 'Cinéphiles' }`, clic → `waitFor(() => expect(getByText('Famille')).toBeTruthy())`
       - **Sélection d'un cercle** : suite du cas précédent, `fireEvent.press(getByText('Cinéphiles'))` → expect `mockDoc` appelé avec `'circles', 'circle-2', 'cineclub', 'item-1'`
       - **Annulation** : modal ouverte, `fireEvent.press(getByText('Annuler'))` → `setDoc` non appelé
       - **Erreur getCircle** : `mockGetCircle.mockRejectedValueOnce(new Error('network'))`, clic → `waitFor(() => expect(mockShowAlert).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('Impossible')))`, modal non affichée
       - **Cache** : ouvrir modal, fermer (Annuler), recliquer → `mockGetCircle` appelé une seule fois au total

### Acceptance Criteria

- [ ] **AC1 — Promouvoir un membre en admin**
  Given un cercle avec un admin (Alice) et un membre (Bob),
  when Alice appuie sur "•••" → "Promouvoir admin" sur la carte de Bob,
  then Bob apparaît avec le badge "Admin" dans la liste,
  and Alice garde aussi son badge "Admin" (les deux sont admins simultanément).

- [ ] **AC2 — Rétrograder un co-admin**
  Given un cercle avec deux admins (Alice et Bob),
  when Alice appuie sur "•••" → "Rétrograder" sur la carte de Bob,
  then Bob perd le badge "Admin" et redevient simple membre,
  and Alice reste admin.

- [ ] **AC3 — Rétrograder absent si seul admin**
  Given un cercle avec un seul admin (Alice) et un membre (Bob) non-admin,
  when Alice consulte la carte de Bob,
  then l'option "Rétrograder" n'est pas visible (Bob n'est pas admin),
  and "Promouvoir admin" est l'action disponible pour Bob.

- [ ] **AC4 — Co-admin quitte librement**
  Given un cercle avec deux admins (Alice et Bob),
  when Alice appuie sur "Quitter ce cercle",
  then Alice quitte immédiatement sans modal de successeur,
  and Bob reste admin du cercle.

- [ ] **AC5a — Dernier admin doit désigner un successeur**
  Given un cercle avec un seul admin (Alice) et au moins un membre non-admin,
  when Alice appuie sur "Quitter ce cercle",
  then la modal `LeaveCircleModal` s'affiche avec la liste des autres membres,
  and Alice peut désigner un successeur ou confirmer sans choisir (le premier membre prend le relais).

- [ ] **AC5b — Dernier admin seul supprime le cercle**
  Given un cercle avec un seul admin (Alice) et aucun autre membre,
  when Alice appuie sur "Quitter ce cercle",
  then une confirmation de suppression s'affiche (comportement actuel `deleteCircle`),
  and le cercle est supprimé après confirmation.

- [ ] **AC6 — Cinéclub avec un seul cercle (comportement inchangé)**
  Given un utilisateur membre d'un seul cercle,
  when il appuie sur "Mettre en Cinéclub" depuis une fiche,
  then le `setDoc` est appelé vers ce cercle sans afficher de modal.

- [ ] **AC7 — Sélecteur de cercle avec plusieurs cercles**
  Given un utilisateur membre de deux cercles ("Famille" et "Cinéphiles"),
  when il appuie sur "Mettre en Cinéclub" depuis une fiche,
  then une modal s'affiche avec les deux cercles listés par nom,
  and après sélection de "Cinéphiles", le `setDoc` est appelé vers ce cercle.

- [ ] **AC8 — Annulation du sélecteur**
  Given la modal de sélection de cercle est ouverte,
  when l'utilisateur appuie sur "Annuler",
  then la modal se ferme sans `setDoc` appelé.

- [ ] **AC9 — Rétrocompatibilité cercles existants**
  Given un cercle Firestore avec `adminId` (sans `adminIds`),
  when un utilisateur ouvre la page cercle,
  then l'admin est correctement identifié et le badge "Admin" s'affiche.

- [ ] **AC10 — Erreur de chargement dans le sélecteur de cercle**
  Given un utilisateur membre de deux cercles,
  when il appuie sur "Mettre en Cinéclub" et que le chargement des cercles échoue (erreur réseau),
  then une alerte s'affiche ("Impossible de charger vos cercles."),
  and la modal de sélection ne s'ouvre pas,
  and aucun `setDoc` n'est appelé.

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- `getCircle` (lib/circle.ts) déjà disponible pour charger les noms dans CineclubButton
- `Modal`, `ScrollView`, `ActivityIndicator` déjà dans React Native

### Testing Strategy

- **Tests unitaires** (Tasks 8–10) : chaque fonction lib isolée, hook avec mock `onSnapshot`, composant avec mock firebase
- **Fichiers à mettre à jour** : 3 fichiers de test existants + nouveaux cas dans chacun
- **Test manuel recommandé** :
  1. Créer un cercle, inviter un membre, le promouvoir → vérifier que les deux ont le badge Admin
  2. Rétrograder un co-admin → vérifier perte du badge
  3. Quitter en tant que co-admin (pas seul admin) → vérifier départ sans modal
  4. Appartenir à 2 cercles, aller sur une fiche → vérifier modal de sélection au clic Cinéclub

### Notes

- **Risque principal (F4)** : cercles existants en production avec `adminId` sans `adminIds`. Le fallback strict `Array.isArray(data.adminIds) && data.adminIds.length > 0 ? data.adminIds : data.adminId ? [data.adminId] : []` est le seul filet — tester impérativement avec un vrai document Firestore legacy avant de merger.
- **`promoteMember` supprimé (F2)** : avant de merger, grep `promoteMember` dans tout le projet pour vérifier l'absence d'imports résiduels. Le chemin non-admin de `leaveCircle` n'appelle pas `promoteMember` — sa suppression n'affecte pas ce cas.
- **Rollback UI (F12)** : si `addAdmin` ou `demoteAdmin` réussit côté Firestore mais que la mise à jour locale de `circleSummaries` échoue, le listener `onSnapshot` de `useCircle` corrigera automatiquement l'état via temps réel. Pas de re-fetch manuel nécessaire.
- **CineclubButton cache (F11)** : les noms de cercles sont mis en cache dans `circleOptions` dès le premier chargement. Les ouvertures suivantes de la modal réutilisent le cache sans appel Firestore. Le cache est valide pour la durée de vie du composant (réinitialisé au démontage).
- **TypeScript et rétrocompat (F6)** : `adminId?: string` (optionnel) dans les interfaces `CircleData` et `Circle` permet d'accéder à `data.adminId` sans erreur TS dans le code de fallback.
