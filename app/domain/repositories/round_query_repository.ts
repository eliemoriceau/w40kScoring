import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'

/**
 * Round Query Repository Interface
 * Defines read operations for Round entities following CQRS pattern
 */
export interface RoundQueryRepository {
  /**
   * Find a round by its unique identifier
   */
  findById(id: RoundId): Promise<Round | null>

  /**
   * Find all rounds for a specific game, ordered by round number
   */
  findByGameId(gameId: GameId): Promise<Round[]>

  /**
   * Find a specific round by game and round number
   */
  findByGameIdAndNumber(gameId: GameId, roundNumber: RoundNumber): Promise<Round | null>

  /**
   * Count completed rounds for a specific game
   */
  countCompletedRoundsByGame(gameId: GameId): Promise<number>

  /**
   * Count total rounds for a specific game
   */
  countRoundsByGame(gameId: GameId): Promise<number>

  /**
   * Check if a round exists by ID
   */
  exists(id: RoundId): Promise<boolean>

  /**
   * Find the latest round for a game (highest round number)
   */
  findLatestRoundForGame(gameId: GameId): Promise<Round | null>

  /**
   * Find all incomplete rounds for a game
   */
  findIncompleteRoundsByGame(gameId: GameId): Promise<Round[]>

  /**
   * Get round statistics for a game (total scores, completed rounds, etc.)
   */
  getRoundStatsByGame(gameId: GameId): Promise<{
    totalRounds: number
    completedRounds: number
    totalPlayerScore: number
    totalOpponentScore: number
    playerWins: number
    opponentWins: number
    draws: number
  }>
}
