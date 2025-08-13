import { test } from '@japa/runner'
import { CompleteRoundDtoFactory } from '#application/dto/complete_round_dto'

test.group('CompleteRoundDtoFactory', () => {
  test('should create valid DTO with all required fields', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '456',
      roundNumber: 2,
      requestingUserId: 789,
    }

    // Act
    const result = CompleteRoundDtoFactory.create(data)

    // Assert
    assert.equal(result.gameId, '456')
    assert.equal(result.roundNumber, 2)
    assert.equal(result.requestingUserId, 789)
  })

  test('should trim whitespace from gameId', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '  456  ',
      roundNumber: 5,
      requestingUserId: 123,
    }

    // Act
    const result = CompleteRoundDtoFactory.create(data)

    // Assert
    assert.equal(result.gameId, '456')
  })

  test('should throw error for empty gameId', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '',
      roundNumber: 3,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => CompleteRoundDtoFactory.create(data),
      'Game ID is required and must be a non-empty string'
    )
  })

  test('should throw error for invalid round number below 1', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 0,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(
      () => CompleteRoundDtoFactory.create(data),
      'Round number must be an integer between 1 and 5'
    )
  })

  test('should throw error for invalid round number above 5', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 6,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(
      () => CompleteRoundDtoFactory.create(data),
      'Round number must be an integer between 1 and 5'
    )
  })

  test('should throw error for invalid requesting user ID', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 3,
      requestingUserId: 0,
    }

    // Act & Assert
    assert.throws(
      () => CompleteRoundDtoFactory.create(data),
      'Requesting user ID must be a positive integer'
    )
  })

  test('should accept all valid round numbers 1-5', ({ assert }) => {
    // Test each valid round number
    for (let roundNumber = 1; roundNumber <= 5; roundNumber++) {
      const data = {
        gameId: '123',
        roundNumber,
        requestingUserId: 456,
      }

      const result = CompleteRoundDtoFactory.create(data)
      assert.equal(result.roundNumber, roundNumber)
    }
  })
})