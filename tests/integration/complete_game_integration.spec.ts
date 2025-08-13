import { test } from '@japa/runner'
import GameService, {
  CompleteGameData,
  CompleteGameResult,
} from '#application/services/game_service'
import LucidGameCommandRepository from '#infrastructure/repositories/lucid_game_command_repository'
import LucidGameQueryRepository from '#infrastructure/repositories/lucid_game_query_repository'
import LucidPlayerCommandRepository from '#infrastructure/repositories/lucid_player_command_repository'
import LucidPlayerQueryRepository from '#infrastructure/repositories/lucid_player_query_repository'
import LucidRoundCommandRepository from '#infrastructure/repositories/lucid_round_command_repository'
import LucidRoundQueryRepository from '#infrastructure/repositories/lucid_round_query_repository'
import LucidScoreCommandRepository from '#infrastructure/repositories/lucid_score_command_repository'
import LucidScoreQueryRepository from '#infrastructure/repositories/lucid_score_query_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import GameModel from '#models/game'
import PlayerModel from '#models/player'
import RoundModel from '#models/round'
import ScoreModel from '#models/score'
import UserModel from '#models/user'

/**
 * Complete Game Integration Tests
 *
 * Tests the complete chain: Application Service → Domain Entities → Infrastructure Repositories → Database
 *
 * Issue #13: Integration tests for complete "Partie" chain
 * - Create, read, modify complete game
 * - Use models, domain, and services together
 * - Test on both SQLite and PostgreSQL
 * - Validate complete mapping between domain, infrastructure, and database
 */
