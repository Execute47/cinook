# Story 6.2 : Export de la collection et paramètres du compte

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux exporter ma collection complète et gérer mon compte,
Afin d'avoir la souveraineté sur mes données et de pouvoir me déconnecter ou supprimer mon compte.

## Acceptance Criteria

### AC1 — Export de la collection (CSV/JSON)

**Given** l'écran Paramètres (`app/(app)/settings.tsx`)
**When** je demande l'export de ma collection
**Then** `lib/export.ts` génère un fichier CSV ou JSON contenant tous mes items avec leurs métadonnées, statuts et notes (FR6)
**And** le fichier est partageable via le système natif de partage iOS/Android/Web

### AC2 — Contenu de l'export

**Given** le fichier d'export généré
**When** je l'ouvre
**Then** tous mes items sont présents avec : titre, type, statut, note, tier, commentaire, dates
**And** le format est lisible dans un tableur (CSV) ou un éditeur de texte (JSON)

### AC3 — Déconnexion

**Given** l'écran Paramètres
**When** je sélectionne "Se déconnecter"
**Then** Firebase Auth termine la session et je suis redirigée vers l'écran de connexion (lié à Story 1.3)

### AC4 — Suppression du compte (RGPD)

> ⚠️ **Reporté à Story 6.3** — Cette AC est intentionnellement laissée en suspens dans cette story. Story 6.3 implémente la suppression complète (données seules + compte complet, avec gestion du cercle et succession admin). Ne pas implémenter l'AC4 ici pour éviter une collision.

## Tasks / Subtasks

- [ ] **Task 1 — Créer `lib/export.ts`** (AC1, AC2)
  - [ ] `exportCollection(items: MediaItem[], format: 'csv' | 'json'): string`
  - [ ] CSV : colonnes titre, type, statut, note, tier, commentaire, addedAt, loanTo, loanDate
  - [ ] JSON : tableau d'objets MediaItem sérialisé
  - [ ] Utiliser `expo-sharing` pour partager le fichier généré
  - [ ] Utiliser `expo-file-system` pour écrire le fichier temporaire

- [ ] **Task 2 — Créer `app/(app)/settings.tsx`** (AC1, AC3, AC4)
  - [ ] Section "Export" : bouton "Exporter en CSV" + bouton "Exporter en JSON"
  - [ ] Section "Compte" : bouton "Se déconnecter"
  - [ ] Section "Danger" : bouton "Supprimer mon compte" (rouge, confirmation modal)

- [ ] **Task 3 — Déconnexion** (AC3)
  - [ ] `signOut(auth)` → `authStore.reset()` → navigation vers `/(auth)/login`
  - [ ] Réutiliser le pattern de Story 1.3

- [ ] **Task 4 — Suppression du compte** (AC4 — reportée à Story 6.3, ne pas implémenter ici)

- [ ] **Task 5 — Ajouter lien Settings dans navigation** (AC1)
  - [ ] Icône paramètres dans le header ou un onglet dédié dans `app/(app)/_layout.tsx`

- [ ] **Task 6 — Tests** (tous ACs)
  - [ ] Test `exportCollection` CSV : colonnes correctes, tous les items présents
  - [ ] Test `exportCollection` JSON : structure valide
  - [ ] Test déconnexion : `signOut` + `authStore.reset()` appelés
  - [ ] Test suppression : confirmation demandée, deleteDoc + deleteUser appelés

## Dev Notes

### Export CSV

```typescript
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export async function exportCollection(items: MediaItem[], format: 'csv' | 'json') {
  const content = format === 'csv'
    ? itemsToCsv(items)
    : JSON.stringify(items, null, 2)

  const filename = `cinook-export-${Date.now()}.${format}`
  const uri = FileSystem.cacheDirectory + filename
  await FileSystem.writeAsStringAsync(uri, content)
  await Sharing.shareAsync(uri)
}

function itemsToCsv(items: MediaItem[]): string {
  const headers = ['titre', 'type', 'statut', 'note', 'tier', 'commentaire', 'ajouteLe', 'pretA', 'datePret']
  const rows = items.map(item => [
    item.title, item.mediaType, item.status,
    item.rating ?? '', item.tier ?? '', item.comment ?? '',
    item.addedAt?.toDate?.()?.toISOString() ?? '',
    item.loanTo ?? '', item.loanDate ?? ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...rows].join('\n')
}
```

### Suppression du compte — gestion requires-recent-login

```typescript
import { deleteUser } from 'firebase/auth'
try {
  await deleteUser(auth.currentUser!)
} catch (e: any) {
  if (e.code === 'auth/requires-recent-login') {
    addToast('Reconnectez-vous pour supprimer votre compte', 'error')
    // Rediriger vers login
  }
}
```

### Ajout uiStore.loading.export

L'export utilise `uiStore.loading.export` (déjà défini en Story 1.1) pour bloquer le bouton pendant la génération.

### References

- [Source: epics.md#Story 6.2]
- [Source: architecture.md#Data Architecture] — /users/{uid}
- [Source: story 1-3] — signOut pattern
- [Source: story 2-5] — items Firestore

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List

- `lib/export.ts` (nouveau)
- `lib/export.test.ts` (nouveau)
- `app/(app)/settings.tsx` (nouveau)
- `app/(app)/_layout.tsx` (lien Settings)
