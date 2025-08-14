import { IdGenerator } from '#domain/services/id_generator'
import ScoreId from '#domain/value-objects/score_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * TestIdGenerator - Test Helper
 * Provides predictable ID generation for unit and integration tests
 * Implements both ScoreId and PlayerId generation with separate counters
 */
export class TestIdGenerator implements IdGenerator {
  private scoreCounter = 1
  private playerCounter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.scoreCounter++)
  }

  generatePlayerId(): PlayerId {
    return new PlayerId(this.playerCounter++)
  }

  reset() {
    this.scoreCounter = 1
    this.playerCounter = 1
  }

  resetScoreCounter() {
    this.scoreCounter = 1
  }

  resetPlayerCounter() {
    this.playerCounter = 1
  }
}

/**
 * MockIdGenerator - Alternative name for backward compatibility
 */
export class MockIdGenerator extends TestIdGenerator {}
