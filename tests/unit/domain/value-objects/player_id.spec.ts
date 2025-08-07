import { test } from '@japa/runner'
import PlayerId from '#domain/value-objects/player_id'

test.group('PlayerId Value Object', () => {
  test('should create a valid PlayerId from positive integer', ({ assert }) => {
    // Arrange & Act
    const playerId = new PlayerId(1)

    // Assert
    assert.equal(playerId.value, 1)
  })

  test('should create PlayerId from various positive integers', ({ assert }) => {
    // Arrange & Act
    const playerId123 = new PlayerId(123)
    const playerId999 = new PlayerId(999)

    // Assert
    assert.equal(playerId123.value, 123)
    assert.equal(playerId999.value, 999)
  })

  test('should throw error for zero or negative values', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new PlayerId(0), 'Player ID must be a positive integer')
    assert.throws(() => new PlayerId(-1), 'Player ID must be a positive integer')
    assert.throws(() => new PlayerId(-999), 'Player ID must be a positive integer')
  })

  test('should throw error for non-integer values', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new PlayerId(1.5), 'Player ID must be a positive integer')
    assert.throws(() => new PlayerId(3.14), 'Player ID must be a positive integer')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const playerIdFirst = new PlayerId(42)
    const playerIdSecond = new PlayerId(42)
    const playerIdDifferent = new PlayerId(24)

    // Assert
    assert.isTrue(playerIdFirst.equals(playerIdSecond))
    assert.isFalse(playerIdFirst.equals(playerIdDifferent))
  })

  test('should convert to string representation', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(789)

    // Act & Assert
    assert.equal(playerId.toString(), '789')
  })

  test('should create unique instances with different values', ({ assert }) => {
    // Arrange
    const playerId1 = new PlayerId(1)
    const playerId2 = new PlayerId(2)

    // Assert
    assert.notStrictEqual(playerId1, playerId2)
    assert.isFalse(playerId1.equals(playerId2))
  })
})
