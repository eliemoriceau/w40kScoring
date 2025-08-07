import { test } from '@japa/runner'
import GameStatus from '#domain/value-objects/game_status'

test.group('GameStatus Value Object', () => {
  test('should create valid GameStatus for all statuses', ({ assert }) => {
    // Act & Assert
    assert.equal(GameStatus.PLANNED.value, 'PLANNED')
    assert.equal(GameStatus.IN_PROGRESS.value, 'IN_PROGRESS')
    assert.equal(GameStatus.COMPLETED.value, 'COMPLETED')
    assert.equal(GameStatus.CANCELLED.value, 'CANCELLED')
    
    assert.equal(GameStatus.PLANNED.displayName, 'Planned')
    assert.equal(GameStatus.IN_PROGRESS.displayName, 'In Progress')
    assert.equal(GameStatus.COMPLETED.displayName, 'Completed')
    assert.equal(GameStatus.CANCELLED.displayName, 'Cancelled')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const planned1 = GameStatus.PLANNED
    const planned2 = GameStatus.PLANNED
    const completed = GameStatus.COMPLETED

    // Assert
    assert.isTrue(planned1.equals(planned2))
    assert.isFalse(planned1.equals(completed))
  })

  test('should create from valid string value', ({ assert }) => {
    // Act
    const status = GameStatus.fromValue('IN_PROGRESS')

    // Assert
    assert.equal(status.value, 'IN_PROGRESS')
    assert.isTrue(status.equals(GameStatus.IN_PROGRESS))
  })

  test('should throw error for invalid string value', ({ assert }) => {
    // Act & Assert
    assert.throws(() => GameStatus.fromValue('INVALID'), 'Invalid game status: INVALID')
  })

  test('should check if status can transition', ({ assert }) => {
    // Assert
    assert.isTrue(GameStatus.PLANNED.canTransitionTo(GameStatus.IN_PROGRESS))
    assert.isTrue(GameStatus.PLANNED.canTransitionTo(GameStatus.CANCELLED))
    assert.isTrue(GameStatus.IN_PROGRESS.canTransitionTo(GameStatus.COMPLETED))
    assert.isTrue(GameStatus.IN_PROGRESS.canTransitionTo(GameStatus.CANCELLED))
    
    assert.isFalse(GameStatus.COMPLETED.canTransitionTo(GameStatus.IN_PROGRESS))
    assert.isFalse(GameStatus.COMPLETED.canTransitionTo(GameStatus.CANCELLED))
    assert.isFalse(GameStatus.CANCELLED.canTransitionTo(GameStatus.IN_PROGRESS))
  })
})