import { test } from '@japa/runner'
import Pseudo from '#domain/value-objects/pseudo'

test.group('Pseudo Value Object', () => {
  test('should create a valid Pseudo with acceptable length', ({ assert }) => {
    // Arrange & Act
    const pseudoShort = new Pseudo('Bob')
    const pseudoMedium = new Pseudo('PlayerOne')
    const pseudoLong = new Pseudo('VeryLongPlayerNameButStillValid')

    // Assert
    assert.equal(pseudoShort.value, 'Bob')
    assert.equal(pseudoMedium.value, 'PlayerOne')
    assert.equal(pseudoLong.value, 'VeryLongPlayerNameButStillValid')
  })

  test('should throw error for empty or whitespace-only pseudo', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new Pseudo(''), 'Pseudo cannot be empty')
    assert.throws(() => new Pseudo('   '), 'Pseudo cannot be empty')
    assert.throws(() => new Pseudo('\t\n'), 'Pseudo cannot be empty')
  })

  test('should throw error for pseudo too short', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new Pseudo('A'), 'Pseudo must be between 3 and 50 characters')
    assert.throws(() => new Pseudo('AB'), 'Pseudo must be between 3 and 50 characters')
  })

  test('should throw error for pseudo too long', ({ assert }) => {
    // Arrange
    const tooLongPseudo = 'A'.repeat(51) // 51 characters

    // Act & Assert
    assert.throws(() => new Pseudo(tooLongPseudo), 'Pseudo must be between 3 and 50 characters')
  })

  test('should accept pseudo with minimum valid length', ({ assert }) => {
    // Arrange & Act
    const pseudoMinLength = new Pseudo('ABC') // 3 characters - minimum

    // Assert
    assert.equal(pseudoMinLength.value, 'ABC')
  })

  test('should accept pseudo with maximum valid length', ({ assert }) => {
    // Arrange & Act
    const pseudoMaxLength = new Pseudo('A'.repeat(50)) // 50 characters - maximum

    // Assert
    assert.equal(pseudoMaxLength.value, 'A'.repeat(50))
  })

  test('should trim whitespace from pseudo', ({ assert }) => {
    // Arrange & Act
    const pseudoWithSpaces = new Pseudo('  PlayerName  ')

    // Assert
    assert.equal(pseudoWithSpaces.value, 'PlayerName')
  })

  test('should allow alphanumeric characters and common symbols', ({ assert }) => {
    // Arrange & Act
    const pseudoAlphaNum = new Pseudo('Player123')
    const pseudoWithSymbols = new Pseudo('Player_One-2024')
    const pseudoWithSpaces = new Pseudo('Player One')

    // Assert
    assert.equal(pseudoAlphaNum.value, 'Player123')
    assert.equal(pseudoWithSymbols.value, 'Player_One-2024')
    assert.equal(pseudoWithSpaces.value, 'Player One')
  })

  test('should reject pseudo with invalid characters', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new Pseudo('Player@#$'), 'Pseudo contains invalid characters')
    assert.throws(() => new Pseudo('Player<script>'), 'Pseudo contains invalid characters')
    assert.throws(() => new Pseudo('Player™'), 'Pseudo contains invalid characters')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const pseudoFirst = new Pseudo('SamePlayer')
    const pseudoSecond = new Pseudo('SamePlayer')
    const pseudoDifferent = new Pseudo('DifferentPlayer')

    // Assert
    assert.isTrue(pseudoFirst.equals(pseudoSecond))
    assert.isFalse(pseudoFirst.equals(pseudoDifferent))
  })

  test('should be case sensitive for equality', ({ assert }) => {
    // Arrange
    const pseudoLower = new Pseudo('player')
    const pseudoUpper = new Pseudo('PLAYER')

    // Assert
    assert.isFalse(pseudoLower.equals(pseudoUpper))
  })

  test('should convert to string representation', ({ assert }) => {
    // Arrange
    const pseudo = new Pseudo('TestPlayer')

    // Act & Assert
    assert.equal(pseudo.toString(), 'TestPlayer')
  })

  test('should preserve original case in value', ({ assert }) => {
    // Arrange & Act
    const pseudoMixedCase = new Pseudo('PlayerOne')

    // Assert
    assert.equal(pseudoMixedCase.value, 'PlayerOne')
  })
})
