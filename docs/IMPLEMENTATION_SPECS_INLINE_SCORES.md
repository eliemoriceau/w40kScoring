# Spécifications d'Implémentation : Édition Inline des Scores

## 🎯 Plan d'Implémentation

### Phase 1 : Backend - Création Automatique des 5 Rounds
**Durée estimée : 1-2 jours**

#### 1.1 Modifications Domain Layer

```typescript
// app/domain/entities/round.ts - Nouvelles méthodes

/**
 * Crée un round vide pour une nouvelle partie avec scores par défaut à 0
 */
static createEmpty(
  id: RoundId,
  gameId: GameId,
  roundNumber: RoundNumber
): Round {
  const round = new Round(id, gameId, roundNumber);
  // Scores par défaut à 0 comme spécifié
  round.playerScore = 0;
  round.opponentScore = 0;
  round.isCompleted = false;
  
  round.addDomainEvent(new RoundCreatedEvent(id, gameId, roundNumber));
  return round;
}

/**
 * Met à jour les scores d'un round (par défaut 0)
 */
updateScores(playerScore: number = 0, opponentScore: number = 0): void {
  if (this.isCompleted && (playerScore !== this.playerScore || opponentScore !== this.opponentScore)) {
    throw new RoundAlreadyCompletedError(this.id);
  }

  this.playerScore = playerScore;
  this.opponentScore = opponentScore;
  
  // Auto-complétion basée sur la validation des scores (pas sur undefined)
  this.isCompleted = this.validateScoresCompletion();
  
  this.addDomainEvent(new RoundScoresUpdatedEvent(this.id, playerScore, opponentScore));
}

/**
 * Valide si un round est considéré comme complété
 * Un round est complété quand les scores ont été modifiés manuellement
 */
private validateScoresCompletion(): boolean {
  // Logique métier pour déterminer si un round est complété
  // Par exemple, si au moins un score est différent de 0
  return this.playerScore > 0 || this.opponentScore > 0;
}
```

#### 1.2 Nouveaux Events

```typescript
// app/domain/events/round_created_event.ts
export class RoundCreatedEvent implements DomainEvent {
  constructor(
    public readonly roundId: RoundId,
    public readonly gameId: GameId,
    public readonly roundNumber: RoundNumber,
    public readonly occurredAt: Date = new Date()
  ) {}
}

// app/domain/events/round_scores_updated_event.ts
export class RoundScoresUpdatedEvent implements DomainEvent {
  constructor(
    public readonly roundId: RoundId,
    public readonly playerScore: number = 0,
    public readonly opponentScore: number = 0,
    public readonly occurredAt: Date = new Date()
  ) {}
}

// app/domain/events/secondary_score_updated_event.ts
export class SecondaryScoreUpdatedEvent implements DomainEvent {
  constructor(
    public readonly roundId: RoundId,
    public readonly playerId: PlayerId,
    public readonly secondaryScore1: number = 0,
    public readonly secondaryScore2: number = 0,
    public readonly occurredAt: Date = new Date()
  ) {}
}
```

#### 1.3 Service Layer - GameService

```typescript
// app/application/services/game_service.ts - Nouvelles méthodes

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

/**
 * Met à jour le score d'un round spécifique
 */
async updateRoundScore(command: UpdateRoundScoreCommand): Promise<Round> {
  // 1. Récupérer le round
  const round = await this.roundRepository.findById(command.roundId);
  if (!round) {
    throw new RoundNotFoundError(command.roundId);
  }

  // 2. Vérifier que le round appartient à la bonne partie
  if (!round.gameId.equals(command.gameId)) {
    throw new UnauthorizedRoundAccessError(command.roundId, command.gameId);
  }

  // 3. Récupérer les scores actuels (défaut 0)
  const currentPlayerScore = round.playerScore ?? 0;
  const currentOpponentScore = round.opponentScore ?? 0;

  // 4. Déterminer quel score mettre à jour
  const isMainPlayer = await this.isMainPlayer(command.gameId, command.playerId);
  
  const newPlayerScore = isMainPlayer ? command.score : currentPlayerScore;
  const newOpponentScore = isMainPlayer ? currentOpponentScore : command.score;

  // 5. Mettre à jour les scores (garantis non-undefined)
  round.updateScores(newPlayerScore, newOpponentScore);

  // 6. Sauvegarder
  return await this.roundRepository.save(round);
}

/**
 * Met à jour les scores secondaires d'un round
 */
async updateSecondaryScores(command: UpdateSecondaryScoreCommand): Promise<void> {
  // 1. Valider que le round existe et appartient à la partie
  const round = await this.roundRepository.findById(command.roundId);
  if (!round || !round.gameId.equals(command.gameId)) {
    throw new RoundNotFoundError(command.roundId);
  }

  // 2. Mettre à jour les scores secondaires (2 par round comme spécifié)
  const secondaryScore = await this.secondaryScoreRepository.findByRoundAndPlayer(
    command.roundId, 
    command.playerId
  ) || new SecondaryScore(command.roundId, command.playerId);

  secondaryScore.updateScores(command.score1, command.score2);

  // 3. Sauvegarder
  await this.secondaryScoreRepository.save(secondaryScore);
}

/**
 * Vérifie si un joueur est le joueur principal de la partie
 */
private async isMainPlayer(gameId: GameId, playerId: PlayerId): Promise<boolean> {
  const game = await this.gameRepository.findById(gameId);
  if (!game) {
    throw new GameNotFoundError(gameId);
  }
  
  const players = await this.playerRepository.findByGameId(gameId);
  const mainPlayer = players.find(p => p.userId === game.userId);
  
  return mainPlayer?.id.equals(playerId) ?? false;
}
```

