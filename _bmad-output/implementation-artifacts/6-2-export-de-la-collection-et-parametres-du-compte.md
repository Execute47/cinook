# Story 6.2 : Export de la collection et paramètres du compte

Status: review

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

- [x] **Task 1 — `lib/export.ts`** (AC1, AC2)
  - [x] `exportCollection(items, format)` → écrit fichier temporaire + `Sharing.shareAsync`
  - [x] CSV : 9 colonnes (titre, type, statut, note, tier, commentaire, ajouteLe, pretA, datePret), guillemets échappés
  - [x] JSON : `JSON.stringify(items, null, 2)`
  - [x] `expo-sharing` et `expo-file-system` installés

- [x] **Task 2 — `app/(app)/settings.tsx`** (AC1, AC3)
  - [x] Section "Export" : "Exporter en CSV" + "Exporter en JSON", loading via `uiStore.loading.export`
  - [x] Section "Compte" : "Se déconnecter" (existait déjà)
  - [x] Section "Zone de danger" : bouton placeholder (AC4 déférée à Story 6.3)

- [x] **Task 3 — Déconnexion** (AC3) — déjà implémentée dans settings.tsx existant ✅

- [x] **Task 4 — N/A** (reportée à Story 6.3)

- [x] **Task 5 — Navigation** (AC1) — onglet "Paramètres" déjà présent dans `_layout.tsx` ✅

- [x] **Task 6 — Tests** (AC1, AC2, AC3)
  - [x] `exportCollection` CSV : en-têtes, données item, échappement guillemets, champs optionnels vides
  - [x] `exportCollection` JSON : JSON valide, tous les items, extension .json
  - [x] Settings : "Exporter en CSV" → `exportCollection(items, 'csv')`
  - [x] Settings : "Exporter en JSON" → `exportCollection(items, 'json')`
  - [x] Settings : déconnexion → `signOut` + `reset` + redirect

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
claude-sonnet-4-6

### Debug Log References
- Dev Notes référençaient `item.mediaType` — corrigé en `item.type` (champ réel de MediaItem).
- AC3 et Task 5 déjà implémentés dans le code existant — non re-développés.
- AC4 (suppression compte) intentionnellement déférée à Story 6.3, bouton placeholder ajouté.

### Completion Notes List
- `lib/export.ts` : stub → implémentation complète. `itemsToCsv` avec échappement CSV correct. `exportCollection` async via FileSystem + Sharing.
- `app/(app)/settings.tsx` : section Export avec 2 boutons + loading + toast d'erreur. Section danger avec placeholder.
- 11 nouveaux tests (9 lib/export + 2 settings export), 266 tests passent au total.

### File List

- `lib/export.ts` (modifié — stub → implémentation)
- `lib/export.test.ts` (nouveau — 9 tests)
- `app/(app)/settings.tsx` (modifié — section Export + Zone de danger)
- `app/(app)/settings.test.tsx` (modifié — 2 tests export)
- `package.json` (modifié — expo-sharing, expo-file-system)
- `package-lock.json` (modifié)
