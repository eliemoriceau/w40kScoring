import { test } from '@japa/runner'
import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'

test.group('Round Entity', () => {
  test('should create a new round for a game', ({ assert }) => {
    // Arrange
    const roundId = new RoundId(1)
    const gameId = new GameId(42)
    const roundNumber = new RoundNumber(1)

    // Act
    const round = Round.createNew(roundId, gameId, roundNumber)

    // Assert
    assert.isTrue(round.id.equals(roundId))
    assert.isTrue(round.gameId.equals(gameId))
    assert.isTrue(round.roundNumber.equals(roundNumber))
    assert.equal(round.playerScore, 0)
    assert.equal(round.opponentScore, 0)
    assert.isFalse(round.isCompleted)
    assert.instanceOf(round.createdAt, Date)
  })

  test('should complete round with valid scores', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(3))

    // Act
    round.completeRound(15, 12)

    // Assert
    assert.equal(round.playerScore, 15)
    assert.equal(round.opponentScore, 12)
    assert.isTrue(round.isCompleted)
  })

  test('should raise RoundCompletedEvent when completing round', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(2))

    // Act
    round.completeRound(20, 18)

    // Assert
    const events = round.getDomainEvents()
    assert.equal(events.length, 1)
    assert.equal(events[0].constructor.name, 'RoundCompletedEvent')
  })

  test('should throw error for negative scores', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))

    // Act & Assert
    assert.throws(() => round.completeRound(-5, 10), 'Scores must be non-negative integers')

    assert.throws(() => round.completeRound(10, -3), 'Scores must be non-negative integers')
  })

  test('should throw error for non-integer scores', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))

    // Act & Assert
    assert.throws(() => round.completeRound(10.5, 12), 'Scores must be non-negative integers')

    assert.throws(() => round.completeRound(15, 8.7), 'Scores must be non-negative integers')
  })

  test('should throw error when trying to complete already completed round', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))
    round.completeRound(10, 8)

    // Act & Assert
    assert.throws(() => round.completeRound(12, 10), 'Round is already completed')
  })

  test('should allow updating scores of non-completed round', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))
    round.updateScores(5, 3)

    // Act
    round.updateScores(8, 7)

    // Assert
    assert.equal(round.playerScore, 8)
    assert.equal(round.opponentScore, 7)
    assert.isFalse(round.isCompleted)
  })

  test('should throw error when updating scores of completed round', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))
    round.completeRound(10, 8)

    // Act & Assert
    assert.throws(() => round.updateScores(12, 10), 'Cannot update scores of completed round')
  })

  test('should determine round winner correctly', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))

    // Test player win
    round.completeRound(15, 10)
    assert.equal(round.getWinner(), 'PLAYER')

    // Test opponent win
    const round2 = Round.createNew(new RoundId(2), new GameId(42), new RoundNumber(2))
    round2.completeRound(8, 12)
    assert.equal(round2.getWinner(), 'OPPONENT')

    // Test draw
    const round3 = Round.createNew(new RoundId(3), new GameId(42), new RoundNumber(3))
    round3.completeRound(10, 10)
    assert.equal(round3.getWinner(), 'DRAW')
  })

  test('should return null winner for incomplete round', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))

    // Act & Assert
    assert.isNull(round.getWinner())
  })

  test('should reconstruct round from persistence data', ({ assert }) => {
    // Arrange
    const data = {
      id: new RoundId(123),
      gameId: new GameId(456),
      roundNumber: new RoundNumber(3),
      playerScore: 18,
      opponentScore: 14,
      isCompleted: true,
      createdAt: new Date('2024-01-15T10:30:00Z'),
    }

    // Act
    const round = Round.reconstruct(data)

    // Assert
    assert.isTrue(round.id.equals(data.id))
    assert.isTrue(round.gameId.equals(data.gameId))
    assert.isTrue(round.roundNumber.equals(data.roundNumber))
    assert.equal(round.playerScore, 18)
    assert.equal(round.opponentScore, 14)
    assert.isTrue(round.isCompleted)
    assert.equal(round.createdAt.getTime(), data.createdAt.getTime())
  })

  test('should reconstruct incomplete round from persistence data', ({ assert }) => {
    // Arrange
    const data = {
      id: new RoundId(789),
      gameId: new GameId(101),
      roundNumber: new RoundNumber(2),
      playerScore: 5,
      opponentScore: 3,
      isCompleted: false,
      createdAt: new Date('2024-01-15T11:00:00Z'),
    }

    // Act
    const round = Round.reconstruct(data)

    // Assert
    assert.isTrue(round.id.equals(data.id))
    assert.equal(round.playerScore, 5)
    assert.equal(round.opponentScore, 3)
    assert.isFalse(round.isCompleted)
    assert.isNull(round.getWinner())
  })

  test('should clear domain events after retrieval', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))
    round.completeRound(10, 8)

    // Act
    const events = round.getDomainEvents()
    assert.equal(events.length, 1)

    round.clearDomainEvents()
    const eventsAfterClear = round.getDomainEvents()

    // Assert
    assert.equal(eventsAfterClear.length, 0)
  })

  test('should check if round has domain events', ({ assert }) => {
    // Arrange
    const round = Round.createNew(new RoundId(1), new GameId(42), new RoundNumber(1))

    // Assert - no events initially
    assert.isFalse(round.hasDomainEvents())

    // Act - complete round (raises event)
    round.completeRound(10, 8)

    // Assert - has events after completion
    assert.isTrue(round.hasDomainEvents())
  })
})
