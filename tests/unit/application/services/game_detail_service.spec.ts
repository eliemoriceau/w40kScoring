import { test } from '@japa/runner'
import { GameDetailService } from '#application/services/game_detail_service'
import { GameDetailSummary } from '#domain/value-objects/game_detail_summary'
import GameId from '#domain/value-objects/game_id'
import Game from '#domain/entities/game'
import Player from '#domain/entities/player'
import Round from '#domain/entities/round'
import Score from '#domain/entities/score'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'
import PlayerId from '#domain/value-objects/player_id'
import Pseudo from '#domain/value-objects/pseudo'
import RoundId from '#domain/value-objects/round_id'
import RoundNumber from '#domain/value-objects/round_number'
import ScoreId from '#domain/value-objects/score_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'

test.group('GameDetailService', () => {
  // Helper function to create service with default mocks
  function createService(overrides: any = {}) {
    const mockGameQueryRepository = {
      findById: () => Promise.resolve(null),
      ...overrides.gameQuery,
    }
    const mockPlayerQueryRepository = {
      findByGameId: () => Promise.resolve([]),
      ...overrides.playerQuery,
    }
    const mockRoundQueryRepository = {
      findByGameId: () => Promise.resolve([]),
      ...overrides.roundQuery,
    }
    const mockScoreQueryRepository = {
      findByRoundId: () => Promise.resolve([]),
      ...overrides.scoreQuery,
    }

    return {
      service: new GameDetailService(
        mockGameQueryRepository,
        mockPlayerQueryRepository,
        mockRoundQueryRepository,
        mockScoreQueryRepository
      ),
      mocks: {
        gameQuery: mockGameQueryRepository,
        playerQuery: mockPlayerQueryRepository,
        roundQuery: mockRoundQueryRepository,
        scoreQuery: mockScoreQueryRepository,
      },
    }
  }

  test('should return null when game not found', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(999)
    const userId = 100
    const { service } = createService()

    // Act
    const result = await service.getGameDetail(gameId, userId)

    // Assert
    assert.isNull(result)
  })

  test('should throw error when user is not authorized', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 999 // Different from game owner
    const gameOwnerId = 100

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: gameOwnerId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.COMPLETED,
      opponentId: null,
      playerScore: 85,
      opponentScore: 72,
      mission: 'Test Mission',
      deployment: null,
      primaryScoringMethod: null,
      notes: '',
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    })

    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
    })

    // Act & Assert
    await assert.rejects(
      async () => await service.getGameDetail(gameId, userId),
      'Unauthorized access to this game'
    )
  })

  test('should return complete game detail when authorized', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 100

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: userId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.COMPLETED,
      opponentId: 101,
      playerScore: 85,
      opponentScore: 72,
      mission: 'Take and Hold',
      deployment: 'Dawn of War',
      primaryScoringMethod: 'Progressive',
      notes: 'Great game!',
      createdAt: new Date('2024-01-01'),
      startedAt: new Date('2024-01-01T10:00:00'),
      completedAt: new Date('2024-01-01T12:00:00'),
    })

    const mockPlayers = [
      Player.createForRegisteredUser(new PlayerId(1), gameId, userId, new Pseudo('Player1')),
      Player.createForRegisteredUser(new PlayerId(2), gameId, 101, new Pseudo('Player2')),
    ]

    const mockRounds = [
      Round.createNew(new RoundId(1), gameId, new RoundNumber(1)),
      Round.createNew(new RoundId(2), gameId, new RoundNumber(2)),
    ]

    // Complete the rounds with scores
    mockRounds[0].completeRound(25, 20)
    mockRounds[1].completeRound(30, 25)

    const mockScores = [
      Score.reconstruct({
        id: new ScoreId(1),
        roundId: new RoundId(1),
        playerId: new PlayerId(1),
        scoreType: new ScoreType('SECONDARY'),
        scoreName: new ScoreName('Deploy Scramblers'),
        scoreValue: ScoreValue.forType(10, new ScoreType('SECONDARY')),
        createdAt: new Date('2024-01-01T10:30:00'),
      }),
    ]

    // Mock repository responses
    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
      playerQuery: {
        findByGameId: () => Promise.resolve(mockPlayers),
      },
      roundQuery: {
        findByGameId: () => Promise.resolve(mockRounds),
      },
      scoreQuery: {
        findByRoundId: (roundId: RoundId) => {
          return Promise.resolve(mockScores.filter((score) => score.roundId.equals(roundId)))
        },
      },
    })

    // Act
    const result = await service.getGameDetail(gameId, userId)

    // Assert
    assert.isNotNull(result)
    assert.instanceOf(result, GameDetailSummary)
    assert.equal(result!.gameId, 1)
    assert.equal(result!.userId, 100)
    assert.equal(result!.gameType, 'MATCHED_PLAY')
    assert.equal(result!.pointsLimit, 2000)
    assert.equal(result!.status, 'COMPLETED')
    assert.equal(result!.players.length, 2)
    assert.equal(result!.rounds.length, 2)
    assert.equal(result!.secondaryScores.length, 1)
  })

  test('should filter secondary scores correctly', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 100

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: userId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.IN_PROGRESS,
      opponentId: null,
      playerScore: null,
      opponentScore: null,
      mission: null,
      deployment: null,
      primaryScoringMethod: null,
      notes: '',
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: null,
    })

    const mockPlayers = [
      Player.createForRegisteredUser(new PlayerId(1), gameId, userId, new Pseudo('Player1')),
    ]

    const mockRounds = [Round.createNew(new RoundId(1), gameId, new RoundNumber(1))]

    const mockScores = [
      // Secondary score (should be included)
      Score.reconstruct({
        id: new ScoreId(1),
        roundId: new RoundId(1),
        playerId: new PlayerId(1),
        scoreType: new ScoreType('SECONDARY'),
        scoreName: new ScoreName('Deploy Scramblers'),
        scoreValue: ScoreValue.forType(10, new ScoreType('SECONDARY')),
        createdAt: new Date(),
      }),
      // Primary score (should be filtered out)
      Score.reconstruct({
        id: new ScoreId(2),
        roundId: new RoundId(1),
        playerId: new PlayerId(1),
        scoreType: new ScoreType('PRIMARY'),
        scoreName: new ScoreName('Control Objectives'),
        scoreValue: ScoreValue.forType(25, new ScoreType('PRIMARY')),
        createdAt: new Date(),
      }),
    ]

    // Mock repository responses
    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
      playerQuery: {
        findByGameId: () => Promise.resolve(mockPlayers),
      },
      roundQuery: {
        findByGameId: () => Promise.resolve(mockRounds),
      },
      scoreQuery: {
        findByRoundId: () => Promise.resolve(mockScores),
      },
    })

    // Act
    const result = await service.getGameDetail(gameId, userId)

    // Assert
    assert.isNotNull(result)
    assert.equal(result!.secondaryScores.length, 1)
    assert.equal(result!.secondaryScores[0].scoreType, 'SECONDARY')
    assert.equal(result!.secondaryScores[0].scoreName, 'Deploy Scramblers')
  })

  test('should return correct game stats', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 100

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: userId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.IN_PROGRESS,
      opponentId: null,
      playerScore: null,
      opponentScore: null,
      mission: null,
      deployment: null,
      primaryScoringMethod: null,
      notes: '',
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: null,
    })

    const mockPlayers = [
      Player.createForRegisteredUser(new PlayerId(1), gameId, userId, new Pseudo('Player1')),
    ]

    const mockRounds = [
      Round.createNew(new RoundId(1), gameId, new RoundNumber(1)),
      Round.createNew(new RoundId(2), gameId, new RoundNumber(2)),
      Round.createNew(new RoundId(3), gameId, new RoundNumber(3)),
    ]

    // Complete only 2 rounds
    mockRounds[0].completeRound(25, 20)
    mockRounds[1].completeRound(30, 25)

    const mockScores = [
      Score.reconstruct({
        id: new ScoreId(1),
        roundId: new RoundId(1),
        playerId: new PlayerId(1),
        scoreType: new ScoreType('SECONDARY'),
        scoreName: new ScoreName('Deploy Scramblers'),
        scoreValue: ScoreValue.forType(10, new ScoreType('SECONDARY')),
        createdAt: new Date(),
      }),
    ]

    // Mock repository responses
    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
      playerQuery: {
        findByGameId: () => Promise.resolve(mockPlayers),
      },
      roundQuery: {
        findByGameId: () => Promise.resolve(mockRounds),
      },
      scoreQuery: {
        findByRoundId: (roundId: RoundId) => {
          return Promise.resolve(mockScores.filter((score) => score.roundId.equals(roundId)))
        },
      },
    })

    // Act
    const stats = await service.getGameStats(gameId, userId)

    // Assert
    assert.isNotNull(stats)
    assert.equal(stats!.totalRounds, 3)
    assert.equal(stats!.completedRounds, 2)
    assert.equal(stats!.totalSecondaryScores, 1)
    assert.equal(stats!.gameStatus, 'IN_PROGRESS')
  })

  test('should return false for game accessibility when unauthorized', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 999 // Unauthorized user

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: 100, // Different owner
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.COMPLETED,
      opponentId: null,
      playerScore: null,
      opponentScore: null,
      mission: null,
      deployment: null,
      primaryScoringMethod: null,
      notes: '',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    })

    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
    })

    // Act
    const isAccessible = await service.isGameAccessible(gameId, userId)

    // Assert
    assert.isFalse(isAccessible)
  })

  test('should return true for game accessibility when authorized', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 100

    const mockGame = Game.reconstruct({
      id: gameId,
      userId: userId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.COMPLETED,
      opponentId: null,
      playerScore: null,
      opponentScore: null,
      mission: null,
      deployment: null,
      primaryScoringMethod: null,
      notes: '',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    })

    const mockPlayers = [
      Player.createForRegisteredUser(new PlayerId(1), gameId, userId, new Pseudo('Player1')),
    ]

    const { service } = createService({
      gameQuery: {
        findById: () => Promise.resolve(mockGame),
      },
      playerQuery: {
        findByGameId: () => Promise.resolve(mockPlayers),
      },
      roundQuery: {
        findByGameId: () => Promise.resolve([]),
      },
      scoreQuery: {
        findByRoundId: () => Promise.resolve([]),
      },
    })

    // Act
    const isAccessible = await service.isGameAccessible(gameId, userId)

    // Assert
    assert.isTrue(isAccessible)
  })
})
