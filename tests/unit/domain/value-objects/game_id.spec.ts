import { test } from '@japa/runner'
import GameId from '#domain/value-objects/game_id'

test.group('GameId Value Object', () => {
  test('should create a valid GameId from positive integer', ({ assert }) => {
    // Arrange
    const id = 1

    // Act
    const gameId = new GameId(id)

    // Assert
    assert.equal(gameId.value, 1)
    assert.isTrue(gameId.equals(new GameId(1)))
  })

  test('should throw error for zero or negative values', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new GameId(0), 'GameId must be a positive integer')
    assert.throws(() => new GameId(-1), 'GameId must be a positive integer')
  })

  test('should throw error for non-integer values', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new GameId(1.5), 'GameId must be a positive integer')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const gameId1 = new GameId(1)
    const gameId2 = new GameId(1)
    const gameId3 = new GameId(2)

    // Assert
    assert.isTrue(gameId1.equals(gameId2))
    assert.isFalse(gameId1.equals(gameId3))
  })

  test('should convert to string representation', ({ assert }) => {
    // Arrange
    const gameId = new GameId(123)

    // Act & Assert
    assert.equal(gameId.toString(), '123')
  })
})