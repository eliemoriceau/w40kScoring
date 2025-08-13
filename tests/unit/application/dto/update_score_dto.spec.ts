import { test } from '@japa/runner'
import { UpdateScoreDtoFactory } from '#application/dto/update_score_dto'

test.group('UpdateScoreDtoFactory', () => {
  test('should create valid DTO with all required fields', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreName: 'Updated Name',
      scoreValue: 10,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreId, '123')
    assert.equal(result.scoreName, 'Updated Name')
    assert.equal(result.scoreValue, 10)
    assert.equal(result.requestingUserId, 456)
  })

  test('should create DTO without optional scoreName', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: 8,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreId, '123')
    assert.isUndefined(result.scoreName)
    assert.equal(result.scoreValue, 8)
    assert.equal(result.requestingUserId, 456)
  })

  test('should trim whitespace from string fields', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '  123  ',
      scoreName: '  Updated Name  ',
      scoreValue: 12,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreId, '123')
    assert.equal(result.scoreName, 'Updated Name')
  })

  test('should throw error for empty scoreId', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '',
      scoreValue: 5,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(() => UpdateScoreDtoFactory.create(data), 'Score ID is required')
  })

  test('should throw error for empty scoreName when provided', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreName: '   ', // Only whitespace
      scoreValue: 5,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(
      () => UpdateScoreDtoFactory.create(data),
      'Score name, if provided, must be a non-empty string'
    )
  })

  test('should throw error for negative score value', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: -1,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(
      () => UpdateScoreDtoFactory.create(data),
      'Score value must be an integer between 0 and 15'
    )
  })

  test('should throw error for score value over limit', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: 16,
      requestingUserId: 456,
    }

    // Act & Assert
    assert.throws(
      () => UpdateScoreDtoFactory.create(data),
      'Score value must be an integer between 0 and 15'
    )
  })

  test('should throw error for invalid requesting user ID', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: 5,
      requestingUserId: 0,
    }

    // Act & Assert
    assert.throws(
      () => UpdateScoreDtoFactory.create(data),
      'Requesting user ID must be a positive integer'
    )
  })

  test('should accept zero score value', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: 0,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreValue, 0)
  })

  test('should accept maximum score value', ({ assert }) => {
    // Arrange
    const data = {
      scoreId: '123',
      scoreValue: 15,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateScoreDtoFactory.create(data)

    // Assert
    assert.equal(result.scoreValue, 15)
  })
})
