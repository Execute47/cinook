# Story 4.2 : Gestion du cercle et administration

Status: ready-for-dev

## Story

En tant qu'administratrice,
Je veux consulter la liste des membres de mon cercle,
Afin de savoir qui a rejoint Cinook et gérer mon cercle privé.

## Acceptance Criteria

### AC1 — Liste des membres

**Given** l'écran cercle (`app/(app)/circle.tsx`)
**When** je l'ouvre
**Then** la liste de tous les membres s'affiche via `useCircle` avec leur nom et email (FR5)
**And** mon statut d'administratrice est visible

### AC2 — Accès à la collection d'un membre

**Given** la liste des membres affichée
**When** je consulte un membre
**Then** je peux accéder à sa collection (FR14 — voir Story 4.3)

## Tasks / Subtasks

- [ ] **Task 1 — Implémenter `hooks/useCircle.ts`** (AC1)
  - [ ] Listener `onSnapshot` sur `/circles/{circleId}`
  - [ ] Charger les profils de chaque membre depuis `/users/{uid}` pour avoir displayName et email
  - [ ] State : `circle: CircleData | null`, `members: Member[]`, `isAdmin`, `loading`, `error`
  - [ ] Cleanup `unsubscribe` (OBLIGATOIRE)

- [ ] **Task 2 — Compléter `app/(app)/circle.tsx`** (AC1, AC2)
  - [ ] Afficher `MemberList` avec les membres du cercle
  - [ ] Badge "Admin" pour l'administratrice
  - [ ] Section "Invitation" (Story 4.1) : bouton générer + lien si admin
  - [ ] Tap sur un membre → naviguer vers sa collection (Story 4.3)

- [ ] **Task 3 — Composants `components/circle/MemberList.tsx` et `MemberCard.tsx`** (AC1)
  - [ ] MemberCard : avatar initiales, displayName, email, badge admin si applicable
  - [ ] MemberList : FlatList de MemberCard

- [ ] **Task 4 — Tests** (tous ACs)
  - [ ] Test `useCircle` : listener sur /circles/{circleId} avec cleanup
  - [ ] Test : isAdmin correct selon adminId vs uid connecté

## Dev Notes

### useCircle pattern

```typescript
export function useCircle() {
  const circleId = useAuthStore((s) => s.circleId)
  const uid = useAuthStore((s) => s.uid)
  // ...
  useEffect(() => {
    if (!circleId) return
    const unsub = onSnapshot(doc(db, 'circles', circleId), async (snap) => {
      const data = snap.data() as CircleData
      // Charger les profils membres
      const memberProfiles = await Promise.all(
        data.members.map(async (memberId) => {
          const userSnap = await getDoc(doc(db, 'users', memberId))
          return { uid: memberId, ...userSnap.data() } as Member
        })
      )
      setMembers(memberProfiles)
      setIsAdmin(data.adminId === uid)
    })
    return unsub
  }, [circleId, uid])
}
```

### References

- [Source: epics.md#Story 4.2]
- [Source: architecture.md#Data Architecture] — /circles/{circleId}
- [Source: architecture.md#Communication Patterns] — hooks listeners avec cleanup

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `hooks/useCircle.ts` (nouveau)
- `hooks/useCircle.test.ts` (nouveau)
- `app/(app)/circle.tsx` (mise à jour)
- `components/circle/MemberList.tsx` (nouveau)
- `components/circle/MemberCard.tsx` (nouveau)
