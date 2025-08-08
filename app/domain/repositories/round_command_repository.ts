import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'

/**
 * Round Command Repository Interface
 * Defines write operations for Round entities following CQRS pattern
 */
export interface RoundCommandRepository {
  /**
   * Save (create or update) a round
   */
  save(round: Round): Promise<Round>

  /**
   * Save multiple rounds in a batch operation
   */
  saveBatch(rounds: Round[]): Promise<Round[]>

  /**
   * Delete a round by its ID
   */
  delete(id: RoundId): Promise<void>

  /**
   * Delete all rounds for a specific game
   * Used when a game is deleted (cascade operation)
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Delete multiple rounds by their IDs
   */
  deleteMultiple(ids: RoundId[]): Promise<void>
}
