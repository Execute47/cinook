# Story 4.7 : Cinéclub — confirmation et retrait

Status: ready-for-review

## Story

En tant qu'utilisatrice,
Je veux être confirmée lorsqu'un item est mis en Cinéclub (ou Coin lecture pour les livres), et pouvoir retirer l'item mis en avant,
Afin d'avoir un retour visuel clair et de garder le contrôle sur ce qui est partagé avec le cercle.

## Acceptance Criteria

### AC1 — Label adapté selon le type de média

**Given** l'item est un film ou une série
**When** j'interagis avec le bouton ou la bannière
**Then** le label est "Cinéclub" partout (bouton, bannière, alert)

**Given** l'item est un livre
**When** j'interagis avec le bouton ou la bannière
**Then** le label est "Coin lecture" partout (bouton, bannière, alert)

### AC2 — Alerte de confirmation après mise en avant

**Given** j'appuie sur "Mettre en Cinéclub" ou "Mettre en Coin lecture"
**When** le `setDoc` Firestore réussit
**Then** une `Alert.alert` s'affiche :
- Titre : "Cinéclub" (ou "Coin lecture")
- Message : "«&nbsp;{titre}&nbsp;» a été mis en avant pour votre cercle."
- Bouton : "OK"

### AC3 — Bouton toggle sur la fiche item

**Given** la fiche d'un item (`app/(app)/item/[id].tsx`)
**When** l'item courant est déjà le Cinéclub/Coin lecture actif (`cineclub?.itemId === item.id`)
**Then** le bouton affiche "Retirer du Cinéclub" (ou "Retirer du Coin lecture") — style neutre (pas amber)
**And** appuyer dessus supprime le document Firestore et met à jour la bannière en temps réel

**When** l'item n'est pas le Cinéclub actif
**Then** le bouton affiche "⭐ Mettre en Cinéclub" (comportement actuel + confirmation AC2)

### AC4 — Bouton retrait depuis la bannière d'accueil

**Given** la bannière Cinéclub/Coin lecture sur l'écran d'accueil
**When** un membre la consulte
**Then** un bouton "Retirer" est visible (discret, style secondaire)
**And** appuyer dessus supprime le document `/circles/{circleId}/cineclub/current`
**And** la bannière disparaît immédiatement (le listener temps réel la masque)

### AC5 — Stockage du type de média dans le document Cinéclub

**Given** un item est mis en avant
**When** le `setDoc` est exécuté
**Then** le champ `itemType: MediaType` est stocké dans le document (en plus des champs existants)
**And** `useCineclub` expose ce champ pour que `CineclubBanner` puisse afficher le bon label

## Tasks / Subtasks

- [ ] **Task 1 — Mise à jour `hooks/useCineclub.ts`** (AC1, AC5)
  - [ ] Ajouter `itemType: MediaType` dans l'interface `Cineclub`
  - [ ] Lire `d.itemType` dans le listener onSnapshot (avec fallback `'film'` pour les documents existants sans ce champ)

- [ ] **Task 2 — Mise à jour `components/circle/CineclubButton.tsx`** (AC1, AC2, AC3)
  - [ ] Ajouter prop `currentCineclubItemId?: string` pour savoir si cet item est actif
  - [ ] Helper `getLabel(type: MediaType): string` → `type === 'livre' ? 'Coin lecture' : 'Cinéclub'`
  - [ ] Ajouter `itemType` dans le payload `setDoc` (AC5)
  - [ ] Après `setDoc` réussi → `Alert.alert(label, '«\u00A0${item.title}\u00A0» a été mis en avant pour votre cercle.')`
  - [ ] Si `currentCineclubItemId === item.id` → afficher "Retirer du {label}" + handler `handleRemove`
  - [ ] `handleRemove` → `deleteDoc(doc(db, 'circles', circleId, 'cineclub', 'current'))`
  - [ ] Style bouton retrait : `border-[#3D3535]` + `text-[#6B5E5E]` (neutre, pas amber)

