# Story 2.4 : Création manuelle d'une fiche

Status: done

## Story

En tant qu'utilisatrice,
Je veux créer manuellement une fiche pour un item non trouvé via API,
Afin de ne jamais être bloquée par les limites des bases de données externes.

## Acceptance Criteria

### AC1 — Création manuelle réussie

**Given** l'écran de création manuelle (`app/item/new.tsx`)
**When** je saisis le titre (obligatoire) et le type de média (film / série / livre)
**Then** les champs optionnels (année, réalisateur/auteur, synopsis) sont disponibles
**And** à la validation, l'item est enregistré dans Firestore avec `addedVia: 'manual'`

### AC2 — Validation titre obligatoire

**Given** le titre manquant
**When** je tente de valider
**Then** une erreur de validation s'affiche sur le champ titre
**And** aucune écriture Firestore n'est effectuée

## Tasks / Subtasks

- [x] **Task 1 — Implémenter `app/item/new.tsx`** (AC1, AC2)
  - [x] Champ titre (requis) avec erreur si vide
  - [x] Sélecteur type : `film | serie | livre` (boutons segmentés)
  - [x] Champs optionnels : année (numérique), réalisateur/auteur, synopsis (multiline)
  - [x] Bouton "Ajouter" → validation → `addItem(uid, { ...data, addedVia: 'manual', status: 'owned', tier: 'none' })`
  - [x] Après succès : `router.back()`
  - [x] Styler Dark Cinéma NativeWind

- [x] **Task 2 — Tests** (AC1, AC2)
  - [x] Test : titre vide → erreur affichée, `addItem` non appelé
  - [x] Test : titre + type → `addItem` appelé avec `addedVia: 'manual'`
  - [x] Test : champs optionnels inclus dans l'item si renseignés
  - [x] Test : champ auteur pour les livres

## Dev Notes

### Champ conditionnel réalisateur/auteur

```typescript
{mediaType === 'livre'
  ? <Input label="Auteur" value={author} onChangeText={setAuthor} />
  : <Input label="Réalisateur" value={director} onChangeText={setDirector} />
}
```

### Sélecteur type segmenté (NativeWind)

```typescript
{(['film', 'serie', 'livre'] as MediaType[]).map(t => (
  <Pressable
    key={t}
    onPress={() => setMediaType(t)}
    className={`px-4 py-2 rounded-full mr-2 ${mediaType === t ? 'bg-amber-400' : 'bg-[#1C1717] border border-[#3D3535]'}`}
  >
    <Text className={mediaType === t ? 'text-[#0E0B0B] font-bold' : 'text-gray-400'}>
      {MEDIA_TYPES[t].label}
    </Text>
  </Pressable>
))}
```

### References

- [Source: epics.md#Story 2.4]
- [Source: story 2-2] — addItem dans lib/firestore.ts
- [Source: architecture.md#Naming Patterns] — constantes MEDIA_TYPES

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List
- `app/item/new.tsx` : sélecteur type, titre requis, champs optionnels conditionnels (réalisateur/auteur), année parsée, addItem + router.back()
- 4 tests — 77/77 suite complète, zéro régression

### File List

- `app/item/new.tsx` (stub → implémentation)
- `app/item/new.test.tsx` (nouveau)
