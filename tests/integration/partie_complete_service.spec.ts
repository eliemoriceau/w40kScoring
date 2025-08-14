/**
 * Tests d'Intégration - PartieCompleteService
 *
 * Tests pour l'orchestration transactionnelle de création partie complète
 * Issue #18 - Orchestration 'création Partie complète'
 *
 * Architecture hexagonale : Tests intégration application layer avec infrastructure
 */

import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import PartieCompleteService from '#application/services/partie_complete_service'
import GameService from '#application/services/game_service'
import JoueurService from '#application/services/joueur_service'
import RoundService from '#application/services/round_service'
import ScoreService from '#application/services/score_service'
import { TransactionService } from '#infrastructure/services/transaction_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import LucidScoreRepository from '#infrastructure/repositories/lucid_score_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import GameModel from '#models/game'
import PlayerModel from '#models/player'
import RoundModel from '#models/round'
import ScoreModel from '#models/score'
import UserModel from '#models/user'

/**
 * Test Group : Partie Complete Service Integration Tests
 *
 * Validation complète de l'orchestration transactionnelle :
 * - Happy path avec création complète
 * - Scénarios d'erreur avec rollback
 * - Validation cross-services
 * - Performance et timeout
 */
test.group('Partie Complete Service - Integration Tests', (group) => {
  let partieCompleteService: PartieCompleteService
  let gameService: GameService
  let joueurService: JoueurService
  let roundService: RoundService
  let scoreService: ScoreService
  let transactionService: TransactionService

  // Repositories
  let gameRepository: LucidGameRepository
  let playerRepository: LucidPlayerRepository
  let roundRepository: LucidRoundRepository
  let scoreRepository: LucidScoreRepository
  let idGenerator: UuidV7IdGenerator

  group.setup(async () => {
    // Initialisation des repositories et services
    gameRepository = new LucidGameRepository()
    playerRepository = new LucidPlayerRepository()
    roundRepository = new LucidRoundRepository()
    scoreRepository = new LucidScoreRepository()
    idGenerator = new UuidV7IdGenerator()
    transactionService = new TransactionService()

    // Initialisation des services métier
    gameService = new GameService(
      gameRepository,
      playerRepository,
      roundRepository,
      scoreRepository,
      idGenerator
    )

    joueurService = new JoueurService(
      playerRepository,
      gameRepository,
      idGenerator as any // Cast pour compatibilité ExtendedIdGenerator
    )

    roundService = new RoundService(roundRepository, gameRepository, playerRepository)

    scoreService = new ScoreService(
      scoreRepository,
      gameRepository,
      roundRepository,
      playerRepository,
      idGenerator
    )

    // Initialisation du service d'orchestration
    partieCompleteService = new PartieCompleteService(
      gameService,
      joueurService,
      roundService,
      scoreService,
      roundRepository,
      transactionService
    )
  })

  group.each.setup(async () => {
    // Clean database avant chaque test
    await ScoreModel.query().delete()
    await RoundModel.query().delete()
    await PlayerModel.query().delete()
    await GameModel.query().delete()
    await UserModel.query().where('email', 'like', '%@test.orchestration%').delete()

    // Créer utilisateurs de test
    await UserModel.createMany([
      {
        username: 'user1_orchestration',
        email: 'user1@test.orchestration',
        fullName: 'Test User 1',
        password: 'password123',
        roleId: 1,
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'user2_orchestration',
        email: 'user2@test.orchestration',
        fullName: 'Test User 2',
        password: 'password123',
        roleId: 1,
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
    ])
  })

  group.each.teardown(async () => {
    // Clean up après chaque test
    await ScoreModel.query().delete()
    await RoundModel.query().delete()
    await PlayerModel.query().delete()
    await GameModel.query().delete()
    await UserModel.query().where('email', 'like', '%@test.orchestration%').delete()
  })

  /**
   * Test 1 : Happy Path - Création complète avec transaction
   */
  test('should create complete partie with all entities in transaction', async ({ assert }) => {
    // Arrange
    const completePartieData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Secure and Control',
      players: [
        { pseudo: 'Imperial_Commander', userId: 1 },
        { pseudo: 'Chaos_Lord', userId: 2 },
        { pseudo: 'Guest_Warrior', userId: null },
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 15,
          opponentScore: 12,
          scores: [
            {
              playerId: '1',
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
          ],
        },
      ],
      requestingUserId: 1,
    }

    // Act
    const result = await partieCompleteService.createPartieComplete(completePartieData)

    // Assert - Vérification du résultat
    assert.isNotNull(result)
    assert.equal(result.players.length, 3)
    assert.equal(result.rounds.length, 2)
    assert.equal(result.scores.length, 3)
    assert.equal(result.summary.totalPlayerScore, 33) // 15 + 18
    assert.equal(result.summary.totalOpponentScore, 26) // 12 + 14
    assert.equal(result.summary.status, 'COMPLETED')

    // Assert - Vérification en base de données
    const gameInDb = await GameModel.find(result.partieId)
    assert.isNotNull(gameInDb)
    assert.equal(gameInDb!.gameType, 'MATCHED_PLAY')
    assert.equal(gameInDb!.pointsLimit, 2000)

    const playersInDb = await PlayerModel.query().where('game_id', result.partieId)
    assert.equal(playersInDb.length, 3)

    const roundsInDb = await RoundModel.query().where('game_id', result.partieId)
    assert.equal(roundsInDb.length, 2)

    const scoresInDb = await ScoreModel.query().whereIn(
      'round_id',
      roundsInDb.map((r) => r.id)
    )
    assert.equal(scoresInDb.length, 3)
  })

  /**
   * Test 2 : Validation DTO avec erreur
   */
  test('should throw PartieCompleteValidationError for invalid DTO', async ({ assert }) => {
    // Arrange - DTO invalide
    const invalidData = {
      userId: -1, // Invalid
      gameType: 'INVALID_TYPE', // Invalid
      pointsLimit: 0, // Invalid
      players: [], // Invalid - pas de joueurs
      requestingUserId: 1,
    }

    // Act & Assert
    await assert.rejects(
      () => partieCompleteService.createPartieComplete(invalidData),
      'User ID must be a positive integer'
    )
  })

  /**
   * Test 3 : Rollback sur échec création joueur
   */
  test('should rollback on player creation failure', async ({ assert }) => {
    // Arrange - Données avec pseudo en conflit
    const conflictData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      players: [
        { pseudo: 'ValidPlayer', userId: 1 },
        { pseudo: 'ValidPlayer', userId: 2 }, // Conflit de pseudo
      ],
      requestingUserId: 1,
    }

    // Act & Assert
    await assert.rejects(
      () => partieCompleteService.createPartieComplete(conflictData),
      'Duplicate pseudo: ValidPlayer'
    )

    // Assert - Vérification qu'aucune donnée n'a été créée (rollback)
    const gamesCount = await GameModel.query().count('* as total')
    const playersCount = await PlayerModel.query().count('* as total')

    assert.equal(Number((gamesCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((playersCount[0] as any)?.total ?? 0), 0)
  })

  /**
   * Test 4 : Rollback sur échec création round
   */
  test('should rollback on round creation failure', async ({ assert }) => {
    // Arrange - Données avec rounds invalides
    const invalidRoundsData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      players: [
        { pseudo: 'Player1', userId: 1 },
        { pseudo: 'Player2', userId: 2 },
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 15,
          opponentScore: 12,
        },
        {
          roundNumber: 1, // Duplicate round number
          playerScore: 10,
          opponentScore: 8,
        },
      ],
      requestingUserId: 1,
    }

    // Act & Assert
    await assert.rejects(
      () => partieCompleteService.createPartieComplete(invalidRoundsData),
      'Duplicate round number: 1'
    )

    // Assert - Vérification du rollback complet
    const gamesCount = await GameModel.query().count('* as total')
    const playersCount = await PlayerModel.query().count('* as total')
    const roundsCount = await RoundModel.query().count('* as total')

    assert.equal(Number((gamesCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((playersCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((roundsCount[0] as any)?.total ?? 0), 0)
  })

  /**
   * Test 5 : Rollback sur échec création score
   */
  test('should rollback on score creation failure', async ({ assert }) => {
    // Arrange - Données avec scores invalides
    const invalidScoresData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      players: [{ pseudo: 'Player1', userId: 1 }],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 15,
          opponentScore: 12,
          scores: [
            {
              playerId: '1',
              scoreType: 'PRIMARY',
              scoreName: 'Valid Score',
              scoreValue: 10,
            },
            {
              playerId: '99', // Joueur inexistant
              scoreType: 'PRIMARY',
              scoreName: 'Invalid Score',
              scoreValue: 5,
            },
          ],
        },
      ],
      requestingUserId: 1,
    }

    // Act & Assert
    await assert.rejects(
      () => partieCompleteService.createPartieComplete(invalidScoresData),
      'Round 1, Score 2: Invalid player ID (must be 1-1)'
    )

    // Assert - Vérification du rollback complet
    const gamesCount = await GameModel.query().count('* as total')
    const playersCount = await PlayerModel.query().count('* as total')
    const roundsCount = await RoundModel.query().count('* as total')
    const scoresCount = await ScoreModel.query().count('* as total')

    assert.equal(Number((gamesCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((playersCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((roundsCount[0] as any)?.total ?? 0), 0)
    assert.equal(Number((scoresCount[0] as any)?.total ?? 0), 0)
  })

  /**
   * Test 6 : Création partie sans rounds (partie planifiée)
   */
  test('should create partie without rounds (planned state)', async ({ assert }) => {
    // Arrange - Données sans rounds
    const plannedPartieData = {
      userId: 1,
      gameType: 'NARRATIVE',
      pointsLimit: 1500,
      mission: 'Recover the Relic',
      players: [
        { pseudo: 'Space_Marine', userId: 1 },
        { pseudo: 'Ork_Warboss', userId: null },
      ],
      requestingUserId: 1,
    }

    // Act
    const result = await partieCompleteService.createPartieComplete(plannedPartieData)

    // Assert
    assert.isNotNull(result)
    assert.equal(result.players.length, 2)
    assert.equal(result.rounds.length, 0)
    assert.equal(result.scores.length, 0)
    assert.equal(result.summary.status, 'PLANNED')
    assert.equal(result.summary.totalPlayerScore, 0)
    assert.equal(result.summary.totalOpponentScore, 0)

    // Vérification en base
    const gameInDb = await GameModel.find(result.partieId)
    assert.isNotNull(gameInDb)
    assert.equal(gameInDb!.mission, 'Recover the Relic')
  })

  /**
   * Test 7 : Validation cross-services
   */
  test('should validate cross-service references', async ({ assert }) => {
    // Arrange - Données valides pour test validation
    const validData = {
      userId: 1,
      gameType: 'OPEN_PLAY',
      pointsLimit: 1000,
      players: [{ pseudo: 'TestPlayer', userId: 1 }],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 10,
          opponentScore: 8,
          scores: [
            {
              playerId: '1',
              scoreType: 'PRIMARY',
              scoreName: 'Test Score',
              scoreValue: 5,
            },
          ],
        },
      ],
      requestingUserId: 1,
    }

    // Act
    const result = await partieCompleteService.createPartieComplete(validData, {
      validateCrossReferences: true,
    })

    // Assert - Validation réussie
    assert.isNotNull(result)
    assert.equal(result.players.length, 1)
    assert.equal(result.rounds.length, 1)
    assert.equal(result.scores.length, 1)

    // Vérification cohérence
    assert.equal(result.scores[0].playerId, result.players[0].id)
    assert.equal(result.scores[0].roundId, result.rounds[0].id)
  })

  /**
   * Test 8 : Performance et timeout
   */
  test('should handle large data sets within timeout', async ({ assert }) => {
    // Arrange - Données importantes pour test performance
    const largeData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 3000,
      players: [
        { pseudo: 'Player1', userId: 1 },
        { pseudo: 'Player2', userId: 2 },
        { pseudo: 'Player3', userId: null },
        { pseudo: 'Player4', userId: null },
      ],
      rounds: Array.from({ length: 5 }, (_, i) => ({
        roundNumber: i + 1,
        playerScore: 20 + i * 2,
        opponentScore: 18 + i,
        scores: [
          {
            playerId: '1',
            scoreType: 'PRIMARY',
            scoreName: `Primary Round ${i + 1}`,
            scoreValue: 10 + i,
          },
          {
            playerId: '2',
            scoreType: 'SECONDARY',
            scoreName: `Secondary Round ${i + 1}`,
            scoreValue: 5 + i,
          },
        ],
      })),
      requestingUserId: 1,
    }

    // Act - Mesure de performance
    const startTime = Date.now()
    const result = await partieCompleteService.createPartieComplete(largeData, {
      transaction: { timeout: 10000 }, // 10 secondes
    })
    const duration = Date.now() - startTime

    // Assert - Performance
    assert.isBelow(duration, 5000) // Moins de 5 secondes
    assert.isNotNull(result)
    assert.equal(result.players.length, 4)
    assert.equal(result.rounds.length, 5)
    assert.equal(result.scores.length, 10) // 2 scores par round * 5 rounds

    console.log(`Large data creation completed in ${duration}ms`)
  })

  /**
   * Test 9 : Autorisation - utilisateur non autorisé
   */
  test('should reject unauthorized user', async ({ assert }) => {
    // Arrange - Utilisateur non autorisé
    const unauthorizedData = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      players: [{ pseudo: 'Player1', userId: 1 }],
      requestingUserId: 999, // Utilisateur différent
    }

    // Act & Assert
    await assert.rejects(
      () => partieCompleteService.createPartieComplete(unauthorizedData),
      'Requesting user must be the owner of the partie being created'
    )
  })

  /**
   * Test 10 : Edge case - Données limites
   */
  test('should handle edge cases correctly', async ({ assert }) => {
    // Arrange - Cas limites
    const edgeCaseData = {
      userId: 1,
      gameType: 'NARRATIVE',
      pointsLimit: 500, // Minimum
      players: [
        { pseudo: 'ABC', userId: 1 }, // Pseudo minimal valide (3 caractères min)
      ],
      rounds: [
        {
          roundNumber: 1,
          playerScore: 0, // Score minimum
          opponentScore: 0,
          scores: [
            {
              playerId: '1',
              scoreType: 'SECONDARY',
              scoreName: 'Min Score',
              scoreValue: 0, // Score minimum valide
            },
          ],
        },
      ],
      requestingUserId: 1,
    }

    // Act
    const result = await partieCompleteService.createPartieComplete(edgeCaseData)

    // Assert
    assert.isNotNull(result)
    assert.equal(result.players.length, 1)
    assert.equal(result.rounds.length, 1)
    assert.equal(result.scores.length, 1)
    assert.equal(result.scores[0].scoreValue, 0) // Score minimum accepté
    assert.equal(result.summary.totalPlayerScore, 0)
    assert.equal(result.summary.totalOpponentScore, 0)
  })
})
