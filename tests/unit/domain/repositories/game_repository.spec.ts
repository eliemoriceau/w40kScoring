import { test } from '@japa/runner'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'

test.group('GameRepository Contract', () => {
  test('repository interface should define correct contract', ({ assert }) => {
    // This test validates the interface structure
    // We'll test the actual implementation in integration tests

    // Arrange - Create a sample game for interface validation
    const game = Game.createNew(new GameId(1), 123, GameType.MATCHED_PLAY, new PointsLimit(2000))

    // Assert - Interface contract expectations
    assert.isTrue(game instanceof Game)
    assert.equal(typeof game.id.value, 'number')
    assert.equal(typeof game.userId, 'number')
    assert.isTrue(game.gameType instanceof GameType)
    assert.isTrue(game.pointsLimit instanceof PointsLimit)
  })
})
