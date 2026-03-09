# Story 1.4 : Connexion via Google (Sign In with Google)

Status: done

<!-- Story créée par le SM pour faciliter les tests — s'intègre à l'Epic 1 Authentification existant -->

## Story

En tant qu'utilisatrice de Cinook,
je veux pouvoir me connecter via mon compte Google en un seul tap,
afin de m'authentifier rapidement sans avoir à saisir un email/mot de passe, notamment pour mes sessions de test.

## Acceptance Criteria

1. Un bouton "Continuer avec Google" est visible sur l'écran de connexion (`login.tsx`), sous le formulaire email/mot de passe.
2. Tapper le bouton ouvre le sélecteur de compte Google natif (Google Sign-In flow).
3. Après sélection du compte, l'utilisateur est authentifié dans Firebase Auth et redirigé vers `/(app)/`.
4. Si c'est la première connexion Google, un document `/users/{uid}` est créé dans Firestore (même structure que l'email/password).
5. Si le compte Google correspond à un email déjà utilisé avec email/password, Firebase fusionne ou gère l'erreur `auth/account-exists-with-different-credential`.
6. L'état Zustand `authStore` est hydraté correctement (`uid`, `email`, `displayName`, `circleId`).
7. En cas d'annulation par l'utilisateur (fermeture du sélecteur), aucune erreur n'est affichée — retour silencieux à l'écran login.
8. En cas d'erreur réseau ou Firebase, un toast d'erreur générique est affiché via `useUIStore`.
9. Le bouton Google est aussi visible sur l'écran d'inscription (`register.tsx`) en alternative.
10. Le style du bouton respecte le thème cinéma sombre (fond `#1C1717`, texte blanc, icône Google officielle).

## Tasks / Subtasks

- [x] **Task 1 — Configuration native Google Sign-In** (AC: 2, 3)
  - [x] Installer `@react-native-google-signin/google-signin` v14+ via `npx expo install`
  - [x] Ajouter le plugin dans `app.json` → `plugins: ["@react-native-google-signin/google-signin"]`
  - [x] Dans Firebase Console → Authentication → Sign-in method → activer Google
  - [x] Récupérer le `webClientId` depuis Firebase Console (OAuth 2.0 Client ID de type Web)
  - [x] Pour Android : ajouter le SHA-1 du keystore dans Firebase Console (debug + release)
  - [x] Pour iOS : vérifier que `GoogleService-Info.plist` est bien configuré via EAS Build
  - [x] Appeler `GoogleSignin.configure({ webClientId: '...' })` dans `lib/firebase.ts` ou au démarrage de l'app

- [x] **Task 2 — Service d'authentification Google** (AC: 3, 4, 5, 6)
  - [x] Créer la fonction `signInWithGoogle()` dans `lib/auth.ts`
  - [x] Flow : `await GoogleSignin.hasPlayServices()` → `await GoogleSignin.signIn()` → récupérer `idToken`
  - [x] Créer un `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(auth, credential)`
  - [x] Vérifier si le document Firestore `/users/{uid}` existe ; le créer si premier login Google
  - [x] Hydrater `authStore` : `setUser(uid, email, displayName)`
  - [x] Charger `circleId` depuis Firestore et appeler `setCircle()` si présent

- [x] **Task 3 — UI : Bouton Google sur login.tsx** (AC: 1, 7, 8, 10)
  - [x] Ajouter un séparateur "ou" entre le formulaire et le bouton Google
  - [x] Créer le bouton avec l'icône Google et le texte "Continuer avec Google"
  - [x] Gérer l'état loading (désactiver le bouton pendant le flow)
  - [x] Gérer l'annulation silencieuse (`statusCodes.SIGN_IN_CANCELLED`)
  - [x] Gérer les erreurs avec toast via `useUIStore.getState().addToast()`

- [x] **Task 4 — UI : Bouton Google sur register.tsx** (AC: 9)
  - [x] Même bouton que login.tsx — composant réutilisable `components/auth/GoogleSignInButton.tsx`
  - [x] Le flow Google sur register crée également le document Firestore si premier login

- [x] **Task 5 — Tests** (AC: 1–10)
  - [x] Créer `lib/auth.test.ts`
  - [x] Mock `@react-native-google-signin/google-signin`
  - [x] Test : flow complet → `signInWithCredential` appelé, `setUser` appelé
  - [x] Test : annulation utilisateur → aucun toast
  - [x] Test : erreur réseau → toast affiché
  - [x] Test : premier login Google → `setDoc` Firestore appelé pour créer le profil

## Dev Notes

### Bibliothèque recommandée

**Utiliser `@react-native-google-signin/google-signin` v14+** (NOT `expo-google-sign-in` qui est déprécié, NOT `expo-auth-session` seul qui ne supporte pas bien les builds natifs EAS).

```bash
npx expo install @react-native-google-signin/google-signin
```

Le plugin Expo gère automatiquement la configuration native (iOS + Android) via EAS Build.

### Configuration dans app.json

