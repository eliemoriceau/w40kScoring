# ScoreService - Architecture Technique

## Vue d'ensemble

Le `ScoreService` implémente les exigences de l'issue #17 en suivant l'architecture hexagonale et les principes DDD. Il gère l'ajout, la modification et la consultation des scores avec des règles métier complexes, notamment pour le nouveau type `CHALLENGER`.

## Architecture

### Pattern Hexagonal

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │     Domain      │    │ Infrastructure  │
│                 │    │                 │    │                 │
│  ScoreService   │ -> │ Score Entity    │ <- │ Repositories    │
│  DTOs           │    │ Value Objects   │    │ Adapters        │
│  Mappers        │    │ Domain Errors   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Couches Implémentées

#### Domain Layer

- **Entities**: `Score` (aggregate root)
- **Value Objects**: `ScoreType` étendu avec `CHALLENGER`
- **Domain Errors**: 8 nouvelles erreurs spécialisées
- **Services**: `IdGenerator` interface

#### Application Layer

- **Service**: `ScoreService` - orchestration et règles métier
- **DTOs**: `AddScoreDto`, `UpdateScoreDto`, Response DTOs avec validation
- **Mappers**: `ScoreMapper` pour traduction Domain ↔ DTO

## Types de Score Supportés

### Types Autorisés

- `PRIMARY`: Scores principaux (0-15 points)
- `SECONDARY`: Scores secondaires avec nom obligatoire (0-15 points)
- `CHALLENGER`: Score de rattrapage avec règles complexes (0-15 points)

### Règles CHALLENGER

1. **Interdit au round 1**: Aucun CHALLENGER possible en première manche
2. **Unicité**: Un seul CHALLENGER par round maximum
3. **Déficit requis**: Minimum 6 points de retard au round précédent
4. **Calcul déficit**: `ScoreAdversaire - ScoreJoueur ≥ 6`
5. **Égalité autorisée**: Déficit de 6 exactement accepté

## Autorisation

### Règles d'Accès

- **Lecture**: Accès public à tous les scores
- **Écriture**: Réservée au propriétaire du jeu et aux participants
- **Validation**: Vérification systématique avant toute modification

### Matrice d'Autorisation

| Action   | Propriétaire | Participant | Autre |
| -------- | ------------ | ----------- | ----- |
| Lire     | ✅           | ✅          | ✅    |
| Ajouter  | ✅           | ✅          | ❌    |
| Modifier | ✅           | ✅          | ❌    |

## Validation des Données

### Validation DTO

- **Champs requis**: Validation présence et format
- **Types de score**: Restriction aux types autorisés uniquement
- **Valeurs**: Range 0-15 pour tous les types
- **Noms SECONDARY**: Obligatoire et non-vide

### Validation Métier

- **Autorisation**: Owner/participant check
- **Règles CHALLENGER**: Validation complète des 5 règles
- **Cohérence**: Vérification existence round/game

## Gestion d'Erreurs

### Erreurs Domain Spécialisées

```typescript
export enum DomainErrorCodes {
  INVALID_SCORE_TYPE_FOR_SERVICE = 'INVALID_SCORE_TYPE_FOR_SERVICE',
  SCORE_VALUE_OUT_OF_RANGE = 'SCORE_VALUE_OUT_OF_RANGE',
  SECONDARY_SCORE_NAME_REQUIRED = 'SECONDARY_SCORE_NAME_REQUIRED',
  CHALLENGER_FORBIDDEN_IN_FIRST_ROUND = 'CHALLENGER_FORBIDDEN_IN_FIRST_ROUND',
  CHALLENGER_ALREADY_EXISTS_IN_ROUND = 'CHALLENGER_ALREADY_EXISTS_IN_ROUND',
  INSUFFICIENT_DEFICIT_FOR_CHALLENGER = 'INSUFFICIENT_DEFICIT_FOR_CHALLENGER',
  OPPONENT_NOT_FOUND_FOR_CHALLENGER = 'OPPONENT_NOT_FOUND_FOR_CHALLENGER',
  UNAUTHORIZED_SCORE_ACCESS = 'UNAUTHORIZED_SCORE_ACCESS',
}
```

