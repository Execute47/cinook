---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-03-06
author: Mathilde
---

# Product Brief: Cinook

## Executive Summary

Cinook est une application mobile et desktop destinée à un cercle privé de proches, permettant de gérer sa collection de films, séries et livres physiques en un seul endroit. Elle résout trois frustrations majeures : la perte de données liée à la dépendance à des outils tiers, la difficulté à mémoriser ce qu'on a vu ou lu, et la saisie manuelle fastidieuse. Grâce au scan de codes-barres, à l'auto-remplissage des fiches via API, et à un système de notation riche, Cinook offre une expérience fluide et fiable — dans un cadre 100% privé, sans exposition aux inconnus.

---

## Core Vision

### Problem Statement

Les amateurs de films, séries et livres physiques n'ont pas d'outil fiable, tout-en-un et privé pour gérer leur médiathèque personnelle. Les apps existantes sont soit spécialisées (un seul type de média), soit orientées réseau social public, soit insuffisamment fiables (risque de fermeture, perte de données). La saisie manuelle des informations est un frein majeur à l'adoption.

### Problem Impact

- **Perte de données** : dépendre d'une app tierce qui peut cesser de fonctionner à tout moment
- **Mémoire défaillante** : acheter un livre déjà lu, revoir un film sans s'en souvenir, ne plus retrouver ce qu'on voulait regarder
- **Friction à l'usage** : la saisie manuelle décourage la mise à jour régulière, rendant l'outil inutile au fil du temps
- **Manque d'intimité** : aucune solution ne permet le partage exclusivement entre proches, sans exposition publique

### Why Existing Solutions Fall Short

| Solution | Limite |
|----------|--------|
| Letterboxd | Films uniquement, réseau social public |
| Goodreads | Livres uniquement, réseau social public |
| Listes Notes/Tableur | Aucune auto-complétion, pas de social, peu pratique |
| Apps génériques | Pas de scan, pas de dimension sociale privée, souvent abandonnées |

Aucune solution ne combine les trois médias + scan physique + confidentialité totale + richesse de notation.

### Proposed Solution

Cinook est une app multiplateforme (mobile + desktop) connectée à Firebase, qui permet de :
- **Scanner des codes-barres** de supports physiques (DVD, Blu-ray, livres) pour créer automatiquement des fiches enrichies via TMDB et Google Books
- **Gérer les statuts** de chaque item : Possédé · Vu · Prêté (avec nom + date) · À voir · Favori
- **Noter richement** chaque œuvre : note de 0 à 10 + tier-list (Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant) + commentaire libre
- **Partager en privé** au sein d'un cercle fermé : recommandations, Cinéclub, films à l'affiche
- **Exporter ses données** pour ne jamais être tributaire d'un service tiers

### Key Differentiators

1. **Tout-en-un** — Films, Séries, Livres dans une seule app cohérente
2. **100% privé** — Aucun profil public, aucune exposition aux inconnus, cercle fermé uniquement
3. **Zéro saisie manuelle** — Scan de codes-barres + auto-remplissage par API
4. **Notation expressive** — Combinaison note chiffrée + tier-list + commentaire, unique sur le marché
5. **Souveraineté des données** — Export disponible, Firebase sous contrôle, pas de dépendance à un éditeur tiers

---

## Target Users

### Primary Users

**Mathilde — La Bibliothécaire Passionnée** *(Admin unique)*

Collectionneuse et grande consommatrice de films, séries et livres, Mathilde a un rapport affectif fort à la médiathèque — qu'elle soit physique ou numérique. Elle est l'initiatrice et l'administratrice de Cinook : c'est elle qui configure l'app et en est la gardienne. Elle veut un outil fiable qui reflète fidèlement sa collection, lui permette de retrouver n'importe quel titre en un instant, et de partager ses découvertes avec ses proches sans passer par des messageries. Sa frustration principale : avoir perdu le fil de ses données avec une app tierce défaillante.

**Anna — La Cinéphile Connectée** *(Co-utilisatrice principale)*

Même niveau de consommation culturelle que Mathilde, à l'aise avec le numérique. Anna est la partenaire naturelle de l'aventure Cinook. Aujourd'hui, leurs recommandations se font de vive voix — Cinook leur permettra de formaliser ces échanges de façon asynchrone, de voir les notes de l'autre, et de construire des listes communes. Elle attendra une app intuitive sans apprentissage lourd.

### Secondary Users

**Les parents — Les Utilisateurs Lambdas** *(Membres invités)*

Consommateurs culturels occasionnels, peu à l'aise avec la complexité technique. Ils rejoindront le cercle via invitation et utiliseront l'app de façon simple : consulter, ajouter un film via scan, lire les recommandations. Ils ont les mêmes droits que les autres membres (hors administration), mais leur usage sera minimal. L'interface doit être limpide pour eux — chaque friction est une raison de décrocher.

> **Note structurelle :** En v1, tous les membres partagent un seul cercle privé (modèle "cercle fixe"). L'administration globale de l'app (paramètres, export, gestion des comptes) reste réservée à Mathilde.

### User Journey