#### 1.4 DTOs et Commands

```typescript
// app/application/dto/update_round_score_dto.ts
export interface UpdateRoundScoreDto {
  gameId: number;
  roundId: number;
  playerId: number;
  score: number;
}

// app/application/commands/update_round_score_command.ts
export class UpdateRoundScoreCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly roundId: RoundId,
    public readonly playerId: PlayerId,
    public readonly score: number
  ) {
    if (score < 0 || score > 50) {
      throw new Error('Score must be between 0 and 50');
    }
  }
}

// app/application/commands/update_secondary_score_command.ts
export class UpdateSecondaryScoreCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly roundId: RoundId,
    public readonly playerId: PlayerId,
    public readonly score1: number = 0,
    public readonly score2: number = 0
  ) {
    // Validation des scores secondaires (0-15 chacun)
    if (score1 < 0 || score1 > 15) {
      throw new Error('Secondary score 1 must be between 0 and 15');
    }
    if (score2 < 0 || score2 > 15) {
      throw new Error('Secondary score 2 must be between 0 and 15');
    }
  }
}
```

#### 1.5 Controller

```typescript
// app/controllers/parties_controller.ts - Nouveau endpoint

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
    
    // Vérifier l'accès à la partie
    const hasAccess = await this.gameService.userHasAccessToGame(gameId, user.id);
    if (!hasAccess) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'Vous n\'avez pas accès à cette partie'
      });
    }

    // Mettre à jour le score
    const command = new UpdateRoundScoreCommand(
      gameId, 
      roundId, 
      new PlayerId(playerId), 
      score
    );
    
    const updatedRound = await this.gameService.updateRoundScore(command);

    return response.json({
      success: true,
      round: {
        id: updatedRound.id.value,
        roundNumber: updatedRound.roundNumber.value,
        playerScore: updatedRound.playerScore,
        opponentScore: updatedRound.opponentScore,
        isCompleted: updatedRound.isCompleted,
        gameId: updatedRound.gameId.value,
      },
    });
    
  } catch (error) {
    logger.error('Round score update failed', {
      error: error.message,
      gameId: params.gameId,
      roundId: params.roundId,
      userId: auth.user?.id,
    });

    if (error instanceof ValidationError) {
      return response.status(422).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    return response.status(500).json({
      error: 'Internal error',
      message: 'Erreur lors de la mise à jour du score'
    });
  }
}
```

#### 1.6 Validators

```typescript
// app/validators/update_round_score_validator.ts
import vine from '@vinejs/vine'

export const updateRoundScoreValidator = vine.compile(
  vine.object({
    playerId: vine.number().positive(),
    score: vine.number().min(0).max(50),
  })
)
```

#### 1.7 Routes

```typescript
// start/routes.ts - Nouvelle route
router
  .group(() => {
    // ... routes existantes ...
    
    router.put('/parties/:gameId/rounds/:roundId/score', [PartiesController, 'updateRoundScore'])
      .as('parties.rounds.update_score')
  })
  .middleware([middleware.auth()])
```

### Phase 2 : Frontend - Composants d'Édition Inline
**Durée estimée : 2-3 jours**

#### 2.1 Composant ScoreCell.vue