```json
{
  "expo": {
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### Récupérer le webClientId

Dans Firebase Console → Project Settings → ton app web → OAuth 2.0 Client ID.
**Ne PAS utiliser le clientId Android/iOS** — toujours le webClientId.
À stocker dans `.env` : `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=996935963486-2gb0585tc097tf6l2tflc53c7rmg68b6.apps.googleusercontent.com`

### Flow d'implémentation (pattern Firebase v10)

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// Configurer une seule fois au démarrage (lib/firebase.ts ou app/_layout.tsx)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // 996935963486-2gb0585tc097tf6l2tflc53c7rmg68b6.apps.googleusercontent.com
})

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const { data } = await GoogleSignin.signIn()
  const credential = GoogleAuthProvider.credential(data.idToken)
  return signInWithCredential(auth, credential)
}
```

### Gestion des annulations

```typescript
} catch (error: any) {
  if (error.code === statusCodes.SIGN_IN_CANCELLED) {
    return // Silencieux — l'utilisateur a annulé
  }
  if (error.code === statusCodes.IN_PROGRESS) {
    return // Déjà en cours
  }
  useUIStore.getState().addToast({ message: 'Erreur de connexion Google', type: 'error' })
}
```

### Création du profil Firestore (premier login Google)

```typescript
const userRef = doc(db, 'users', user.uid)
const userSnap = await getDoc(userRef)
if (!userSnap.exists()) {
  await setDoc(userRef, {
    displayName: user.displayName ?? null,
    email: user.email ?? '',
    circleId: null,
    createdAt: serverTimestamp(),
  })
}
```

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `lib/firebase.ts` | Ajouter `GoogleSignin.configure(...)` |
| `app/(auth)/login.tsx` | Ajouter bouton Google + handler `signInWithGoogle` |
| `app/(auth)/register.tsx` | Ajouter bouton Google (même logique) |
| `app.json` | Ajouter plugin `@react-native-google-signin/google-signin` |
| `.env` / `app.json` extra | Ajouter `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| `app/(auth)/login.test.tsx` | Ajouter tests Google auth |

### Style du bouton (thème cinéma sombre)

Reprendre exactement le style des inputs existants :
- Background : `#1C1717`
- Border : `border border-[#3D3535]`
- Texte : `text-white font-medium`
- Icône Google : utiliser `react-native-svg` ou une image PNG locale dans `assets/`
- Séparateur "ou" : ligne horizontale `bg-[#3D3535]` avec texte `text-[#6B5E5E]`

### Mocking pour les tests

```typescript
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-id-token' } }),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
}))
```

### Précautions importantes

- ⚠️ **Android SHA-1 requis** : Sans le SHA-1 ajouté dans Firebase Console, le flow Google échoue silencieusement sur Android. Utiliser `npx expo run:android` en debug pour obtenir le SHA-1 de debug, ou le récupérer depuis EAS Build.
- ⚠️ **`hasPlayServices()` Android uniquement** : Sur iOS, ne pas appeler `hasPlayServices()` (n'existe pas). Vérifier `Platform.OS`.
- ⚠️ **Rebuild natif requis** : Après ajout du plugin, il faut rebuild l'app (`eas build` ou `npx expo prebuild && npx expo run:android`). Expo Go ne supporte PAS ce plugin.
- ⚠️ **Ne pas dupliquer `initializeAuth`** : Le Firebase `auth` est déjà initialisé dans `lib/firebase.ts`. Importer et réutiliser cette instance.

### Project Structure Notes

- Les fichiers auth sont dans `app/(auth)/` — respecter ce pattern
- Pas de dossier `components/` général : si composant bouton Google réutilisable, créer `components/auth/GoogleSignInButton.tsx`
- Tests co-localisés avec le source : `login.test.tsx` next to `login.tsx`
- Toutes les variables d'environnement via `.env` avec préfixe `EXPO_PUBLIC_`

### References

- Architecture : `_bmad-output/planning-artifacts/architecture.md` §Auth
- Story 1.2 : `_bmad-output/implementation-artifacts/1-2-creation-de-compte-utilisateur.md`
- Story 1.3 : `_bmad-output/implementation-artifacts/1-3-connexion-deconnexion-et-navigation-protegee.md`
- Lib officielle : https://react-native-google-signin.github.io/docs/setting-up/expo

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Erreur code `10` (DEVELOPER_ERROR) → SHA-1 manquant dans Firebase Console + webClientId absent du `.env`

### Completion Notes List

- Installé `@react-native-google-signin/google-signin` v16.1.2, plugin auto-ajouté à `app.json`
- `GoogleSignin.configure()` appelé dans `lib/firebase.ts` au démarrage
- `signInWithGoogle()` dans `lib/auth.ts` : hasPlayServices (Android only), signIn, credential Firebase, création profil Firestore si premier login, hydratation authStore
- Composant réutilisable `components/auth/GoogleSignInButton.tsx`
- Séparateur "ou" + bouton Google ajoutés dans `login.tsx` et `register.tsx`
- 6 tests dans `lib/auth.test.ts` — 68/68 suite complète, zéro régression

### File List

- `lib/auth.ts` (nouveau)
- `lib/auth.test.ts` (nouveau)
- `components/auth/GoogleSignInButton.tsx` (nouveau)
- `app/(auth)/login.tsx` (bouton Google + handler)
- `app/(auth)/login.test.tsx` (mock @/lib/auth)
- `app/(auth)/register.tsx` (bouton Google + handler)
- `app/(auth)/register.test.tsx` (mock @/lib/auth)
- `lib/firebase.ts` (GoogleSignin.configure)
- `app.json` (plugin @react-native-google-signin/google-signin)
- `.env.example` (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
