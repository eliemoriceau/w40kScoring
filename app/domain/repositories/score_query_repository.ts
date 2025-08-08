import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'

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
  getTotalScoreByPlayer(playerId: PlayerId): Promise<number>

  /**
   * Get total score for a specific round
   */
  getTotalScoreByRound(roundId: RoundId): Promise<number>

  /**
   * Get total score for a player in a specific round
   */
  getTotalScoreByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<number>

  /**
   * Get score statistics by player
   */
  getScoreStatsByPlayer(playerId: PlayerId): Promise<{
    totalScore: number
    positiveScores: number
    negativeScores: number
    averageScore: number
    scoreCount: number
    scoresByType: Record<string, number>
  }>

  /**
   * Get score statistics by round
   */
  getScoreStatsByRound(roundId: RoundId): Promise<{
    totalScore: number
    playerCount: number
    averageScore: number
    scoreCount: number
    scoresByType: Record<string, number>
  }>

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
  findTopScoringPlayers(limit: number): Promise<
    Array<{
      playerId: number
      totalScore: number
      scoreCount: number
    }>
  >
}