```vue
<!-- inertia/pages/parties/components/ScoreCell.vue -->
<template>
  <div :class="cellClasses" @click="startEditing">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="score-display">
      <span class="score-value">{{ displayScore }}</span>
      <EditIcon v-if="showEditIcon" class="edit-icon" />
    </div>
    
    <!-- Mode édition -->
    <div v-else class="score-edit">
      <input
        ref="scoreInput"
        v-model.number="editValue"
        :min="0"
        :max="50"
        type="number"
        class="score-input"
        @blur="saveScore"
        @keyup.enter="saveScore"
        @keyup.escape="cancelEdit"
        @keyup.arrow-up="incrementScore"
        @keyup.arrow-down="decrementScore"
      />
      <div class="edit-actions">
        <button @click="saveScore" class="save-btn">✓</button>
        <button @click="cancelEdit" class="cancel-btn">✕</button>
      </div>
    </div>
    
    <LoadingSpinner v-if="isSaving" class="saving-indicator" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

// ... implémentation détaillée dans TECHNICAL_ARCHITECTURE_INLINE_SCORES.md
</script>
```

#### 2.2 Composant RoundRow.vue

```vue
<!-- inertia/pages/parties/components/RoundRow.vue -->
<template>
  <div :class="roundClasses">
    <div class="round-header">
      <span class="round-number">Round {{ round.roundNumber }}</span>
      <RoundStatus :round="round" :is-current="isCurrent" />
    </div>
    
    <div class="scores-grid">
      <div class="player-column" v-for="player in players" :key="player.id">
        <div class="player-name">{{ player.pseudo }}</div>
        <ScoreCell
          :round="round"
          :player="player"
          :game-id="gameId"
          :editable="canEdit"
          :current="isCurrent"
          @score-updated="$emit('score-updated', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... implémentation
</script>
```

#### 2.3 Modification de show.vue

```vue
<!-- inertia/pages/parties/show.vue - Remplacement de la section scores -->
<template>
  <!-- ... header existant ... -->
  
  <!-- Nouvelle section scores avec édition inline -->
  <GameScoreBoard
    :game="game"
    :players="players"
    :rounds="rounds"
    :secondary-scores="secondaryScores"
    :can-edit="meta.canEdit"
    class="mb-8"
  />
  
  <!-- ... reste de la page ... -->
</template>

<script setup lang="ts">
import GameScoreBoard from './components/GameScoreBoard.vue'
// ... autres imports
</script>
```

### Phase 3 : Tests et Validations
**Durée estimée : 1 jour**

#### 3.1 Tests Backend

```typescript
// tests/unit/domain/entities/round.spec.ts
describe('Round Entity - Empty Creation', () => {
  test('createEmpty creates round with undefined scores', () => {
    const round = Round.createEmpty(
      new RoundId(1),
      new GameId(1),
      new RoundNumber(1)
    )
    
    expect(round.playerScore).toBeUndefined()
    expect(round.opponentScore).toBeUndefined()
    expect(round.isCompleted).toBe(false)
  })
  
  test('updateScores marks round as completed when both scores present', () => {
    const round = Round.createEmpty(/* ... */)
    
    round.updateScores(15, 12)
    
    expect(round.isCompleted).toBe(true)
    expect(round.playerScore).toBe(15)
    expect(round.opponentScore).toBe(12)
  })
})

// tests/functional/parties_score_update.spec.ts
test('PUT /parties/:id/rounds/:roundId/score updates score', async ({ client }) => {
  const game = await GameFactory.createWithEmptyRounds()
  const round = game.rounds[0]
  const player = game.players[0]
  
  const response = await client
    .put(`/parties/${game.id}/rounds/${round.id}/score`)
    .json({ playerId: player.id, score: 15 })
    .loginAs(game.user)
  
  response.assertStatus(200)
  response.assertBodyContains({
    success: true,
    round: {
      id: round.id,
      playerScore: 15,
      isCompleted: false
    }
  })
})
```

#### 3.2 Tests Frontend

