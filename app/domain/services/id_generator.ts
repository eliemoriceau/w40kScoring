import ScoreId from '#domain/value-objects/score_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * IdGenerator Interface
 * Defines the contract for ID generation services
 * Follows hexagonal architecture - domain interface implemented by infrastructure
 */
export interface IdGenerator {
  /**
   * Generate a new unique ScoreId
   */
  generateScoreId(): ScoreId

  /**
   * Generate a new unique PlayerId
   * Note: In production with auto-increment IDs, this is used as temporary ID
   * until the database assigns the final ID through repository.save()
   */
  generatePlayerId(): PlayerId
}
