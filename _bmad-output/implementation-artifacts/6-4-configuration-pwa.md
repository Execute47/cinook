# Story 6.4 : Configuration PWA (Progressive Web App)

Status: ready-for-dev

## Story

En tant qu'utilisatrice mobile,
Je veux pouvoir installer Cinook depuis mon navigateur mobile comme une vraie application,
Afin d'y accéder directement depuis mon écran d'accueil sans passer par un store.

## Acceptance Criteria

### AC1 — Manifest PWA configuré

**Given** l'app déployée sur Firebase Hosting
**When** un navigateur mobile visite le site
**Then** un `manifest.json` valide est servi avec :
- `name: "Cinook"`, `short_name: "Cinook"`
- `theme_color: "#0E0B0B"`, `background_color: "#0E0B0B"`
- `display: "standalone"` (plein écran, sans barre navigateur)
- `lang: "fr"`
- Icônes 192×192 et 512×512

### AC2 — Installation sur Android Chrome

**Given** AC1 complété
**When** l'utilisatrice visite le site sur Android Chrome
**Then** Chrome propose automatiquement "Ajouter à l'écran d'accueil"
**And** l'app installée se lance en mode standalone (sans barre d'adresse)
**And** l'icône Cinook apparaît sur l'écran d'accueil

### AC3 — Installation sur iOS Safari

**Given** AC1 complété
**When** l'utilisatrice visite le site sur iOS Safari
**Then** elle peut utiliser "Partager → Sur l'écran d'accueil" pour installer
**And** l'app se lance en mode standalone
**And** le splash screen correspond aux couleurs de l'app

### AC4 — Comportement du scan sur web

**Given** l'app installée en PWA
**When** l'utilisatrice navigue vers l'onglet scanner
**Then** un message clair indique que le scan est disponible uniquement sur l'app mobile native (iOS/Android)
**And** un lien vers les stores (ou un message d'info) est affiché
**And** les autres fonctionnalités restent accessibles normalement

### AC5 — Icônes aux bons formats

**Given** les assets existants (`assets/icon.png`)
**When** le build web est généré
**Then** des icônes 192×192 et 512×512 sont disponibles (générées depuis `assets/icon.png` ou ajoutées manuellement dans `public/`)

## Tasks / Subtasks

- [ ] **Task 1 — Configuration `app.json`** (AC1, AC2, AC3)
  - [ ] Compléter la section `web` avec les métadonnées PWA :
    - `name`, `shortName`, `lang`, `themeColor`, `backgroundColor`, `description`
  - [ ] S'assurer que `output: "static"` est bien en place (déjà configuré)

- [ ] **Task 2 — Icônes PWA** (AC1, AC5)
  - [ ] Créer le dossier `public/` s'il n'existe pas
  - [ ] Ajouter `public/icon-192.png` et `public/icon-512.png` (redimensionner `assets/icon.png`)
  - [ ] Référencer ces icônes dans la config web de `app.json`

- [ ] **Task 3 — Écran scan sur web** (AC4)
  - [ ] Dans `app/scan.tsx` : détecter la plateforme avec `Platform.OS === 'web'`
  - [ ] Si web → afficher un écran de substitution avec message informatif au lieu de la caméra
  - [ ] Message : "Le scan est disponible uniquement sur l'app mobile native."

- [ ] **Task 4 — Vérification build et déploiement**
  - [ ] Lancer `npx expo export --platform web` et vérifier la présence du `manifest.json` généré
  - [ ] Vérifier que `theme-color` est bien dans le `<head>` HTML généré
  - [ ] Déployer sur Firebase Hosting et tester l'installation sur un appareil réel (Android Chrome + iOS Safari)

- [ ] **Task 5 — Tests**
  - [ ] `app/scan.tsx` sur web : affiche le message de substitution (pas le composant caméra)
  - [ ] `app/scan.tsx` sur mobile : comportement inchangé

## Dev Notes

### Configuration `app.json` — section `web` à compléter

```json
"web": {
  "bundler": "metro",
  "output": "static",
  "favicon": "./assets/favicon.png",
  "name": "Cinook",
  "shortName": "Cinook",
  "lang": "fr",
  "themeColor": "#0E0B0B",
  "backgroundColor": "#0E0B0B",
  "description": "Ta collection culturelle personnelle"
}
```

Expo Router avec `output: "static"` génère automatiquement un `manifest.json` à partir de ces champs lors du build. Pas besoin de créer le fichier manuellement.

### Icônes PWA

Expo génère les icônes PWA depuis `icon` (racine de la config expo) si les champs `icons` ne sont pas explicitement fournis. Pour garantir les bonnes tailles (192 et 512), créer `public/icon-192.png` et `public/icon-512.png` à partir de `assets/icon.png`, puis les référencer :

```json
"web": {
  ...
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Les fichiers dans `public/` sont copiés tels quels dans le build statique par Expo.

### Détection plateforme dans scan.tsx

```typescript
import { Platform } from 'react-native'

// En haut du composant, avant le return :
if (Platform.OS === 'web') {
  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-8">
      <Text className="text-white text-lg font-bold mb-3 text-center">
        Scanner non disponible sur web
      </Text>
      <Text className="text-[#6B5E5E] text-sm text-center">
        Le scan de codes-barres est disponible uniquement sur l'application mobile (iOS / Android).
      </Text>
    </View>
  )
}
```

### Comportement offline

La persistance offline est déjà gérée par le SDK Firestore (story 6.1). La PWA bénéficiera automatiquement de ce cache. Pas de service worker custom nécessaire.

### Limitations iOS Safari PWA

- Pas de prompt d'installation automatique (contrairement à Android Chrome) — l'utilisatrice doit passer par "Partager → Sur l'écran d'accueil"
- Les notifications push ne sont pas supportées (non pertinent pour Cinook)
- La PWA sur iOS se comporte bien en mode standalone si `display: "standalone"` est configuré

### Vérification manifest après build

```bash
npx expo export --platform web
# Vérifier dist/manifest.json
cat dist/manifest.json
```

### References

- [Source: app.json] — config Expo actuelle, section `web` à compléter
- [Source: app/scan.tsx] — composant scan à conditionner selon Platform.OS
- [Source: assets/icon.png] — source pour générer les icônes 192/512
- [Source: architecture.md] — Firebase Hosting SPA, Expo SDK 53, output static

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
