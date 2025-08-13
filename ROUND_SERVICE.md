# RoundService - Documentation Technique

## 🎯 Vue d'Ensemble

Le **RoundService** implémente la gestion des rounds de jeu selon l'architecture hexagonale et les principes DDD. Il permet de modifier les scores des rounds, de les compléter et de les lister avec validation métier stricte et autorisation granulaire.

## 🏗️ Architecture

### Couches DDD

- **Domain** : Erreurs métier (`GameNotInProgressError`, `RoundNotFoundError`, etc.)
- **Application** : DTOs, Mapper, RoundService
- **Infrastructure** : Réutilise les repositories Round/Game/Player existants

### Flux de Données (Hexagonal)

```
HTTP Request → RoundService → RoundRepository → Domain Entity → DB
     ↓              ↓               ↓              ↓
  DTOs      Business Logic    Domain Rules   Contraintes DB
```

## 🚀 API du Service

### `updateRoundScores(dto: UpdateRoundScoresDto): Promise<RoundResponseDto>`

Met à jour les scores d'un round avec validation complète.

**Paramètres** :

```typescript
interface UpdateRoundScoresDto {
  gameId: string // ID de la partie
  roundNumber: number // Numéro du round (1-5)
  playerScore: number // Score du joueur (≥ 0)
  opponentScore: number // Score de l'adversaire (≥ 0)
  requestingUserId: number // ID utilisateur pour autorisation
}
```

**Règles Métier** :

- ✅ Autorisation : propriétaire OU participant de la partie
- ✅ État requis : Game.state = IN_PROGRESS
- ✅ Round non complété
- ✅ Scores non-négatifs et entiers

**Erreurs** :

- `GameNotInProgressError` : Partie non en cours
- `RoundNotFoundError` : Round inexistant
- `RoundAlreadyCompletedError` : Round déjà complété
- `UnauthorizedRoundAccessError` : Utilisateur non autorisé

---

### `completeRound(dto: CompleteRoundDto): Promise<RoundResponseDto>`

Finalise un round avec ses scores actuels.

**Paramètres** :

```typescript
interface CompleteRoundDto {
  gameId: string // ID de la partie
  roundNumber: number // Numéro du round (1-5)
  requestingUserId: number // ID utilisateur pour autorisation
}
```

**Caractéristiques** :

- ✅ **Idempotent** : peut être appelé plusieurs fois sans effet de bord
- ✅ Utilise les scores actuels du round
- ✅ Émet `RoundCompletedEvent` si pas déjà complété
- ✅ Round complété devient non-modifiable

---

### `listRounds(gameId: string, requestingUserId: number): Promise<RoundListResponseDto>`

Liste tous les rounds d'une partie avec métadonnées.

**Autorisation** : Propriétaire OU participant à la partie

**Retour** :

```typescript
interface RoundListResponseDto {
  rounds: RoundResponseDto[]
  pagination: {
    total: number
    hasMore: boolean // toujours false - tous les rounds retournés
  }
}

interface RoundResponseDto {
  id: string
  gameId: string
  roundNumber: number
  playerScore: number
  opponentScore: number
  isCompleted: boolean
  winner: 'PLAYER' | 'OPPONENT' | 'DRAW' | null
  canModify: boolean // Basé sur autorisation + état
  createdAt: Date
  completedAt?: Date
}
```

## 🔒 Sécurité & Autorisation

### Règles d'Accès

- **Modification** : Propriétaire OU participant de la partie
- **Game State** : Partie doit être `IN_PROGRESS`
- **Round State** : Round ne doit pas être complété pour modification

### Gestion d'Erreurs Craft

- **HTTP 403 Forbidden** : `UnauthorizedRoundAccessError`
- **HTTP 404 Not Found** : `RoundNotFoundError`
- **HTTP 409 Conflict** : `GameNotInProgressError`, `RoundAlreadyCompletedError`
- **HTTP 422 Unprocessable** : Validation DTO (scores négatifs, etc.)

## 🧪 Tests & Validation

### Couverture TDD Complète

- ✅ 9 tests unitaires RoundService
- ✅ 16 tests validation DTOs (Update + Complete)
- ✅ Mocks repositories avec isolation
- ✅ Tests autorisation et gestion d'erreurs
- ✅ Tests idempotence et edge cases

### Types de Tests

- **Happy path** : Modifications avec autorisations correctes
- **Business rules** : Validation états Game/Round
- **Authorization** : Owner, participant, utilisateur externe
- **Edge cases** : Round déjà complété, partie non démarrée

### Exécution

```bash
npm test -- --grep "RoundService|UpdateRoundScores|CompleteRound"
```

## 🔧 Utilisation

### Exemple - Mise à Jour Scores

```typescript
const roundService = container.resolve('RoundService')

const dto: UpdateRoundScoresDto = {
  gameId: '123',
  roundNumber: 2,
  playerScore: 15,
  opponentScore: 12,
  requestingUserId: 456, // Owner ou participant
}

try {
  const round = await roundService.updateRoundScores(dto)
  console.log(`Round ${round.roundNumber}: ${round.winner}`)
} catch (error) {
  if (error instanceof RoundAlreadyCompletedError) {
    // Gérer round déjà complété
  }
}
```

### Exemple - Complétion Round

```typescript
const completeDto: CompleteRoundDto = {
  gameId: '123',
  roundNumber: 2,
  requestingUserId: 456,
}

const completedRound = await roundService.completeRound(completeDto)
console.log(`Round complété: ${completedRound.isCompleted}`)
```

### Exemple - Liste Rounds

```typescript
const result = await roundService.listRounds('123', 456)
console.log(`${result.rounds.length} rounds trouvés`)

result.rounds.forEach((round) => {
  console.log(
    `Round ${round.roundNumber}: ${round.playerScore}-${round.opponentScore} (${round.winner})`
  )
})
```

## 🎯 Règles Métier

### Autorisation

- **Owner** : Créateur de la partie (Game.userId)
- **Participant** : Joueur présent dans la partie (Player.userId)
- **Externe** : Aucun accès

### États et Transitions

- **Game State** : `PLANNED` → `IN_PROGRESS` → `COMPLETED`
- **Round State** : `Non-complété` → `Complété` (irréversible)
- **Modification** : Seulement si Game IN_PROGRESS + Round non-complété

### Validation Scores

- **Type** : Entiers uniquement
- **Valeurs** : ≥ 0 (pas de scores négatifs)
- **Winner** : Calculé automatiquement même si non complété

## 🎨 Architecture Patterns

### Domain-Driven Design

- **Aggregate Root** : Game (contient Rounds)
- **Value Objects** : RoundId, RoundNumber, GameId
- **Domain Events** : RoundCompletedEvent
- **Repository Pattern** : CQRS Query/Command

### Hexagonal Architecture

- **Ports** : Interfaces Repository (Domain)
- **Adapters** : LucidRoundRepository (Infrastructure)
- **Application Service** : RoundService (orchestration)
- **DTOs** : Input/Output boundaries

### Error Handling

- **Domain Errors** : Types spécifiques avec codes
- **HTTP Mapping** : Error → Status Code automatique
- **Client-friendly** : Messages localisables

---

_Documentation générée pour l'issue #16 - Service hexagonal Round_