- [ ] **Task 3 — Mise à jour `app/(app)/item/[id].tsx`** (AC3)
  - [ ] Utiliser `useCineclub()` pour obtenir `cineclub?.itemId`
  - [ ] Passer `currentCineclubItemId={cineclub?.itemId}` à `CineclubButton`

- [ ] **Task 4 — Mise à jour `components/circle/CineclubBanner.tsx`** (AC1, AC4)
  - [ ] Ajouter prop `onRemove: () => void`
  - [ ] Adapter le label du titre "⭐ Cinéclub" → "⭐ {label}" selon `cineclub.itemType`
  - [ ] Adapter "Mis en avant" → "Mis en avant" (film/série) ou "Mis en avant" (livre) — le label de la section suffit
  - [ ] Ajouter bouton "Retirer" en bas à droite de la bannière (style : `text-[#6B5E5E] text-xs`)

- [ ] **Task 5 — Mise à jour `app/(app)/index.tsx`** (AC4)
  - [ ] Passer `onRemove` à `CineclubBanner` :
    ```tsx
    onRemove={async () => {
      if (!circleId) return
      await deleteDoc(doc(db, 'circles', circleId, 'cineclub', 'current'))
    }}
    ```

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] `CineclubButton` : `item.type === 'livre'` → label "Coin lecture"
  - [ ] `CineclubButton` : après `setDoc` → `Alert.alert` appelé avec titre et message corrects
  - [ ] `CineclubButton` : `currentCineclubItemId === item.id` → affiche "Retirer du Cinéclub"
  - [ ] `CineclubButton` : clic "Retirer" → `deleteDoc` appelé sur le bon chemin
  - [ ] `CineclubButton` : payload `setDoc` inclut `itemType`
  - [ ] `useCineclub` : document sans `itemType` → fallback `'film'`
  - [ ] `CineclubBanner` : `itemType === 'livre'` → titre "⭐ Coin lecture"

## Dev Notes

### Helper label (à définir dans CineclubButton ou un fichier utilitaire)

```typescript
import type { MediaType } from '@/types/media'

export const getCineclubLabel = (type: MediaType): string =>
  type === 'livre' ? 'Coin lecture' : 'Cinéclub'
```

### setDoc mis à jour (avec itemType)

```typescript
await setDoc(doc(db, 'circles', circleId, 'cineclub', 'current'), {
  itemId: item.id,
  itemTitle: item.title,
  itemPoster: item.poster ?? null,
  itemType: item.type,           // ← nouveau champ
  postedBy: displayName ?? uid,
  postedAt: serverTimestamp(),
})
```

### deleteDoc pour le retrait

```typescript
import { deleteDoc, doc } from 'firebase/firestore'
await deleteDoc(doc(db, 'circles', circleId, 'cineclub', 'current'))
// Le listener onSnapshot de useCineclub détecte snap.exists() === false → setCineclub(null)
// La bannière disparaît automatiquement
```

### Interface Cineclub mise à jour

```typescript
// hooks/useCineclub.ts
export interface Cineclub {
  itemId: string
  itemTitle: string
  itemPoster: string | null
  itemType: MediaType          // ← nouveau
  postedBy: string
  postedAt: Timestamp | null
}
// Lecture : itemType: d.itemType ?? 'film'  (fallback documents existants)
```

### References

- [Source: components/circle/CineclubButton.tsx] — setDoc, path cineclub/current
- [Source: components/circle/CineclubBanner.tsx] — structure Props, onAddToWishlist pattern
- [Source: hooks/useCineclub.ts] — interface Cineclub, listener onSnapshot
- [Source: app/(app)/index.tsx] — intégration CineclubBanner
- [Source: app/(app)/item/[id].tsx] — intégration CineclubButton

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `hooks/useCineclub.ts` (modification — itemType)
- `components/circle/CineclubButton.tsx` (modification — toggle, alert, label)
- `components/circle/CineclubBanner.tsx` (modification — retrait, label)
- `app/(app)/item/[id].tsx` (modification — passer currentCineclubItemId)
- `app/(app)/index.tsx` (modification — passer onRemove)
