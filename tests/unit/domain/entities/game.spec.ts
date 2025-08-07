import { test } from '@japa/runner'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'

test.group('Game Entity', () => {
  test('should create a new planned game', ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const userId = 123
    const gameType = GameType.MATCHED_PLAY
    const pointsLimit = new PointsLimit(2000)

    // Act
    const game = Game.createNew(gameId, userId, gameType, pointsLimit)

    // Assert
    assert.isTrue(game.id.equals(gameId))
    assert.equal(game.userId, userId)
    assert.isTrue(game.gameType.equals(gameType))
    assert.isTrue(game.pointsLimit.equals(pointsLimit))
    assert.isTrue(game.status.equals(GameStatus.PLANNED))
    assert.isNull(game.opponentId)
    assert.isNull(game.playerScore)
    assert.isNull(game.opponentScore)
    assert.isNull(game.mission)
    assert.equal(game.notes, '')
    assert.instanceOf(game.createdAt, Date)
  })

  test('should start a planned game', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    const mission = 'Purge the Enemy'

    // Act
    game.start(mission)

    // Assert
    assert.isTrue(game.status.equals(GameStatus.IN_PROGRESS))
    assert.equal(game.mission, mission)
    assert.instanceOf(game.startedAt, Date)
  })

  test('should not start a game that is not planned', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    game.start('Mission')
    
    // Act & Assert
    assert.throws(() => game.start('Another mission'), 'Game must be in PLANNED status to be started')
  })

  test('should complete a game in progress', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    game.start('Mission')

    // Act
    game.complete(20, 15)

    // Assert
    assert.isTrue(game.status.equals(GameStatus.COMPLETED))
    assert.equal(game.playerScore, 20)
    assert.equal(game.opponentScore, 15)
    assert.instanceOf(game.completedAt, Date)
  })

  test('should not complete a game that is not in progress', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )

    // Act & Assert
    assert.throws(() => game.complete(20, 15), 'Game must be in IN_PROGRESS status to be completed')
  })

  test('should cancel a planned or in-progress game', ({ assert }) => {
    // Arrange
    const plannedGame = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    const inProgressGame = Game.createNew(
      new GameId(2),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    inProgressGame.start('Mission')

    // Act
    plannedGame.cancel()
    inProgressGame.cancel()

    // Assert
    assert.isTrue(plannedGame.status.equals(GameStatus.CANCELLED))
    assert.isTrue(inProgressGame.status.equals(GameStatus.CANCELLED))
  })

  test('should not cancel a completed game', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    game.start('Mission')
    game.complete(20, 15)

    // Act & Assert
    assert.throws(() => game.cancel(), 'Cannot cancel a completed game')
  })

  test('should set opponent', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )

    // Act
    game.setOpponent(456)

    // Assert
    assert.equal(game.opponentId, 456)
  })

  test('should update notes', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    const notes = 'Great game against Space Marines'

    // Act
    game.updateNotes(notes)

    // Assert
    assert.equal(game.notes, notes)
  })

  test('should determine winner correctly', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    game.setOpponent(456)
    game.start('Mission')
    game.complete(20, 15)

    // Act & Assert
    assert.equal(game.getWinner(), 'PLAYER')
    
    // Test opponent wins
    const opponentWinGame = Game.createNew(
      new GameId(2),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    opponentWinGame.start('Mission')
    opponentWinGame.complete(10, 18)
    assert.equal(opponentWinGame.getWinner(), 'OPPONENT')

    // Test draw
    const drawGame = Game.createNew(
      new GameId(3),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    drawGame.start('Mission')
    drawGame.complete(15, 15)
    assert.equal(drawGame.getWinner(), 'DRAW')
  })

  test('should return null winner for incomplete game', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(1),
      123,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )

    // Act & Assert
    assert.isNull(game.getWinner())
  })
})