### Stratégie de Gestion

- **Erreurs métier**: Domain errors avec codes spécifiques
- **Erreurs techniques**: Propagation vers couche supérieure
- **Logging**: Traçabilité des erreurs d'autorisation

## API du Service

### Méthodes Principales

#### `addScore(dto: AddScoreDto): Promise<ScoreResponseDto>`

1. Validation basique (type, valeur, nom SECONDARY)
2. Récupération round/game
3. Validation autorisation
4. Validation règles CHALLENGER si applicable
5. Création et sauvegarde score
6. Retour DTO avec contexte d'autorisation

#### `updateScore(dto: UpdateScoreDto): Promise<ScoreResponseDto>`

1. Validation valeur
2. Récupération score existant
3. Validation autorisation via game
4. Mise à jour valeur/nom
5. Sauvegarde et retour DTO

#### `listScores(roundId: string): Promise<ScoreListResponseDto>`

1. Validation existence round
2. Récupération scores du round
3. Mapping vers DTO liste (accès public)

#### `getTotal(playerId: string, gameId: string): Promise<PlayerTotalResponseDto>`

1. Récupération scores joueur dans le jeu
2. Calcul total avec répartition par type
3. Retour avec breakdown détaillé

## Performance et Optimisation

### Requêtes Optimisées

- **Batch queries**: Récupération groupée des données liées
- **Indexation**: Sur roundId, playerId, gameId pour les recherches
- **Cache potential**: Totaux joueurs calculés

### Complexité Temporelle

- `addScore`: O(n) - validation CHALLENGER nécessite parcours scores
- `listScores`: O(1) - requête directe par roundId
- `getTotal`: O(n) - agrégation scores joueur

## Tests et Couverture

### Stratégie TDD

1. **Red**: Tests en échec d'abord (31 tests initiaux)
2. **Green**: Implémentation minimale pour passer
3. **Refactor**: Optimisation et nettoyage

### Couverture Tests

- **Service**: 9 tests couvrant tous les cas d'usage
- **DTOs**: 22 tests de validation
- **Domain**: Tests existants étendus pour CHALLENGER
- **Total**: 426/426 tests passants

### Types de Tests

- **Happy path**: Cas nominaux tous types
- **Validation errors**: Toutes les règles métier
- **Authorization**: Owner/participant scenarios
- **Edge cases**: Déficit exact, premier round

## Intégration Continue

### Commandes Validation

```bash
npm run lint      # ESLint + Prettier
npm run typecheck # TypeScript validation
npm test          # Suite complète Japa
npm run build     # Compilation production
```

### Commits Conventionnels

- `feat(domain)`: Extension CHALLENGER
- `feat(application)`: ScoreService implementation
- `test(tdd)`: Tests-driven development

## Migration et Déploiement

### Compatibilité

- **Backward compatible**: Aucune modification des types existants
- **Extension seulement**: Ajout CHALLENGER sans impact
- **Database**: Aucune migration requise

### Rollback Strategy

- **Domain errors**: Nouvelles classes, pas de breaking change
- **ScoreType**: Extension de tableau, compatible
- **Tests**: Couverture complète pour régressions

## Métriques et Monitoring

### Indicateurs Clés

- **Latence**: Temps réponse par méthode
- **Erreurs**: Taux erreurs par type
- **Utilisation**: Distribution types de scores
- **Authorization**: Tentatives accès non autorisé

### Logging Recommendé

```typescript
logger.info('Score added', {
  scoreType,
  playerId,
  gameId,
  requestingUserId,
  executionTime,
})
logger.warn('Authorization failed', {
  userId,
  gameId,
  action,
})
```

---

_Documentation générée pour l'implémentation ScoreService - Architecture Hexagonale DDD_
