# Architecture : Création Automatique des 5 Rounds

## 🎯 Objectif

Modifier l'architecture pour que **chaque nouvelle partie génère automatiquement 5 rounds vides** dès sa création, permettant une édition inline immédiate.

## 🏗️ Modifications Architecturales

### 1. Service Layer - GameService

#### Modification de `createCompleteGame`

```typescript
// app/application/services/game_service.ts

async createCompleteGame(data: CompleteGameData): Promise<CompleteGameResult> {
  // ... création de la partie et des joueurs existante ...
  
  // NOUVEAU : Créer automatiquement 5 rounds vides
  const rounds = await this.createInitialRounds(savedGame.id);
  
  return {
    game: savedGame,
    players: savedPlayers,
    rounds, // Inclure les rounds créés
  };
}

/**
 * Crée automatiquement 5 rounds vides pour une nouvelle partie
 */
private async createInitialRounds(gameId: GameId): Promise<Round[]> {
  const rounds: Round[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const roundId = this.idGenerator.generateRoundId();
    const round = Round.createEmpty(
      roundId,
      gameId,
      new RoundNumber(i)
    );
    
    const savedRound = await this.roundRepository.save(round);
    rounds.push(savedRound);
  }
  
  return rounds;
}
```

### 2. Domain Layer - Round Entity

#### Nouvelle méthode `createEmpty`

```typescript
// app/domain/entities/round.ts

export default class Round extends AggregateRoot {
  // ... propriétés existantes ...

  /**
   * Crée un round vide pour une nouvelle partie
   */
  static createEmpty(
    id: RoundId,
    gameId: GameId,
    roundNumber: RoundNumber
  ): Round {
    const round = new Round(id, gameId, roundNumber);
    
    // Les scores restent undefined pour un round vide
    round.playerScore = undefined;
    round.opponentScore = undefined;
    round.isCompleted = false;
    
    // Événement de création
    round.addDomainEvent(new RoundCreatedEvent(id, gameId, roundNumber));
    
    return round;
  }

  /**
   * Met à jour les scores d'un round vide
   */
  updateScores(playerScore?: number, opponentScore?: number): void {
    if (this.isCompleted) {
      throw new RoundAlreadyCompletedError(this.id);
    }

    this.playerScore = playerScore;
    this.opponentScore = opponentScore;
    
    // Marquer comme complété si les deux scores sont renseignés
    if (playerScore !== undefined && opponentScore !== undefined) {
      this.isCompleted = true;
      this.addDomainEvent(new RoundCompletedEvent(this.id, this.gameId));
    }

    this.addDomainEvent(new RoundScoresUpdatedEvent(this.id, playerScore, opponentScore));
  }
}
```

### 3. Application Layer - Nouveaux DTOs

#### UpdateRoundScoreDto

```typescript
// app/application/dto/update_round_score_dto.ts

export interface UpdateRoundScoreDto {
  gameId: number;
  roundId: number;
  playerId: number;
  score: number;
}

export class UpdateRoundScoreCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly roundId: RoundId,
    public readonly playerId: PlayerId,
    public readonly score: number
  ) {
    // Validation
    if (score < 0 || score > 50) {
      throw new Error('Score must be between 0 and 50');
    }
  }
}
```

### 4. Controller Layer - Nouveau endpoint

#### PartiesController - updateRoundScore

```typescript
// app/controllers/parties_controller.ts

/**
 * Met à jour le score d'un round spécifique
 * PUT /parties/:gameId/rounds/:roundId/score
 */
async updateRoundScore({ params, request, response, auth }: HttpContext) {
  try {
    const user = auth.getUserOrFail();
    
    // Validation des paramètres
    const gameId = new GameId(Number(params.gameId));
    const roundId = new RoundId(Number(params.roundId));
    
    // Validation du body
    const { playerId, score } = await request.validateUsing(updateRoundScoreValidator);
    
    // Vérifier que l'utilisateur a accès à cette partie
    const hasAccess = await this.gameService.userHasAccessToGame(gameId, user.id);
    if (!hasAccess) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'Vous n\'avez pas accès à cette partie'
      });
    }

    // Mettre à jour le score
    const command = new UpdateRoundScoreCommand(gameId, roundId, new PlayerId(playerId), score);
    const updatedRound = await this.gameService.updateRoundScore(command);

    return response.json({
      success: true,
      round: RoundMapper.toDto(updatedRound),
    });
    
  } catch (error) {
    logger.error('Round score update failed', {
      error: error.message,
      gameId: params.gameId,
      roundId: params.roundId,
      userId: auth.user?.id,
    });

    return response.status(500).json({
      error: 'Internal error',
      message: 'Erreur lors de la mise à jour du score'
    });
  }
}
```

## 🔄 Flux de Données

### 1. Création de Partie

```
Wizard → PartiesController.store() 
      → GameService.createCompleteGame()
      → GameService.createInitialRounds() 
      → 5 x Round.createEmpty()
      → Database persistence
      → Redirect to /parties/:id (avec 5 rounds vides)
```

