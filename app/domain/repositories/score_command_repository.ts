import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * ScoreCommandRepository Interface
 * Defines write operations for Score entities
 * Part of CQRS pattern - separates command operations from queries
 */
export interface ScoreCommandRepository {
  /**
   * Save a score (create or update)
   */
  save(score: Score): Promise<Score>

  /**
   * Save multiple scores in batch
   */
  saveBatch(scores: Score[]): Promise<Score[]>

  /**
   * Delete a score by its ID
   */
  delete(id: ScoreId): Promise<void>

  /**
   * Delete all scores for a specific round
   */
  deleteByRoundId(roundId: RoundId): Promise<void>

  /**
   * Delete all scores for a specific player
   */
  deleteByPlayerId(playerId: PlayerId): Promise<void>

  /**
   * Delete scores for a specific player in a specific round
   */
  deleteByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<void>

  /**
   * Delete multiple scores by their IDs
   */
  deleteMultiple(ids: ScoreId[]): Promise<void>
}