test.group('Complete Game Integration', (group) => {
  let gameService: GameService
  let gameRepository: LucidGameCommandRepository & LucidGameQueryRepository
  let playerRepository: LucidPlayerCommandRepository & LucidPlayerQueryRepository
  let roundRepository: LucidRoundCommandRepository & LucidRoundQueryRepository
  let scoreRepository: LucidScoreCommandRepository & LucidScoreQueryRepository
  let idGenerator: UuidV7IdGenerator

  group.setup(async () => {
    // Initialize all infrastructure components
    gameRepository = Object.assign(
      new LucidGameCommandRepository(),
      new LucidGameQueryRepository()
    )
    playerRepository = Object.assign(
      new LucidPlayerCommandRepository(),
      new LucidPlayerQueryRepository()
    )
    roundRepository = Object.assign(
      new LucidRoundCommandRepository(),
      new LucidRoundQueryRepository()
    )
    scoreRepository = Object.assign(
      new LucidScoreCommandRepository(),
      new LucidScoreQueryRepository()
    )
    idGenerator = new UuidV7IdGenerator()

    // Initialize application service with all dependencies
    gameService = new GameService(
      gameRepository,
      playerRepository,
      roundRepository,
      scoreRepository,
      idGenerator
    )
  })

  group.each.setup(async () => {
    // Clean database before each test to ensure isolation
    await ScoreModel.query().delete()
    await RoundModel.query().delete()
    await PlayerModel.query().delete()
    await GameModel.query().delete()
    await UserModel.query().where('email', 'like', '%@integration.test%').delete()

    // Create test users for integration tests
    await UserModel.createMany([
      {
        email: 'player1@integration.test',
        fullName: 'Integration Test Player 1',
        password: 'password123',
      },
      {
        email: 'player2@integration.test',
        fullName: 'Integration Test Player 2',
        password: 'password123',
      },
    ])
  })

  group.each.teardown(async () => {
    // Clean up after each test
    await ScoreModel.query().delete()
    await RoundModel.query().delete()
    await PlayerModel.query().delete()
    await GameModel.query().delete()
    await UserModel.query().where('email', 'like', '%@integration.test%').delete()
  })

  test('should create complete game with all entities through application service', async ({
    assert,
  }) => {
    // Arrange - Complete game data with all relationships
    const completeGameData: CompleteGameData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Secure and Control',
      players: [
        { pseudo: 'Imperial_Commander', userId: 1 },
        { pseudo: 'Chaos_Lord', userId: 2 },
        { pseudo: 'Guest_Warrior', userId: null }, // Guest player
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 15,
          opponentScore: 12,
          scores: [
            {
              playerId: '1', // Will be mapped to actual player
              scoreType: 'PRIMARY',
              scoreName: 'Control Objectives',
              scoreValue: 10,
            },
            {
              playerId: '1',
              scoreType: 'SECONDARY',
              scoreName: 'Linebreaker',
              scoreValue: 5,
            },
          ],
        },
        {
          roundNumber: 2,
          playerScore: 18,
          opponentScore: 14,
          scores: [
            {
              playerId: '2',
              scoreType: 'PRIMARY',
              scoreName: 'Hold Center',
              scoreValue: 8,
            },
            {
              playerId: '2',
              scoreType: 'BONUS',
              scoreName: 'First Blood',
              scoreValue: 6,
            },
          ],
        },
      ],
    }

    // Act - Create complete game through application service
    const result: CompleteGameResult = await gameService.createCompleteGame(completeGameData)

    // Assert - Verify complete game creation
    assert.isNotNull(result.game)
    assert.equal(result.players.length, 3)
    assert.equal(result.rounds.length, 2)
    assert.equal(result.scores.length, 4)

    // Verify game entity and domain logic
    assert.equal(result.game.userId, 1)
    assert.equal(result.game.gameType.value, 'MATCHED_PLAY')
    assert.equal(result.game.pointsLimit.value, 2000)
    assert.equal(result.game.status.value, 'COMPLETED')
    assert.equal(result.game.mission, 'Secure and Control')
    assert.equal(result.game.playerScore, 33) // 15 + 18
    assert.equal(result.game.opponentScore, 26) // 12 + 14

    // Verify players with different types
    const registeredPlayers = result.players.filter((p) => !p.isGuest)
    const guestPlayers = result.players.filter((p) => p.isGuest)
    assert.equal(registeredPlayers.length, 2)
    assert.equal(guestPlayers.length, 1)

    // Verify rounds are properly sequenced
    result.rounds.forEach((round, index) => {
      assert.equal(round.roundNumber.value, index + 1)
      assert.isTrue(round.isCompleted)
      assert.isTrue(round.gameId.equals(result.game.id))
    })

    // Verify scores are properly linked
    result.scores.forEach((score) => {
      const relatedRound = result.rounds.find((r) => r.id.equals(score.roundId))
      assert.isNotNull(relatedRound, 'Score should be linked to a round')

      const relatedPlayer = result.players.find((p) => p.id.equals(score.playerId))
      assert.isNotNull(relatedPlayer, 'Score should be linked to a player')
    })
  })

  test('should read complete game data through application service', async ({ assert }) => {
    // Arrange - Create a complete game first
    const completeGameData: CompleteGameData = {
      userId: 1,
      gameType: 'NARRATIVE',
      pointsLimit: 1500,
      mission: 'Recover the Relic',
      players: [
        { pseudo: 'Space_Marine_Captain', userId: 1 },
        { pseudo: 'Ork_Warboss', userId: null },
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 20,
          opponentScore: 15,
        },
      ],
    }

    const createdGame = await gameService.createCompleteGame(completeGameData)
    const gameId = createdGame.game.id

    // Act - Read complete game data
    const retrievedGame = await gameService.getCompleteGame(gameId)

    // Assert - Verify complete data retrieval
    assert.isNotNull(retrievedGame)
    assert.isTrue(retrievedGame!.game.id.equals(gameId))
    assert.equal(retrievedGame!.game.gameType.value, 'NARRATIVE')
    assert.equal(retrievedGame!.game.pointsLimit.value, 1500)
    assert.equal(retrievedGame!.game.mission, 'Recover the Relic')

    assert.equal(retrievedGame!.players.length, 2)
    assert.equal(retrievedGame!.rounds.length, 1)
    assert.equal(retrievedGame!.scores.length, 0) // No detailed scores in this test

    // Verify data consistency across layers
    assert.equal(retrievedGame!.game.playerScore, createdGame.game.playerScore)
    assert.equal(retrievedGame!.game.opponentScore, createdGame.game.opponentScore)
  })

  test('should modify existing game through application service', async ({ assert }) => {
    // Arrange - Create initial in-progress game without rounds
    const initialGameData: CompleteGameData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Priority Targets',
      players: [
        { pseudo: 'Tau_Commander', userId: 1 },
        { pseudo: 'Imperial_Guard', userId: 2 },
      ],
      // No initial rounds - game will be started but not completed
      rounds: [],
    }

    const createdGame = await gameService.createCompleteGame(initialGameData)
    const gameId = createdGame.game.id

    // Manually start the game to make it in-progress (since no rounds were provided)
    createdGame.game.start('Priority Targets')
    await gameRepository.save(createdGame.game)

    // Act - Add rounds to existing in-progress game
    const newRound = await gameService.addRoundToGame(gameId, 1, 18, 16)

    // Assert - Verify modification
    assert.equal(newRound.roundNumber.value, 1)
    assert.equal(newRound.playerScore, 18)
    assert.equal(newRound.opponentScore, 16)
    assert.isTrue(newRound.gameId.equals(gameId))

    // Verify game state after modification
    const modifiedGame = await gameService.getCompleteGame(gameId)
    assert.isNotNull(modifiedGame)
    assert.equal(modifiedGame!.rounds.length, 1)

    // Complete the game and verify final state
    const completedGame = await gameService.completeGame(gameId)
    assert.equal(completedGame.status.value, 'COMPLETED')
    assert.equal(completedGame.playerScore, 18) // Just the one round
    assert.equal(completedGame.opponentScore, 16) // Just the one round
  })

  test('should validate domain business rules through complete chain', async ({ assert }) => {
    // Arrange - Invalid game data to test domain validation
    const invalidGameData: CompleteGameData = {
      userId: -1, // Invalid user ID
      gameType: 'INVALID_TYPE', // Invalid game type
      pointsLimit: 0, // Invalid points limit
      players: [],
      rounds: [],
    }

    // Act & Assert - Should throw command/domain validation error
    await assert.rejects(
      () => gameService.createCompleteGame(invalidGameData),
      'User ID must be a positive integer'
    )
  })

  test('should handle database constraints and referential integrity', async ({ assert }) => {
    // Arrange - Create game with proper relationships
    const gameData: CompleteGameData = {
      userId: 1,
      gameType: 'OPEN_PLAY',
      pointsLimit: 1000,
      players: [{ pseudo: 'Test_Player', userId: 1 }],
    }

    const createdGame = await gameService.createCompleteGame(gameData)
    const gameId = createdGame.game.id

    // Act - Test cascade delete (application-level transaction)
    await gameService.deleteCompleteGame(gameId)

    // Assert - Verify complete cleanup
    const gameExists = await gameRepository.exists(gameId)
    assert.isFalse(gameExists)

    const players = await playerRepository.findByGameId(gameId)
    assert.equal(players.length, 0)

    const rounds = await roundRepository.findByGameId(gameId)
    assert.equal(rounds.length, 0)

    // Verify database-level cleanup
    const gameCount = await GameModel.query().where('id', gameId.value).count('* as total')
    const playerCount = await PlayerModel.query().where('game_id', gameId.value).count('* as total')
    const roundCount = await RoundModel.query().where('game_id', gameId.value).count('* as total')

    assert.equal(Number((gameCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((playerCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((roundCount[0] as any)?.total ?? 0), 0)
  })

  test('should maintain data consistency across all layers', async ({ assert }) => {
    // Arrange - Complex game with all entity types
    const complexGameData: CompleteGameData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Engage on All Fronts',
      players: [
        { pseudo: 'Necron_Overlord', userId: 1 },
        { pseudo: 'Eldar_Farseer', userId: 2 },
        { pseudo: 'Guest_Observer', userId: null },
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 25,
          opponentScore: 20,
          scores: [
            {
              playerId: '1',
              scoreType: 'PRIMARY',
              scoreName: 'Dominate Battlefield',
              scoreValue: 15,
            },
            { playerId: '1', scoreType: 'SECONDARY', scoreName: 'Assassinate', scoreValue: 10 },
            { playerId: '2', scoreType: 'PRIMARY', scoreName: 'Control Center', scoreValue: 12 },
            { playerId: '2', scoreType: 'BONUS', scoreName: 'Slay Warlord', scoreValue: 8 },
            { playerId: '3', scoreType: 'OBJECTIVE', scoreName: 'Observe Battle', scoreValue: 5 },
          ],
        },
        {
          roundNumber: 2,
          playerScore: 22,
          opponentScore: 18,
          scores: [
            { playerId: '1', scoreType: 'SECONDARY', scoreName: 'Linebreaker', scoreValue: 12 },
            { playerId: '2', scoreType: 'PRIMARY', scoreName: 'Hold Objectives', scoreValue: 10 },
            { playerId: '2', scoreType: 'PENALTY', scoreName: 'Late Deployment', scoreValue: -2 },
          ],
        },
      ],
    }

    // Act - Create complex game
    const result = await gameService.createCompleteGame(complexGameData)

    // Assert - Verify consistency across all layers

    // 1. Domain layer consistency
    assert.equal(result.game.playerScore, 47) // 25 + 22
    assert.equal(result.game.opponentScore, 38) // 20 + 18
    assert.equal(result.game.status.value, 'COMPLETED')

    // 2. Infrastructure layer consistency - verify database persistence
    const persistedGame = await GameModel.find(result.game.id.value)
    assert.isNotNull(persistedGame)
    assert.equal(persistedGame!.playerScore, 47)
    assert.equal(persistedGame!.opponentScore, 38)
    assert.equal(persistedGame!.status, 'COMPLETED')

    const persistedPlayers = await PlayerModel.query().where('game_id', result.game.id.value)
    assert.equal(persistedPlayers.length, 3)

    const persistedRounds = await RoundModel.query().where('game_id', result.game.id.value)
    assert.equal(persistedRounds.length, 2)

    const persistedScores = await ScoreModel.query().whereIn(
      'round_id',
      persistedRounds.map((r) => r.id)
    )
    assert.equal(persistedScores.length, 8) // 5 + 3 scores

    // 3. Cross-layer mapping consistency
    result.scores.forEach((domainScore) => {
      const persistedScore = persistedScores.find((ps) => ps.id === Number(domainScore.id.value))
      assert.isNotNull(persistedScore, `Score ${domainScore.id.value} should exist in database`)

      assert.equal(persistedScore!.typeScore, domainScore.scoreType.value)
      assert.equal(persistedScore!.nomScore, domainScore.scoreName.value)
      assert.equal(persistedScore!.valeurScore, domainScore.scoreValue.value)
    })

    // 4. Aggregate consistency
    result.rounds.forEach((domainRound) => {
      const persistedRound = persistedRounds.find((pr) => pr.id === domainRound.id.value)

      assert.isNotNull(persistedRound, `Round ${domainRound.id.value} should exist in database`)
      assert.equal(persistedRound!.playerScore, domainRound.playerScore)
      assert.equal(persistedRound!.opponentScore, domainRound.opponentScore)
      assert.equal(persistedRound!.isCompleted, domainRound.isCompleted)
    })

    // 5. Business rule consistency
    const winner = result.game.getWinner()
    assert.equal(winner, 'PLAYER') // Player won 47-38
  })

  test('should handle complex scenarios with edge cases', async ({ assert }) => {
    // Arrange - Edge case: Draw game with penalty scores
    const edgeCaseData: CompleteGameData = {
      userId: 1,
      gameType: 'NARRATIVE',
      pointsLimit: 500,
      mission: 'Last Stand',
      players: [
        { pseudo: 'Desperate_Defender', userId: 1 },
        { pseudo: 'Overwhelming_Attacker', userId: null },
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 15,
          opponentScore: 15, // Draw scenario
          scores: [
            { playerId: '1', scoreType: 'PRIMARY', scoreName: 'Survive', scoreValue: 20 },
            { playerId: '1', scoreType: 'PENALTY', scoreName: 'Heavy Losses', scoreValue: -5 },
            { playerId: '2', scoreType: 'PRIMARY', scoreName: 'Overwhelm', scoreValue: 18 },
            { playerId: '2', scoreType: 'PENALTY', scoreName: 'Collateral Damage', scoreValue: -3 },
          ],
        },
      ],
    }

    // Act
    const result = await gameService.createCompleteGame(edgeCaseData)

    // Assert - Verify edge case handling
    assert.equal(result.game.playerScore, result.game.opponentScore) // Draw
    assert.equal(result.game.getWinner(), 'DRAW')

    // Verify penalty scores are handled correctly
    const penaltyScores = result.scores.filter((s) => s.scoreValue.value < 0)
    assert.equal(penaltyScores.length, 2)

    penaltyScores.forEach((score) => {
      assert.equal(score.scoreType.value, 'PENALTY')
      assert.isTrue(score.scoreValue.isNegative())
    })

    // Verify domain events are properly generated
    result.game.clearDomainEvents() // Should not throw
    result.rounds.forEach((round) => {
      round.clearDomainEvents() // Should not throw
    })
  })

  test('should work with different game types and formats', async ({ assert }) => {
    const gameTypes = ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']
    const pointsLimits = [500, 1000, 1500, 2000, 3000]

    for (const gameType of gameTypes) {
      for (const pointsLimit of pointsLimits) {
        // Arrange
        const gameData: CompleteGameData = {
          userId: 1,
          gameType,
          pointsLimit,
          mission: `${gameType} at ${pointsLimit} points`,
          players: [
            { pseudo: `Player_${gameType}`, userId: 1 },
            { pseudo: `Opponent_${pointsLimit}`, userId: null },
          ],
          rounds: [
            {
              roundNumber: 1,
              playerScore: Math.floor(pointsLimit / 100), // Scale scores with points
              opponentScore: Math.floor(pointsLimit / 120),
            },
          ],
        }

        // Act
        const result = await gameService.createCompleteGame(gameData)

        // Assert - Verify all combinations work
        assert.equal(result.game.gameType.value, gameType)
        assert.equal(result.game.pointsLimit.value, pointsLimit)
        assert.equal(result.game.status.value, 'COMPLETED')

        // Clean up for next iteration
        await gameService.deleteCompleteGame(result.game.id)
      }
    }
  })
})