| Etape | Mathilde | Anna | Parents |
|-------|----------|------|---------|
| **Découverte** | Crée l'app, configure son compte | Reçoit une invitation de Mathilde | Reçoivent une invitation de leur enfant |
| **Onboarding** | Scanne ses premiers DVD/livres, voit les fiches s'auto-remplir | Importe sa collection, rejoint le cercle commun | Scannent 2-3 items avec aide, découvrent la simplicité |
| **Usage quotidien** | Note, commente, ajoute à sa wishlist "À voir" | Parcourt les notes de Mathilde, fait ses propres recommandations | Consultent la liste, marquent occasionnellement un film comme "vu" |
| **Moment "Aha!"** | Retrouve instantanément un titre prêté à quelqu'un 6 mois plus tôt | Reçoit une reco et l'ajoute d'un tap | Reçoivent une reco de leur enfant et la retrouvent facilement |
| **Long terme** | Cinook devient la référence de sa bibliothèque personnelle | Les échanges culturels avec Mathilde sont plus riches et structurés | Consultent ponctuellement, la friction zéro les maintient actifs |

---

## Success Metrics

Cinook étant un projet personnel, le succès se mesure à l'utilité réelle et quotidienne pour ses utilisateurs, pas à la croissance commerciale.

### Indicateurs de succès utilisateur

| Indicateur | Signal de succès |
|-----------|-----------------|
| **Fréquence d'usage** | Utilisation quotidienne et systématique lors de chaque visionnage/lecture |
| **Fiabilité de la collection** | "Je n'achète plus un livre que j'ai déjà lu" — zéro doublon involontaire |
| **Traçabilité des prêts** | "Je retrouve toujours à qui j'ai prêté un DVD" — aucun objet perdu de vue |
| **Complétude de la bibliothèque** | ~1 000 objets culturels importés, collection à jour en continu |
| **Adoption sociale** | Anna utilise l'app activement et de façon autonome |
| **Engagement social** | Minimum 4 recommandations échangées par mois entre membres |

### Business Objectives

*(Dans le cadre d'un projet personnel, ces objectifs remplacent les objectifs commerciaux classiques)*

1. **Fiabilité absolue** — Aucune perte de données, disponibilité de l'app garantie via Firebase
2. **Adoption du cercle privé** — Tous les membres invités actifs dans les 3 premiers mois
3. **Autonomie des données** — Export fonctionnel disponible dès la v1
4. **Rétention long terme** — L'app devient le réflexe naturel après chaque film ou livre

### Key Performance Indicators

| KPI | Cible | Délai |
|-----|-------|-------|
| Objets culturels importés | 1 000 | 3 mois post-lancement |
| Fréquence d'ouverture de l'app | Quotidienne | Dès J+30 |
| Recommandations échangées | 4 / mois minimum | Dès J+14 |
| Taux de scan réussi (code-barre) | > 90% | Dès le lancement |
| Temps de chargement d'une fiche | < 2 secondes | Dès le lancement |
| Anna : sessions actives | Hebdomadaire | Dès J+30 |

### Critères d'échec (à surveiller)

- Interface lente ou chargée → perte d'envie d'utiliser l'app au quotidien
- Scan défaillant → retour à la saisie manuelle, abandon progressif
- Perte de données → rupture totale de confiance, abandon immédiat

---

## MVP Scope

### Core Features (V1)

**Socle — Gestion de collection**
- Authentification et comptes utilisateurs (Firebase Auth)
- Catalogue unifié Films · Séries · Livres
- Scan de codes-barres de supports physiques (DVD, Blu-ray, livres)
- Auto-remplissage des fiches via TMDB (films/séries) et Google Books (livres)
- Statuts par item : Possédé · Vu · Prêté · À voir · Favori
- Suivi des prêts : nom de l'emprunteur + date de prêt
- Notation riche : note 0-10 + tier-list (Je n'ai pas aimé / Vu aussi / Bronze / Argent / Or / Diamant) + commentaire libre
- Export des données (CSV ou JSON)
- Interface mobile + desktop

**Découverte — Films à l'affiche**
- Section dédiée aux films actuellement en salle via TMDB "now playing"
- Ajout direct à la collection ou à la liste "À voir" depuis cette section

**Social — Cercle privé unique**
- Un seul espace partagé par invitation manuelle (modèle "cercle fixe")
- Recommandations d'items entre membres du cercle
- Cinéclub : mise en avant d'un film/livre par un membre du cercle (coup de cœur ou film à l'affiche), visible par tous

### Out of Scope for MVP

| Fonctionnalité | Raison du report | Cible |
|---------------|-----------------|-------|
| Gestion multi-groupes | Complexité non nécessaire en v1 — cercle unique suffisant | V2 |
| Notifications push | Valeur secondaire, implémentation coûteuse | V2 |
| Listes thématiques | Enrichissement social non critique au démarrage | V2 |

### MVP Success Criteria

L'MVP est considéré réussi si, dans les 3 mois post-lancement :
- La collection atteint ~1 000 objets culturels importés
- Anna est active de façon hebdomadaire
- 4 recommandations ou plus sont échangées par mois
- Le taux de scan réussi dépasse 90%
- Aucune perte de données n'est constatée

### Future Vision

**V2 — Groupes & Social enrichi**
- Création et gestion de groupes multiples (famille, amis ciné, etc.)
- Notifications push (nouvelle reco, Cinéclub, prêt en retard)
- Listes thématiques partageables au sein des groupes

**V3+ — Découverte & Intelligence**
- Suggestions personnalisées basées sur la collection et les notes
- Statistiques de lecture/visionnage (bilan annuel, genres favoris, etc.)
- Import depuis Letterboxd, Goodreads, ou fichier CSV
