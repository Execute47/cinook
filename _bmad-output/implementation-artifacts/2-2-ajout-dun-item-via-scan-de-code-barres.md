# Story 2.2 : Ajout d'un item via scan de code-barres

Status: done

## Story

En tant qu'utilisatrice,
Je veux scanner le code-barres d'un DVD, Blu-ray ou livre avec ma caméra,
Afin que la fiche soit auto-remplie instantanément sans saisie manuelle.

## Acceptance Criteria

### AC1 — Scan et auto-remplissage

**Given** l'écran de scan (`app/scan.tsx`) ouvert sur mobile (development build requis)
**When** je pointe la caméra vers un code-barres EAN-13, EAN-8 ou UPC-A valide
**Then** le code est détecté automatiquement par `expo-camera`
**And** `useBarcodeScan.ts` appelle `getMediaByBarcode` via `lib/mediaSearch.ts`
**And** la fiche apparaît pré-remplie (titre, affiche, synopsis, année, réalisateur/auteur) en moins de 3 secondes (NFR1)

### AC2 — Confirmation et enregistrement

**Given** une fiche auto-remplie affichée
**When** je confirme l'ajout
**Then** l'item est enregistré dans Firestore `/users/{uid}/items/{itemId}` avec `addedVia: 'scan'`
**And** il apparaît immédiatement dans ma collection via le listener `useCollection`

### AC3 — Échec du scan

**Given** un code-barres non reconnu par l'API
**When** le scan échoue ou retourne `success: false`
**Then** un message explicite s'affiche ("Code non reconnu — saisie manuelle ?") avec un bouton vers `app/item/new.tsx` (FR33, NFR14)
**And** aucune donnée n'est perdue

## Tasks / Subtasks

- [x] **Task 1 — Installer expo-camera** (AC1)
  - [x] `npx expo install expo-camera`
  - [x] Ajouter permissions dans `app.json` : `"camera"` pour iOS et Android

- [x] **Task 2 — Implémenter `hooks/useBarcodeScan.ts`** (AC1, AC3)
  - [x] State : `isScanning`, `result: MediaResult | null`, `error: string | null`, `isLoading`
  - [x] `onBarcodeScanned(barcode)` → appeler `getMediaByBarcode(barcode)` via `lib/mediaSearch.ts`
  - [x] Si succès → stocker `result`, arrêter le scan
  - [x] Si échec → stocker `error`, proposer fallback saisie manuelle
  - [x] `reset()` pour recommencer un scan

- [x] **Task 3 — Implémenter `app/scan.tsx`** (AC1, AC2, AC3)
  - [x] `CameraView` de `expo-camera` plein écran
  - [x] `BarcodeOverlay` (viseur centré, amber border)
  - [x] Quand résultat disponible : afficher fiche pré-remplie (titre, affiche, synopsis)
  - [x] Bouton "Ajouter" → écrire dans Firestore avec `addedVia: 'scan'`
  - [x] Bouton "Annuler" → fermer le scanner (`router.back()`)
  - [x] En cas d'erreur : message + bouton "Saisie manuelle" → `router.push('/item/new')`
  - [x] Fermer automatiquement après confirmation (AC2)

- [x] **Task 4 — Helper Firestore `addItem` dans lib/firestore.ts** (AC2)
  - [x] `addItem(uid: string, item: Omit<MediaItem, 'id' | 'addedAt'>): Promise<string>`
  - [x] `addDoc(collection(db, 'users', uid, 'items'), { ...item, addedAt: serverTimestamp() })`
  - [x] Retourner l'id du document créé

- [x] **Task 5 — Composant `components/scan/BarcodeOverlay.tsx`** (AC1)
  - [x] Overlay avec viseur centré (rectangle amber)
  - [x] Texte "Pointez la caméra vers un code-barres"
  - [x] Animation subtile (pulse)

- [x] **Task 6 — Tests** (tous ACs)
  - [x] Test `useBarcodeScan` : barcode valide → `getMediaByBarcode` appelé, result stocké
  - [x] Test `useBarcodeScan` : réponse `success: false` → error stocké, result null
  - [x] Test `addItem` : appelle `addDoc` avec les bons paramètres
  - [x] Test `addItem` : `addedAt` est un serverTimestamp

## Dev Notes

### ⚠️ DEVELOPMENT BUILD REQUIS

`expo-camera` ne fonctionne **pas** dans Expo Go. Pour tester :
```bash
npx expo run:ios    # ou
eas build --profile development --platform ios
```

### expo-camera v15 (SDK 54) — CameraView

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()

  if (!permission?.granted) {
    return (
      <View>
        <Text>Autorisation caméra requise</Text>
        <Button onPress={requestPermission} title="Autoriser" />
      </View>
    )
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
      onBarcodeScanned={({ data }) => onBarcodeScanned(data)}
    />
  )
}
```

### Permissions app.json à ajouter

```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Cinook utilise la caméra pour scanner les codes-barres de vos DVD et livres."
  }
},
"android": {
  "permissions": ["android.permission.CAMERA"]
}
```

### Pattern addItem dans lib/firestore.ts

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MediaItem } from '@/types/media'

export const addItem = async (
  uid: string,
  item: Omit<MediaItem, 'id' | 'addedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'users', uid, 'items'), {
    ...item,
    addedAt: serverTimestamp(),
  })
  return ref.id
}
```

### useBarcodeScan — éviter les scans multiples

```typescript
const scannedRef = useRef(false)

const onBarcodeScanned = async ({ data }: { data: string }) => {
  if (scannedRef.current || isLoading) return
  scannedRef.current = true
  setIsLoading(true)
  // ... appel API
}

const reset = () => {
  scannedRef.current = false
  setResult(null)
  setError(null)
}
```

### References

- [Source: epics.md#Story 2.2]
- [Source: architecture.md#Barcode Scanning] — expo-camera, EAN-13/EAN-8/UPC-A
- [Source: architecture.md#Structure Patterns] — components/scan/
- [Source: story 2-1] — lib/functions.ts, getMediaByBarcode

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Référence `lib/functions.ts` dans la story → mis à jour vers `lib/mediaSearch.ts` (migration 2.1)

### Completion Notes List
- Installé `expo-camera` (SDK 54 compatible), ajouté permissions iOS/Android dans `app.json`
- Implémenté `hooks/useBarcodeScan.ts` : scannedRef anti-doublon, routing via `lib/mediaSearch.getMediaByBarcode`, reset()
- Implémenté `lib/firestore.ts` : `addItem(uid, item)` → addDoc Firestore `/users/{uid}/items` avec serverTimestamp
- Implémenté `components/scan/BarcodeOverlay.tsx` : viseur amber animé (pulse), texte instruction
- Implémenté `app/scan.tsx` : permission flow → CameraView + BarcodeOverlay → fiche résultat → Firestore write → error fallback saisie manuelle
- 7 tests nouveaux : 4 useBarcodeScan + 2 addItem + 1 BarcodeOverlay — 62/62 suite complète, zéro régression

### File List

- `app/scan.tsx` (stub → implémentation)
- `hooks/useBarcodeScan.ts` (nouveau)
- `hooks/useBarcodeScan.test.ts` (nouveau)
- `lib/firestore.ts` (stub → addItem)
- `lib/firestore.test.ts` (nouveau)
- `components/scan/BarcodeOverlay.tsx` (nouveau)
- `components/scan/BarcodeOverlay.test.tsx` (nouveau)
- `app.json` (ajout permissions caméra iOS/Android)
