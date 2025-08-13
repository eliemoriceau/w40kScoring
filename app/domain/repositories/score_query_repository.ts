import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import ScoreType from '#domain/value-objects/score_type'
import PlayerRanking from '#domain/value-objects/player_ranking'
import ScoreStatsSummary from '#domain/value-objects/score_stats_summary'
import RoundStatsSummary from '#domain/value-objects/round_stats_summary'
import ScoreValue from '#domain/value-objects/score_value'

/**
 * ScoreQueryRepository Interface
 * Defines read operations for Score entities
 * Part of CQRS pattern - separates query operations from commands
 */
export interface ScoreQueryRepository {
  /**
   * Find a score by its unique identifier
   */
  findById(id: ScoreId): Promise<Score | null>

  /**
   * Find all scores for a specific round
   */
  findByRoundId(roundId: RoundId): Promise<Score[]>

  /**
   * Find all scores for a specific player
   */
  findByPlayerId(playerId: PlayerId): Promise<Score[]>

  /**
   * Find scores for a specific player in a specific round
   */
  findByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<Score[]>

  /**
   * Find scores by type (e.g., all PRIMARY scores)
   */
  findByType(scoreType: ScoreType): Promise<Score[]>

  /**
   * Find scores by round and type
   */
  findByRoundAndType(roundId: RoundId, scoreType: ScoreType): Promise<Score[]>

  /**
   * Get total score for a player across all rounds
   */
  getTotalScoreByPlayer(playerId: PlayerId): Promise<ScoreValue>

  /**
   * Get total score for a specific round
   */
  getTotalScoreByRound(roundId: RoundId): Promise<ScoreValue>

  /**
   * Get total score for a player in a specific round
   */
  getTotalScoreByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<ScoreValue>

  /**
   * Get score statistics by player
   */
  getScoreStatsByPlayer(playerId: PlayerId): Promise<ScoreStatsSummary>

  /**
   * Get score statistics by round
   */
  getScoreStatsByRound(roundId: RoundId): Promise<RoundStatsSummary>

  /**
   * Check if a score exists
   */
  exists(id: ScoreId): Promise<boolean>

  /**
   * Count scores by round
   */
  countByRound(roundId: RoundId): Promise<number>

  /**
   * Count scores by player
   */
  countByPlayer(playerId: PlayerId): Promise<number>

  /**
   * Find top scoring players
   */
  findTopScoringPlayers(limit: number): Promise<PlayerRanking[]>

  /**
   * Check if CHALLENGER score already exists in a specific round
   * Used to enforce business rule: only one CHALLENGER per round
   */
  existsChallengerInRound(roundId: RoundId): Promise<boolean>

  /**
   * Get all scores for a player in a specific game
   * Used for total calculations across all rounds of a game
   */
  findByPlayerInGame(playerId: PlayerId, gameId: GameId): Promise<Score[]>

  /**
   * Get total score value for a player in a specific game
   * Optimized aggregation query for performance
   */
  getTotalByPlayerInGame(playerId: PlayerId, gameId: GameId): Promise<ScoreValue>

  /**
   * Find all players in a game (for opponent identification)
   * Used for CHALLENGER deficit calculation
   */
  findPlayersInGame(gameId: GameId): Promise<PlayerId[]>
}
