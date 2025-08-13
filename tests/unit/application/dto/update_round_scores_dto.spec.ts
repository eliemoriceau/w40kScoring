import { test } from '@japa/runner'
import { UpdateRoundScoresDtoFactory } from '#application/dto/update_round_scores_dto'

test.group('UpdateRoundScoresDtoFactory', () => {
  test('should create valid DTO with all required fields', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 3,
      playerScore: 15,
      opponentScore: 12,
      requestingUserId: 789,
    }

    // Act
    const result = UpdateRoundScoresDtoFactory.create(data)

    // Assert
    assert.equal(result.gameId, '123')
    assert.equal(result.roundNumber, 3)
    assert.equal(result.playerScore, 15)
    assert.equal(result.opponentScore, 12)
    assert.equal(result.requestingUserId, 789)
  })

  test('should trim whitespace from gameId', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '  123  ',
      roundNumber: 1,
      playerScore: 0,
      opponentScore: 0,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateRoundScoresDtoFactory.create(data)

    // Assert
    assert.equal(result.gameId, '123')
  })

  test('should throw error for empty gameId', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Game ID is required and must be a non-empty string'
    )
  })

  test('should throw error for invalid round number', ({ assert }) => {
    // Arrange - Round number 0 (invalid)
    const data = {
      gameId: '123',
      roundNumber: 0,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Round number must be an integer between 1 and 5'
    )
  })

  test('should throw error for round number greater than 5', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 6,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Round number must be an integer between 1 and 5'
    )
  })

  test('should throw error for negative player score', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 1,
      playerScore: -1,
      opponentScore: 3,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Player score must be a non-negative integer'
    )
  })

  test('should throw error for negative opponent score', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: -2,
      requestingUserId: 123,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Opponent score must be a non-negative integer'
    )
  })

  test('should throw error for invalid requesting user ID', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: -1,
    }

    // Act & Assert
    assert.throws(
      () => UpdateRoundScoresDtoFactory.create(data),
      'Requesting user ID must be a positive integer'
    )
  })

  test('should accept zero scores', ({ assert }) => {
    // Arrange
    const data = {
      gameId: '123',
      roundNumber: 1,
      playerScore: 0,
      opponentScore: 0,
      requestingUserId: 456,
    }

    // Act
    const result = UpdateRoundScoresDtoFactory.create(data)

    // Assert
    assert.equal(result.playerScore, 0)
    assert.equal(result.opponentScore, 0)
  })
})