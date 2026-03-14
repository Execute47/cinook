---
title: 'Multi-admin et sélection de cercle pour le Cinéclub'
slug: 'multi-admin-cineclub-choix-cercle'
created: '2026-03-14'
status: 'in-progress'
stepsCompleted: [1, 2]
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

- Firestore : pattern `onSnapshot` avec cleanup obligatoire (`return unsub`)
- State management : Zustand (`useAuthStore`) pour `circleIds`, `activeCircleId`, `uid`, `displayName`
- Hooks : `useCircle` lit `activeCircleId` depuis le store, expose `members`, `isAdmin`, `adminId`, `loading`, `error`
- `lib/circle.ts` : fonctions async pures (pas de state), utilisent `arrayUnion`/`arrayRemove` de Firestore
- UI admin conditionnelle : `isAdmin` contrôle les sections invitation, renommage, actions membres
- `CineclubButton` : utilise `activeCircleId` du store, `setDoc` pour poster, `deleteDoc` pour retirer
- Le label "Cinéclub" / "Coin lecture" est déjà dynamique selon `item.type` (`getLabel`)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `types/circle.ts` | Type `CircleData` avec `adminId: string` à migrer vers `adminIds: string[]` |
| `lib/circle.ts` | `createCircle`, `promoteMember` (→ `addAdmin`), `leaveCircle`, `deleteCircle` |
| `hooks/useCircle.ts` | Listener Firestore, expose `isAdmin`, `adminId` |
| `app/(app)/circle.tsx` | UI cercle, `handlePromoteMember`, `handleLeaveCircle`, `CircleSummary` |
| `components/circle/MemberList.tsx` | Reçoit `adminId: string | null` → `adminIds: string[]` |
| `components/circle/MemberCard.tsx` | Badge admin, actions admin (promote/demote) |
| `components/circle/CineclubButton.tsx` | Lecture `activeCircleId`, poster vers un cercle |
| `stores/authStore.ts` | `circleIds`, `activeCircleId` disponibles |

### Technical Decisions

- `adminIds: string[]` côté Firestore — `createCircle` initialise avec `adminIds: [uid]`
- `promoteMember` → `addAdmin` : `arrayUnion` sur `adminIds`
- Nouvelle fonction `demoteAdmin` : `arrayRemove` sur `adminIds`, lève une erreur si `adminIds.length <= 1`
- `leaveCircle` : vérifie `adminIds.includes(uid) && adminIds.length === 1` pour exiger un successeur ; si `adminIds.length > 1`, départ direct sans successeur
- `useCircle` : `adminId: string | null` → `adminIds: string[]`, `isAdmin = adminIds.includes(uid)`
- Rétrocompatibilité : dans `useCircle`, si `data.adminIds` est absent → utiliser `[data.adminId]` comme fallback
- `MemberList`/`MemberCard` : prop `adminId: string | null` → `adminIds: string[]`, badge admin si `adminIds.includes(member.uid)`
- `MemberCard` actions contextuelles : si la cible est dans `adminIds` → action "Rétrograder" ; sinon → action "Promouvoir en admin"
- `circle.tsx` `CircleSummary` : `adminId: string` → `adminIds: string[]`
- `CineclubButton` : si `circleIds.length === 1` → poster vers `activeCircleId` (comportement actuel) ; si `circleIds.length > 1` → ouvrir une `Modal` avec la liste des cercles (noms chargés depuis Firestore), l'utilisateur choisit, puis poster

## Implementation Plan

### Tasks

*(À compléter en Step 2)*

### Acceptance Criteria

*(À compléter en Step 2)*

## Additional Context

### Dependencies

- Aucune dépendance externe nouvelle
- `circleIds` déjà dans `authStore` — suffisant pour le sélecteur de cercle

### Testing Strategy

*(À compléter en Step 2)*

### Notes

- La rétrogradation du dernier admin est bloquée côté `lib` ET côté UI (bouton absent si la cible est le seul admin)
- L'action dans `MemberCard` est contextuelle selon le rôle actuel de la cible (admin ou non)
- `CineclubButton` : les noms de cercles pour la modal peuvent être chargés via `getCircle()` existant dans `lib/circle.ts`