```typescript
// tests/vue/ScoreCell.spec.ts
describe('ScoreCell Component', () => {
  test('enters edit mode on click when editable', async () => {
    const wrapper = mount(ScoreCell, {
      props: { 
        round: mockRound, 
        player: mockPlayer, 
        editable: true 
      }
    })
    
    await wrapper.find('.score-cell').trigger('click')
    
    expect(wrapper.find('.score-input')).toExist()
    expect(wrapper.emitted('editing-started')).toBeTruthy()
  })
  
  test('emits score-updated when saving valid score', async () => {
    const wrapper = mount(ScoreCell, { /* ... */ })
    
    await wrapper.find('.score-cell').trigger('click')
    await wrapper.find('.score-input').setValue(25)
    await wrapper.find('.save-btn').trigger('click')
    
    expect(wrapper.emitted('score-updated')).toEqual([[{
      roundId: mockRound.id,
      playerId: mockPlayer.id,
      score: 25
    }]])
  })
})
```

### Phase 4 : Déploiement et Migration
**Durée estimée : 0.5 jour**

#### 4.1 Script de Migration

```sql
-- database/migrations/add_empty_rounds_to_existing_games.sql
INSERT INTO rounds (game_id, round_number, is_completed, created_at, updated_at)
SELECT 
  g.id as game_id,
  numbers.round_number,
  false as is_completed,
  NOW() as created_at,
  NOW() as updated_at
FROM games g
CROSS JOIN (
  SELECT 1 as round_number UNION
  SELECT 2 UNION 
  SELECT 3 UNION 
  SELECT 4 UNION 
  SELECT 5
) numbers
WHERE NOT EXISTS (
  SELECT 1 FROM rounds r 
  WHERE r.game_id = g.id 
  AND r.round_number = numbers.round_number
);
```

#### 4.2 Feature Flag

```typescript
// config/features.ts
export const FEATURES = {
  INLINE_SCORE_EDITING: env.get('FEATURE_INLINE_SCORES', false),
  AUTO_CREATE_ROUNDS: env.get('FEATURE_AUTO_ROUNDS', false),
}

// Dans le controller
if (!FEATURES.AUTO_CREATE_ROUNDS) {
  // Ancienne logique
  return this.createGameWithoutRounds(data)
}
```

## 📊 Métriques de Réussite

### Critères d'Acceptance

1. **✅ Création automatique**
   - Chaque nouvelle partie a exactement 5 rounds vides
   - Les rounds sont numérotés de 1 à 5
   - `isCompleted = false` pour tous les rounds initiaux

2. **✅ Édition inline**
   - Click sur un score déclenche le mode édition
   - Input numérique avec validation (0-50)
   - Sauvegarde sur Enter/Blur
   - Annulation sur Escape

3. **✅ UX optimisée**
   - Feedback visuel instantané
   - États visuels clairs (vide, en cours, complété)
   - Navigation clavier fonctionnelle
   - Indicateurs de chargement

4. **✅ Performance**
   - Mise à jour optimiste de l'UI
   - Temps de réponse API < 200ms
   - Pas de re-render complet de la page

### Tests de Performance

```typescript
// Performance benchmarks
describe('Score Update Performance', () => {
  test('API response time < 200ms', async () => {
    const start = Date.now()
    await updateScore(gameId, roundId, playerId, score)
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(200)
  })
  
  test('UI update < 50ms', async () => {
    const start = performance.now()
    await scoreCell.updateLocalState(newScore)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(50)
  })
})
```

## 🚀 Rollout Plan

### Étape 1 : Développement (1 semaine)
- Phase 1-3 en parallèle sur branches features
- Tests unitaires et fonctionnels
- Review de code

### Étape 2 : Staging (2 jours)
- Déploiement sur environnement de test
- Tests end-to-end
- Validation UX/UI

### Étape 3 : Production (1 jour)
- Feature flag activé à 10% des utilisateurs
- Monitoring des métriques
- Rollout progressif à 100%

### Étape 4 : Nettoyage (1 jour)
- Suppression de l'ancien code
- Documentation mise à jour
- Retrospective équipe

**Durée totale estimée : 7-10 jours**

## 🔧 Configuration Développement

### Variables d'Environnement

```bash
# .env.development
FEATURE_INLINE_SCORES=true
FEATURE_AUTO_ROUNDS=true

# .env.production
FEATURE_INLINE_SCORES=false  # Initialement
FEATURE_AUTO_ROUNDS=false    # Initialement
```

### Scripts NPM

```json
{
  "scripts": {
    "test:scores": "npm test -- --grep 'Score.*'",
    "test:rounds": "npm test -- --grep 'Round.*'",
    "migrate:add-rounds": "node ace migration:run --name add_empty_rounds"
  }
}
```

Cette spécification garantit une implémentation méthodique et sûre de la fonctionnalité d'édition inline des scores avec création automatique des 5 rounds.