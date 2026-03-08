# Story 1.2 : Création de compte utilisateur

Status: review

## Story

En tant que visiteur,
Je veux créer un compte avec mon email et un mot de passe,
Afin d'accéder à Cinook et commencer à gérer ma collection.

## Acceptance Criteria

### AC1 — Création de compte réussie

**Given** l'écran de création de compte (`app/(auth)/register.tsx`)
**When** je saisis un email valide et un mot de passe (minimum 6 caractères) et je valide
**Then** un compte Firebase Auth est créé
**And** un document `/users/{uid}` est créé dans Firestore avec `displayName` et `email`
**And** je suis redirigée automatiquement vers l'écran principal `(app)/`

### AC2 — Email déjà utilisé

**Given** un email déjà utilisé
**When** je tente de créer un compte avec cet email
**Then** un message d'erreur explicite s'affiche ("Ce compte existe déjà")
**And** aucun doublon n'est créé dans Firebase Auth

### AC3 — Validation du formulaire

**Given** un formulaire incomplet ou invalide
**When** je tente de valider
**Then** les erreurs de validation s'affichent clairement sur les champs concernés
**And** aucune requête Firebase n'est envoyée

## Tasks / Subtasks

- [x] **Task 1 — Implémenter l'écran register.tsx** (AC1, AC3)
  - [x] Créer le formulaire avec 3 champs : `displayName` (optionnel), `email` (requis), `password` (requis, min 6 car.)
  - [x] Ajouter la validation locale avant tout appel Firebase
  - [x] Afficher les erreurs de validation sous chaque champ concerné
  - [x] Styler avec NativeWind Dark Cinéma : `bg-[#0E0B0B]`, accents `amber-400`

- [x] **Task 2 — Intégrer Firebase Auth** (AC1, AC2)
  - [x] Appeler `createUserWithEmailAndPassword(auth, email, password)`
  - [x] En cas de succès, appeler `updateProfile(user, { displayName })` si displayName fourni
  - [x] Gérer l'erreur `auth/email-already-in-use` → message "Ce compte existe déjà"
  - [x] Gérer les autres erreurs Firebase → toast générique via `useUIStore`

- [x] **Task 3 — Créer le document Firestore utilisateur** (AC1)
  - [x] Après création Auth réussie, appeler `setDoc(doc(db, 'users', user.uid), { displayName, email, circleId: null, createdAt: serverTimestamp() })`
  - [x] En cas d'échec Firestore, logger l'erreur sans bloquer la navigation (le profil peut être réparé)

- [x] **Task 4 — Mettre à jour authStore et naviguer** (AC1)
  - [x] Appeler `useAuthStore.getState().setUser(uid, email, displayName)` après création
  - [x] Naviguer vers `/(app)/` via `router.replace('/(app)/')`

- [x] **Task 5 — Lien vers login** (UX)
  - [x] Ajouter un lien "Déjà un compte ? Se connecter" → `router.push('/(auth)/login')`

- [x] **Task 6 — Tests** (tous ACs)
  - [x] Test : validation email invalide → erreur affichée, pas d'appel Firebase
  - [x] Test : mot de passe < 6 caractères → erreur affichée
  - [x] Test : création réussie → `setUser` appelé avec les bons arguments
  - [x] Test : email déjà utilisé → message d'erreur correct affiché
  - [x] Test : erreur Firestore → navigation quand même (non bloquant)

## Dev Notes

### Contexte issu de Story 1.1

- **Expo SDK 54**, Firebase JS SDK **v10.5.2**
- `lib/firebase.ts` exporte `db` (Firestore) et `auth` (Auth) — toujours importer depuis là
- `stores/authStore.ts` — `useAuthStore` avec `setUser(uid, email, displayName)`
- `app/(auth)/register.tsx` existe déjà comme stub — **remplacer** son contenu
- Pattern NativeWind en place : `className="bg-[#0E0B0B]"`, accents `text-amber-400`
- tsconfig paths : `@/*` → racine projet

### Imports Firebase corrects (v10)

```typescript
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
```

### Structure du document Firestore `/users/{uid}`

```typescript
{
  displayName: string | null,
  email: string,
  circleId: null,           // null jusqu'à rejoindre un cercle (Story 4.1)
  createdAt: Timestamp,     // serverTimestamp() — jamais string ISO
}
```

### Gestion des erreurs Firebase Auth (v10)

