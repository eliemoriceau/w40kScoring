import { test } from '@japa/runner'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStartedEvent from '#domain/events/game_started_event'
import GameCompletedEvent from '#domain/events/game_completed_event'
import GameCancelledEvent from '#domain/events/game_cancelled_event'

test.group('Game Domain Events', () => {
  test('should raise GameStartedEvent when game is started', ({ assert }) => {
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
    const events = game.getDomainEvents()
    assert.equal(events.length, 1)
    
    const startedEvent = events[0] as GameStartedEvent
    assert.equal(startedEvent.eventType, 'GameStarted')
    assert.equal(startedEvent.aggregateId, '1')
    assert.equal(startedEvent.data.gameId, 1)
    assert.equal(startedEvent.data.userId, 123)
    assert.equal(startedEvent.data.mission, mission)
    assert.instanceOf(new Date(startedEvent.data.startedAt), Date)
  })

  test('should raise GameCompletedEvent when game is completed', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(2),
      456,
      GameType.NARRATIVE,
      new PointsLimit(1500)
    )
    game.start('Battle Mission')

    // Act
    game.complete(25, 18)

    // Assert
    const events = game.getDomainEvents()
    assert.equal(events.length, 2) // StartedEvent + CompletedEvent
    
    const completedEvent = events[1] as GameCompletedEvent
    assert.equal(completedEvent.eventType, 'GameCompleted')
    assert.equal(completedEvent.aggregateId, '2')
    assert.equal(completedEvent.data.gameId, 2)
    assert.equal(completedEvent.data.userId, 456)
    assert.equal(completedEvent.data.playerScore, 25)
    assert.equal(completedEvent.data.opponentScore, 18)
    assert.equal(completedEvent.data.winner, 'PLAYER')
    assert.instanceOf(new Date(completedEvent.data.completedAt), Date)
  })

  test('should raise GameCancelledEvent when game is cancelled', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(3),
      789,
      GameType.OPEN_PLAY,
      new PointsLimit(1000)
    )
    game.start('Quick Battle')

    // Act
    game.cancel()

    // Assert
    const events = game.getDomainEvents()
    assert.equal(events.length, 2) // StartedEvent + CancelledEvent
    
    const cancelledEvent = events[1] as GameCancelledEvent
    assert.equal(cancelledEvent.eventType, 'GameCancelled')
    assert.equal(cancelledEvent.aggregateId, '3')
    assert.equal(cancelledEvent.data.gameId, 3)
    assert.equal(cancelledEvent.data.userId, 789)
    assert.equal(cancelledEvent.data.previousStatus, 'IN_PROGRESS')
    assert.instanceOf(new Date(cancelledEvent.data.cancelledAt), Date)
  })

  test('should cancel planned game and raise event', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(4),
      101,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )

    // Act
    game.cancel()

    // Assert
    const events = game.getDomainEvents()
    assert.equal(events.length, 1)
    
    const cancelledEvent = events[0] as GameCancelledEvent
    assert.equal(cancelledEvent.data.previousStatus, 'PLANNED')
  })

  test('should clear domain events', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(5),
      202,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )
    game.start('Mission')

    // Act
    assert.equal(game.getDomainEvents().length, 1)
    game.clearDomainEvents()

    // Assert
    assert.equal(game.getDomainEvents().length, 0)
    assert.isFalse(game.hasDomainEvents())
  })

  test('should check if game has domain events', ({ assert }) => {
    // Arrange
    const game = Game.createNew(
      new GameId(6),
      303,
      GameType.MATCHED_PLAY,
      new PointsLimit(2000)
    )

    // Assert initial state
    assert.isFalse(game.hasDomainEvents())

    // Act
    game.start('Mission')

    // Assert after event
    assert.isTrue(game.hasDomainEvents())
  })
})