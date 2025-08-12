import { test } from '@japa/runner'
import GameFactory from '#tests/helpers/game_factory'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'

test.group('GameFactory', () => {
  test('should create a basic game with default values', ({ assert }) => {
    // Act
    const game = GameFactory.createBasic()

    // Assert
    assert.instanceOf(game, Game)
    assert.equal(game.status.value, GameStatus.PLANNED.value)
    assert.equal(game.gameType.value, GameType.MATCHED_PLAY.value)
    assert.equal(game.pointsLimit.value, 2000)
    assert.isNull(game.opponentId)
    assert.isNull(game.playerScore)
    assert.isNull(game.opponentScore)
  })

  test('should create a game with custom values', ({ assert }) => {
    // Arrange
    const gameId = new GameId(42)
    const userId = 123
    const gameType = GameType.NARRATIVE
    const pointsLimit = new PointsLimit(1000)

    // Act
    const game = GameFactory.createBasic({
      id: gameId,
      userId,
      gameType,
      pointsLimit,
    })

    // Assert
    assert.equal(game.id.value, 42)
    assert.equal(game.userId, 123)
    assert.equal(game.gameType.value, GameType.NARRATIVE.value)
    assert.equal(game.pointsLimit.value, 1000)
  })

  test('should create a completed game with scores', ({ assert }) => {
    // Act
    const game = GameFactory.createCompleted(85, 72, {
      mission: 'Secure and Control',
    })

    // Assert
    assert.equal(game.status.value, GameStatus.COMPLETED.value)
    assert.equal(game.playerScore, 85)
    assert.equal(game.opponentScore, 72)
    assert.equal(game.mission, 'Secure and Control')
    assert.equal(game.getWinner(), 'PLAYER')
    assert.isNotNull(game.completedAt)
  })

  test('should create an in-progress game', ({ assert }) => {
    // Act
    const game = GameFactory.createInProgress({
      mission: 'Priority Targets',
      opponentId: 456,
    })

    // Assert
    assert.equal(game.status.value, GameStatus.IN_PROGRESS.value)
    assert.equal(game.mission, 'Priority Targets')
    assert.equal(game.opponentId, 456)
    assert.isNotNull(game.startedAt)
    assert.isNull(game.completedAt)
  })

  test('should create a game for reconstruction', ({ assert }) => {
    // Arrange
    const gameId = new GameId(99)
    const createdAt = new Date('2024-01-15T10:00:00Z')
    const completedAt = new Date('2024-01-15T12:30:00Z')

    // Act
    const game = GameFactory.reconstruct({
      id: gameId,
      status: GameStatus.COMPLETED,
      playerScore: 95,
      opponentScore: 88,
      createdAt,
      completedAt,
    })

    // Assert
    assert.equal(game.id.value, 99)
    assert.equal(game.status.value, GameStatus.COMPLETED.value)
    assert.equal(game.playerScore, 95)
    assert.equal(game.opponentScore, 88)
    assert.equal(game.createdAt.getTime(), createdAt.getTime())
    assert.equal(game.completedAt?.getTime(), completedAt.getTime())
  })

  test('should create a batch of games with different statuses', ({ assert }) => {
    // Act
    const games = GameFactory.createBatch(3, {
      userIdStart: 100,
      statusMix: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'],
    })

    // Assert
    assert.lengthOf(games, 3)
    assert.equal(games[0].status.value, GameStatus.PLANNED.value)
    assert.equal(games[1].status.value, GameStatus.IN_PROGRESS.value)
    assert.equal(games[2].status.value, GameStatus.COMPLETED.value)

    // Different users
    assert.equal(games[0].userId, 100)
    assert.equal(games[1].userId, 101)
    assert.equal(games[2].userId, 102)
  })

  test('should create realistic W40K game scenarios', ({ assert }) => {
    // Act
    const closeGame = GameFactory.createRealisticScenario('close')
    const dominationGame = GameFactory.createRealisticScenario('domination')
    const lowScoringGame = GameFactory.createRealisticScenario('low-scoring')

    // Assert - Close game
    assert.equal(closeGame.status.value, GameStatus.COMPLETED.value)
    assert.isTrue(Math.abs(closeGame.playerScore! - closeGame.opponentScore!) <= 10)

    // Assert - Domination game
    assert.equal(dominationGame.status.value, GameStatus.COMPLETED.value)
    const scoreDiff = Math.abs(dominationGame.playerScore! - dominationGame.opponentScore!)
    assert.isTrue(scoreDiff >= 30)

    // Assert - Low scoring game
    assert.equal(lowScoringGame.status.value, GameStatus.COMPLETED.value)
    assert.isTrue(lowScoringGame.playerScore! < 60)
    assert.isTrue(lowScoringGame.opponentScore! < 60)
  })

  test('should generate W40K mission names', ({ assert }) => {
    // Act
    const missions = Array.from({ length: 10 }, () => GameFactory.generateMissionName())

    // Assert
    missions.forEach((mission) => {
      assert.isString(mission)
      assert.isTrue(mission.length > 0)
      // Should contain W40K-style mission naming
      assert.isTrue(
        mission.includes('Secure') ||
          mission.includes('Priority') ||
          mission.includes('Recover') ||
          mission.includes('Deploy') ||
          mission.includes('Control') ||
          mission.includes('Sweep') ||
          mission.includes('Engage') ||
          mission.includes('Assassinate') ||
          mission.includes('Linebreaker')
      )
    })
  })
})