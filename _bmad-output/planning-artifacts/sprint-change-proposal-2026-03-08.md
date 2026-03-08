# Sprint Change Proposal — 2026-03-08

## Section 1 : Résumé du problème

**Problème :** Firebase Cloud Functions requièrent le plan Blaze (pay-as-you-go) pour effectuer des appels réseau sortants. Le plan Spark (gratuit) bloque ces appels, ce qui rend la story 2.1 telle qu'initialement conçue impossible sans engagement de coût.

**Découvert :** En fin d'implémentation de la story 2.1 (status : review), lors des premiers tests d'intégration.

**Décision :** Supprimer la couche Firebase Functions pour les APIs tierces. Appels TMDB et Google Books effectués directement depuis le client avec des clés read-only restreintes.

---

## Section 2 : Analyse d'impact

### Epic Impact
- **Epic 2** (Ma Collection) : Stories 2.1, 2.2, 2.3 affectées — lib cliente change, comportement fonctionnel identique
- **Epic 5** (Découverte) : Story 5.1 affectée — appel TMDB now_playing passe direct client

### Story Impact

| Story | Impact | Nature |
|-------|--------|--------|
| 2.1 | Réécriture complète | Infrastructure → lib client |
| 2.2 | Mise à jour AC1 | Référence lib/functions.ts → lib/tmdb.ts |
| 2.3 | Mise à jour AC1 | Référence lib/functions.ts → lib/googleBooks.ts |
| 5.1 | Mise à jour AC1 | Référence Firebase Functions → lib/tmdb.ts |

### Conflicts d'artifacts

| Artifact | Section | Changement |
|----------|---------|------------|
| `architecture.md` | NFR8 | Relaxé — clés read-only côté client acceptées |
| `architecture.md` | Frontière API | Suppression proxy Functions |
| `architecture.md` | Structure projet | lib/functions.ts → lib/tmdb.ts + lib/googleBooks.ts |
| `architecture.md` | Data Flow | Suppression étape Functions |
| `architecture.md` | Enforcement Guidelines | Anti-pattern mis à jour |
| `epics.md` | Story 2.1 | Réécriture titre, user story, AC1 |
| `epics.md` | Stories 2.2, 2.3, 5.1 | Mise à jour références lib |

### Impact Technique
- Répertoire `functions/` supprimé (code déjà implémenté en story 2.1 → à supprimer)
- `lib/functions.ts` supprimé → remplacé par `lib/tmdb.ts` + `lib/googleBooks.ts`
- Story 2.1 à ré-implémenter avec la nouvelle approche
- Variables d'env : `EXPO_PUBLIC_TMDB_API_KEY` et `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` ajoutées au `.env` client

---

## Section 3 : Approche recommandée

**Chemin choisi : Direct Adjustment** — modification des stories et artifacts dans le plan existant.

**Justification :**
- App personnelle < 20 utilisateurs : risque exposition clés négligeable
- Clés TMDB : read-only par design, révocables à tout moment
- Google Books : API publique, clé optionnelle pour usage basique
- Zéro complexité d'infrastructure supplémentaire
- Stories fonctionnellement identiques — seul le transport change

**Risques :**
- Faible : clés visibles dans le bundle (acceptable pour usage privé)
- Nul : perte de fonctionnalité (TMDB et Google Books restent pleinement utilisables)

---

## Section 4 : Propositions de changement détaillées

### architecture.md

**NFR8**
```
ANCIEN : NFR8 : Clés API non exposées client-side (Firebase Functions proxy obligatoire)
NOUVEAU : NFR8 : Clés API tierces (TMDB, Google Books) appelées directement depuis le client
          avec des clés read-only restreintes — Firebase Functions supprimées (plan Spark gratuit).
```

**Frontière API**
```
ANCIEN : Le client n'appelle jamais TMDB/Google Books directement — tout via lib/functions.ts
NOUVEAU : lib/tmdb.ts et lib/googleBooks.ts — clients directs côté client
```

**Structure lib/**
```
ANCIEN : lib/functions.ts ← appels Firebase Functions uniquement
NOUVEAU : lib/tmdb.ts + lib/googleBooks.ts ← clients API directs
```

**Répertoire functions/**
```
ANCIEN : functions/ ← Firebase Functions (déployé séparément)
NOUVEAU : (supprimé)
```

**Data Flow**
```
ANCIEN : useBarcodeScan → lib/functions.ts → Firebase Function → TMDB/Google Books
NOUVEAU : useBarcodeScan → lib/googleBooks.ts (ISBN) | lib/tmdb.ts (EAN)
```

**Enforcement Guidelines**
```
ANCIEN : ❌ fetch('https://api.themoviedb.org/...') → toujours via lib/functions.ts
NOUVEAU : ✅ fetch TMDB → toujours via lib/tmdb.ts (jamais inline dans les composants)
          ✅ fetch Google Books → toujours via lib/googleBooks.ts
```

### epics.md

**Story 2.1**
```
ANCIEN : Configuration Firebase Functions — Proxy API
NOUVEAU : Configuration des clients API directs (TMDB & Google Books)
```

**Stories 2.2, 2.3, 5.1**
```
Remplacer toutes les références lib/functions.ts → lib/tmdb.ts / lib/googleBooks.ts
```

---

## Section 5 : Handoff d'implémentation

**Scope : Modéré**

**Tâches pour l'agent Dev :**

1. Supprimer `functions/` du projet
2. Supprimer `lib/functions.ts` et `lib/functions.test.ts`
3. Migrer `functions/src/utils/tmdb.ts` → `lib/tmdb.ts` (adapter pour client Expo)
4. Migrer `functions/src/utils/googleBooks.ts` → `lib/googleBooks.ts` (adapter pour client Expo)
5. Créer `lib/mediaSearch.ts` exposant `searchMedia()` et `getMediaByBarcode()` avec la même interface que l'ancienne `lib/functions.ts`
6. Ajouter `EXPO_PUBLIC_TMDB_API_KEY` et `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` au `.env` et `.env.example`
7. Mettre à jour les tests unitaires en conséquence
8. Story 2.1 : ré-implémenter avec `lib/tmdb.ts` + `lib/googleBooks.ts`

**Critères de succès :**
- `searchMedia()` et `getMediaByBarcode()` retournent `FunctionResponse<T>` identique
- Tous les tests passent
- Aucune référence à `firebase/functions` ou `functions/` dans le code client
- `.env.example` documenté avec les nouvelles clés