```typescript
import { FirebaseError } from 'firebase/app'

try {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  // ...
} catch (error) {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/email-already-in-use') {
      setEmailError('Ce compte existe déjà')
    } else {
      // Toast générique
      useUIStore.getState().addToast('Une erreur est survenue', 'error')
      console.error(error)
    }
  }
}
```

### Navigation Expo Router

```typescript
import { router } from 'expo-router'

router.replace('/(app)/')   // Après création réussie — replace empêche le retour en arrière
router.push('/(auth)/login') // Lien "déjà un compte"
```

### Pattern état local formulaire

```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [displayName, setDisplayName] = useState('')
const [emailError, setEmailError] = useState<string | null>(null)
const [passwordError, setPasswordError] = useState<string | null>(null)
const [isLoading, setIsLoading] = useState(false)
```

### Validation locale (avant appel Firebase)

```typescript
const validate = (): boolean => {
  let valid = true
  if (!email.includes('@')) {
    setEmailError('Email invalide')
    valid = false
  }
  if (password.length < 6) {
    setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
    valid = false
  }
  return valid
}
```

### Theme Dark Cinéma — classes NativeWind

```typescript
// Container principal
className="flex-1 bg-[#0E0B0B] px-6 justify-center"

// Titre
className="text-amber-400 text-2xl font-bold mb-8 text-center"

// Input
className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-1"

// Erreur sous champ
className="text-red-400 text-sm mb-3"

// Bouton principal
className="bg-amber-400 rounded-lg py-3 items-center mt-4"

// Texte bouton
className="text-[#0E0B0B] font-bold text-base"
```

### Stratégie de test (Firebase mocké)

```typescript
// jest.mock dans le test file
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  getAuth: jest.fn(),
}))
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  getFirestore: jest.fn(),
}))
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))
```

### Anti-patterns INTERDITS

```typescript
// ❌ Importer firebase directement
import { getAuth } from 'firebase/auth'  // INTERDIT dans composants

// ❌ Stocker une date ISO dans Firestore
createdAt: new Date().toISOString()  // INTERDIT — utiliser serverTimestamp()

// ❌ Catch vide
catch (e) {}  // INTERDIT — toujours console.error(e) minimum

// ❌ Mutation directe Zustand
useAuthStore.setState({ uid: '...' })  // Utiliser les actions setUser()
```

### Project Structure Notes

- Seul `app/(auth)/register.tsx` est modifié (stub → implémentation complète)
- Pas de nouveau composant requis — formulaire inline dans la route
- Le test est co-localisé : `app/(auth)/register.test.tsx`

### Learnings pour les stories suivantes

- `transformIgnorePatterns` étendu dans `package.json` pour inclure `firebase|@firebase` — nécessaire pour tous les composants qui importent Firebase directement
- `jest.requireActual('firebase/app')` fonctionne pour obtenir `FirebaseError` réel dans les tests
- Firebase ESM fonctionne après transformation Babel via jest-expo

### References

- [Source: epics.md#Story 1.2] — ACs complets
- [Source: architecture.md#Authentication & Security] — Firebase Auth email/password
- [Source: architecture.md#Data Architecture] — Structure `/users/{uid}`
- [Source: architecture.md#Communication Patterns] — Zustand `setUser`
- [Source: architecture.md#Format Patterns] — `serverTimestamp()` pour les dates
- [Source: architecture.md#Enforcement Guidelines] — Anti-patterns interdits
- [Source: story 1-1] — Expo SDK 54, Firebase v10.5.2, `lib/firebase.ts`, NativeWind

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Firebase ESM → SyntaxError : résolu en ajoutant `firebase|@firebase` dans `transformIgnorePatterns` de `package.json`

### Completion Notes List

- `register.tsx` : formulaire complet avec validation locale, Firebase Auth, Firestore, authStore, navigation
- Firestore non bloquant : erreur loggée mais navigation effectuée quand même
- 5 tests couvrent tous les ACs : validation email, validation password, création réussie, email existant, Firestore down
- Suite complète : 23/23 tests passent (18 stores + 5 register)

### File List

- `app/(auth)/register.tsx` (stub → implémentation complète)
- `app/(auth)/register.test.tsx` (nouveau — 5 tests)
- `package.json` (jest.transformIgnorePatterns étendu pour Firebase ESM)
- `metro.config.js` (blockList ajouté pour exclure les fichiers *.test.* du bundler Metro)
