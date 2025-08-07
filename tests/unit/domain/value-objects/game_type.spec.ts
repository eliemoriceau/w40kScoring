import { test } from '@japa/runner'
import GameType from '#domain/value-objects/game_type'

test.group('GameType Value Object', () => {
  test('should create valid GameType for MATCHED_PLAY', ({ assert }) => {
    // Act
    const gameType = GameType.MATCHED_PLAY

    // Assert
    assert.equal(gameType.value, 'MATCHED_PLAY')
    assert.equal(gameType.displayName, 'Matched Play')
  })

  test('should create valid GameType for NARRATIVE', ({ assert }) => {
    // Act
    const gameType = GameType.NARRATIVE

    // Assert
    assert.equal(gameType.value, 'NARRATIVE')
    assert.equal(gameType.displayName, 'Narrative')
  })

  test('should create valid GameType for OPEN_PLAY', ({ assert }) => {
    // Act
    const gameType = GameType.OPEN_PLAY

    // Assert
    assert.equal(gameType.value, 'OPEN_PLAY')
    assert.equal(gameType.displayName, 'Open Play')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const matchedPlay1 = GameType.MATCHED_PLAY
    const matchedPlay2 = GameType.MATCHED_PLAY
    const narrative = GameType.NARRATIVE

    // Assert
    assert.isTrue(matchedPlay1.equals(matchedPlay2))
    assert.isFalse(matchedPlay1.equals(narrative))
  })

  test('should create from valid string value', ({ assert }) => {
    // Act
    const gameType = GameType.fromValue('MATCHED_PLAY')

    // Assert
    assert.equal(gameType.value, 'MATCHED_PLAY')
    assert.isTrue(gameType.equals(GameType.MATCHED_PLAY))
  })

  test('should throw error for invalid string value', ({ assert }) => {
    // Act & Assert
    assert.throws(() => GameType.fromValue('INVALID'), 'Invalid game type: INVALID')
  })

  test('should list all valid game types', ({ assert }) => {
    // Act
    const allTypes = GameType.getAllTypes()
    const typeValues = allTypes.map(t => t.value)

    // Assert
    assert.lengthOf(allTypes, 3)
    assert.includeMembers(typeValues, ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY'])
  })
})