import { test } from '@japa/runner'
import CreateGameCommand from '#application/commands/create_game_command'

test.group('CreateGameCommand', () => {
  test('should create a valid CreateGameCommand', ({ assert }) => {
    // Arrange
    const userId = 123
    const gameType = 'MATCHED_PLAY'
    const pointsLimit = 2000
    const opponentId = 456
    const mission = 'Purge the Enemy'

    // Act
    const command = new CreateGameCommand(userId, gameType, pointsLimit, opponentId, mission)

    // Assert
    assert.equal(command.userId, userId)
    assert.equal(command.gameType, gameType)
    assert.equal(command.pointsLimit, pointsLimit)
    assert.equal(command.opponentId, opponentId)
    assert.equal(command.mission, mission)
  })

  test('should create command without optional fields', ({ assert }) => {
    // Arrange
    const userId = 123
    const gameType = 'NARRATIVE'
    const pointsLimit = 1500

    // Act
    const command = new CreateGameCommand(userId, gameType, pointsLimit)

    // Assert
    assert.equal(command.userId, userId)
    assert.equal(command.gameType, gameType)
    assert.equal(command.pointsLimit, pointsLimit)
    assert.isUndefined(command.opponentId)
    assert.isUndefined(command.mission)
  })

  test('should validate required fields', ({ assert }) => {
    // Act & Assert
    assert.throws(
      () => new CreateGameCommand(0, 'MATCHED_PLAY', 2000),
      'User ID must be a positive integer'
    )

    assert.throws(() => new CreateGameCommand(123, '', 2000), 'Game type cannot be empty')

    assert.throws(
      () => new CreateGameCommand(123, 'MATCHED_PLAY', 0),
      'Points limit must be greater than 0'
    )
  })
})
