import { test } from '@japa/runner'
import StartGameCommand from '#application/commands/start_game_command'

test.group('StartGameCommand', () => {
  test('should create a valid StartGameCommand', ({ assert }) => {
    // Arrange
    const gameId = 1
    const userId = 123
    const mission = 'Purge the Enemy'

    // Act
    const command = new StartGameCommand(gameId, userId, mission)

    // Assert
    assert.equal(command.gameId, gameId)
    assert.equal(command.userId, userId)
    assert.equal(command.mission, mission)
  })

  test('should create command without mission', ({ assert }) => {
    // Arrange
    const gameId = 1
    const userId = 123

    // Act
    const command = new StartGameCommand(gameId, userId)

    // Assert
    assert.equal(command.gameId, gameId)
    assert.equal(command.userId, userId)
    assert.isUndefined(command.mission)
  })

  test('should validate required fields', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new StartGameCommand(0, 123), 'Game ID must be a positive integer')

    assert.throws(() => new StartGameCommand(1, 0), 'User ID must be a positive integer')
  })
})
