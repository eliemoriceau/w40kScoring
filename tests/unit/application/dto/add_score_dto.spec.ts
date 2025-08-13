import { test } from '@japa/runner'
import { AddScoreDtoFactory } from '#application/dto/add_score_dto'

test.group('AddScoreDtoFactory', () => {
  test('should create valid DTO with all required fields', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Victory Points',
      scoreValue: 12,
      requestingUserId: 789,
    }

    // Act
    const result = AddScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.roundId, '123')
    assert.equal(result.playerId, '456')
    assert.equal(result.scoreType, 'PRIMARY')
    assert.equal(result.scoreName, 'Victory Points')
    assert.equal(result.scoreValue, 12)
    assert.equal(result.requestingUserId, 789)
  })

  test('should trim whitespace from string fields', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '  123  ',
      playerId: '  456  ',
      scoreType: 'SECONDARY',
      scoreName: '  Engage on All Fronts  ',
      scoreValue: 8,
      requestingUserId: 789,
    }

    // Act
    const result = AddScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.roundId, '123')
    assert.equal(result.playerId, '456')
    assert.equal(result.scoreName, 'Engage on All Fronts')
  })

  test('should throw error for empty roundId', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(() => AddScoreDtoFactory.create(data), 'Round ID is required')
  })

  test('should throw error for empty playerId', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(() => AddScoreDtoFactory.create(data), 'Player ID is required')
  })

  test('should throw error for invalid score type', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'OBJECTIVE', // Not allowed
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(() => AddScoreDtoFactory.create(data), 'Score type must be one of')
  })

  test('should throw error for SECONDARY without name', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'SECONDARY',
      scoreName: '',
      scoreValue: 5,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(() => AddScoreDtoFactory.create(data), 'Score name is required for SECONDARY')
  })

  test('should throw error for negative score value', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: -1,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddScoreDtoFactory.create(data),
      'Score value must be an integer between 0 and 15'
    )
  })

  test('should throw error for score value over limit', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 16,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddScoreDtoFactory.create(data),
      'Score value must be an integer between 0 and 15'
    )
  })

  test('should throw error for invalid requesting user ID', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: 0,
    }

    // Act & Assert
    assert.throws(
      () => AddScoreDtoFactory.create(data),
      'Requesting user ID must be a positive integer'
    )
  })

  test('should accept all valid score types', ({ assert }) => {
    const validTypes = ['PRIMARY', 'SECONDARY', 'CHALLENGER']

    validTypes.forEach((scoreType) => {
      // Arrange
      const data = {
        roundId: '123',
        playerId: '456',
        scoreType,
        scoreName: scoreType === 'SECONDARY' ? 'Test Name' : 'Test',
        scoreValue: 5,
        requestingUserId: 789,
      }

      // Act & Assert
      assert.doesNotThrow(() => AddScoreDtoFactory.create(data))
    })
  })

  test('should accept zero score value', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 0,
      requestingUserId: 789,
    }

    // Act
    const result = AddScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreValue, 0)
  })

  test('should accept maximum score value', ({ assert }) => {
    // Arrange
    const data = {
      roundId: '123',
      playerId: '456',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 15,
      requestingUserId: 789,
    }

    // Act
    const result = AddScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreValue, 15)
  })
})