### 2. Mise à Jour de Score

```
Frontend click → PUT /parties/:gameId/rounds/:roundId/score
               → PartiesController.updateRoundScore()
               → GameService.updateRoundScore()
               → Round.updateScores()
               → Database update
               → JSON response avec round mis à jour
```

## 🗄️ Base de Données

### Modifications Schema

Aucune modification de schéma nécessaire. Les rounds existants avec `playerScore` et `opponentScore` NULL représentent les rounds vides.

### Queries Optimisées

```sql
-- Récupérer une partie avec tous ses rounds (vides et complétés)
SELECT 
  g.*,
  r.id as round_id,
  r.round_number,
  r.player_score,
  r.opponent_score,
  r.is_completed
FROM games g
LEFT JOIN rounds r ON g.id = r.game_id
WHERE g.id = ? 
ORDER BY r.round_number;

-- Mettre à jour un score de round spécifique
UPDATE rounds 
SET 
  player_score = CASE WHEN ? = 'player' THEN ? ELSE player_score END,
  opponent_score = CASE WHEN ? = 'opponent' THEN ? ELSE opponent_score END,
  is_completed = (player_score IS NOT NULL AND opponent_score IS NOT NULL),
  updated_at = NOW()
WHERE id = ? AND game_id = ?;
```

## 🎮 Frontend Integration

### Modifications Vue.js

```typescript
// inertia/pages/parties/show.vue - Gestion des rounds vides

interface Round {
  id: number;
  roundNumber: number;
  playerScore?: number;
  opponentScore?: number;
  isCompleted: boolean;
  isEmpty: boolean; // Calculé côté frontend
}

// Computed pour identifier les rounds vides
const roundsWithStatus = computed(() => {
  return props.rounds.map(round => ({
    ...round,
    isEmpty: round.playerScore === null && round.opponentScore === null,
    isPartial: (round.playerScore === null) !== (round.opponentScore === null)
  }));
});

// Méthode de mise à jour optimisée
const updateRoundScore = async (roundId: number, playerId: number, score: number) => {
  try {
    const response = await router.put(`/parties/${props.game.id}/rounds/${roundId}/score`, {
      playerId,
      score
    });
    
    // Mise à jour optimiste de l'état local
    updateLocalRoundScore(roundId, playerId, score);
    
  } catch (error) {
    // Rollback en cas d'erreur
    revertLocalRoundScore(roundId, playerId);
  }
};
```

## 🚦 Tests

### Tests Unitaires

```typescript
describe('Game Service - Initial Rounds Creation', () => {
  it('should create 5 empty rounds when creating a new game', async () => {
    const gameData = createTestGameData();
    const result = await gameService.createCompleteGame(gameData);
    
    expect(result.rounds).toHaveLength(5);
    expect(result.rounds[0].roundNumber.value).toBe(1);
    expect(result.rounds[4].roundNumber.value).toBe(5);
    expect(result.rounds.every(r => !r.isCompleted)).toBe(true);
  });
});

describe('Round Entity - Empty Round Creation', () => {
  it('should create an empty round with undefined scores', () => {
    const round = Round.createEmpty(roundId, gameId, new RoundNumber(1));
    
    expect(round.playerScore).toBeUndefined();
    expect(round.opponentScore).toBeUndefined();
    expect(round.isCompleted).toBe(false);
  });
});
```

### Tests d'Intégration

```typescript
describe('Parties Controller - Round Score Update', () => {
  it('should update round score and mark as completed when both scores present', async () => {
    // Créer une partie avec 5 rounds vides
    const game = await createTestGame();
    const round = game.rounds[0];
    
    // Mettre à jour le score du joueur 1
    await request(app)
      .put(`/parties/${game.id}/rounds/${round.id}/score`)
      .send({ playerId: player1.id, score: 15 })
      .expect(200);
    
    // Mettre à jour le score du joueur 2
    await request(app)
      .put(`/parties/${game.id}/rounds/${round.id}/score`)
      .send({ playerId: player2.id, score: 12 })
      .expect(200);
    
    // Vérifier que le round est complété
    const updatedRound = await roundRepository.findById(round.id);
    expect(updatedRound.isCompleted).toBe(true);
  });
});
```

## 📋 Migration Strategy

### 1. Parties Existantes
- Script de migration pour créer les rounds manquants
- Backward compatibility maintenue

### 2. Déploiement
- Feature flag pour activer progressivement
- Rollback plan si nécessaire

```sql
-- Script de migration pour parties existantes
INSERT INTO rounds (game_id, round_number, is_completed, created_at, updated_at)
SELECT 
  g.id,
  generate_series(1, 5) as round_number,
  false,
  NOW(),
  NOW()
FROM games g
WHERE NOT EXISTS (
  SELECT 1 FROM rounds r 
  WHERE r.game_id = g.id 
  AND r.round_number = generate_series(1, 5)
);
```