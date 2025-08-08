import ScoreId from '#domain/value-objects/score_id'

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
}
