# Story 1.3 : Connexion, déconnexion et navigation protégée

Status: ready-for-dev

## Story

En tant qu'utilisatrice,
Je veux me connecter et me déconnecter de mon compte,
Afin que mes données soient accessibles uniquement à moi et que l'app soit sécurisée.

## Acceptance Criteria

### AC1 — Connexion réussie

**Given** l'écran de connexion (`app/(auth)/login.tsx`)
**When** je saisis mon email et mot de passe corrects et je valide
**Then** je suis connectée via Firebase Auth
**And** je suis redirigée vers l'écran principal `(app)/index`
**And** `authStore` contient mon `uid`, `email`, et `circleId` (null si pas encore dans un cercle)

### AC2 — Identifiants incorrects

**Given** des identifiants incorrects
**When** je tente de me connecter
**Then** un message d'erreur explicite s'affiche ("Email ou mot de passe incorrect")
**And** je reste sur l'écran de connexion

### AC3 — Déconnexion

**Given** une utilisatrice connectée
**When** elle sélectionne "Se déconnecter" dans les paramètres
**Then** Firebase Auth déconnecte la session
**And** elle est redirigée vers `app/(auth)/login.tsx`
**And** `authStore` est réinitialisé

### AC4 — Navigation protégée (auth guard)

**Given** une utilisatrice non connectée
**When** elle tente d'accéder à n'importe quelle route `(app)/`
**Then** elle est automatiquement redirigée vers `app/(auth)/login.tsx` (auth guard dans `app/_layout.tsx`)

## Tasks / Subtasks

- [ ] **Task 1 — Implémenter login.tsx** (AC1, AC2)
  - [ ] Formulaire avec champs `email` et `password`
  - [ ] Validation locale : email non vide, password non vide
  - [ ] Appeler `signInWithEmailAndPassword(auth, email, password)`
  - [ ] Gérer `auth/invalid-credential` ou `auth/user-not-found` → "Email ou mot de passe incorrect"
  - [ ] En cas de succès, charger le profil Firestore `/users/{uid}` pour récupérer `circleId`
  - [ ] Appeler `authStore.setUser()` puis `authStore.setCircle()` si `circleId` présent
  - [ ] `router.replace('/(app)/')` après connexion
  - [ ] Lien "Pas encore de compte ? Créer un compte" → `router.push('/(auth)/register')`
  - [ ] Styler Dark Cinéma (même pattern que register.tsx)

- [ ] **Task 2 — Auth guard dans app/_layout.tsx** (AC4)
  - [ ] Utiliser `onAuthStateChanged(auth, callback)` dans un `useEffect`
  - [ ] Si `user === null` → `router.replace('/(auth)/login')`
  - [ ] Si `user !== null` → charger `/users/{uid}` et hydrater `authStore`
  - [ ] Afficher un écran de chargement pendant la vérification initiale (éviter le flash)

- [ ] **Task 3 — Déconnexion dans settings.tsx** (AC3)
  - [ ] Créer `app/(app)/settings.tsx` avec bouton "Se déconnecter"
  - [ ] Appeler `signOut(auth)`
  - [ ] `authStore.reset()`
  - [ ] `router.replace('/(auth)/login')`
  - [ ] Ajouter l'onglet Settings dans `app/(app)/_layout.tsx`

- [ ] **Task 4 — Tests** (tous ACs)
  - [ ] Test : connexion réussie → `setUser` et `setCircle` appelés
  - [ ] Test : mauvais identifiants → message d'erreur correct
  - [ ] Test : auth guard redirige si non authentifiée
  - [ ] Test : déconnexion → `authStore.reset()` appelé

## Dev Notes

### Imports Firebase v10

```typescript
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
```

### Hydratation authStore au login

```typescript
const { user } = await signInWithEmailAndPassword(auth, email, password)
const userDoc = await getDoc(doc(db, 'users', user.uid))
const data = userDoc.data()
authStore.setUser(user.uid, user.email!, data?.displayName ?? null)
if (data?.circleId) {
  authStore.setCircle(data.circleId, false) // isAdmin résolu en Story 4.x
}
```

### Auth guard pattern dans _layout.tsx

```typescript
const [isReady, setIsReady] = useState(false)
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.replace('/(auth)/login')
    } else {
      // Hydrater authStore depuis Firestore
      setIsReady(true)
    }
  })
  return unsub // cleanup OBLIGATOIRE
}, [])

if (!isReady) return <LoadingSpinner />
```

### Codes erreur Firebase Auth v10

- `auth/invalid-credential` — mauvais email/password (Firebase v10+, remplace user-not-found + wrong-password)
- `auth/too-many-requests` — compte temporairement bloqué

### Theme Dark Cinéma

Même classes que `register.tsx` — voir Story 1.2 Dev Notes.

### References

- [Source: epics.md#Story 1.3]
- [Source: architecture.md#Authentication & Security] — auth guard `app/_layout.tsx`
- [Source: architecture.md#Frontend Architecture] — `authStore` source de vérité
- [Source: story 1-2] — patterns Firebase v10, NativeWind, mock jest
