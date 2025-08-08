import PlayerId from './player_id.js'
import ScoreValue from './score_value.js'

/**
 * PlayerRanking Value Object
 * Represents a player's ranking with their total score and count
 * Used for leaderboards and player statistics
 */
export default class PlayerRanking {
  private readonly _playerId: PlayerId
  private readonly _totalScore: ScoreValue
  private readonly _scoreCount: number
  private readonly _averageScore: number

  constructor(playerId: PlayerId, totalScore: ScoreValue, scoreCount: number) {
    this.validate(scoreCount)
    this._playerId = playerId
    this._totalScore = totalScore
    this._scoreCount = scoreCount
    this._averageScore = scoreCount > 0 ? totalScore.value / scoreCount : 0
  }

  get playerId(): PlayerId {
    return this._playerId
  }

  get totalScore(): ScoreValue {
    return this._totalScore
  }

  get scoreCount(): number {
    return this._scoreCount
  }

  get averageScore(): number {
    return this._averageScore
  }

  private validate(scoreCount: number): void {
    if (!Number.isInteger(scoreCount) || scoreCount < 0) {
      throw new Error('Score count must be a non-negative integer')
    }
  }

  equals(other: PlayerRanking): boolean {
    return (
      this._playerId.equals(other._playerId) &&
      this._totalScore.equals(other._totalScore) &&
      this._scoreCount === other._scoreCount
    )
  }

  /**
   * Compare rankings by total score (descending)
   */
  compareTo(other: PlayerRanking): number {
    // Primary sort: total score (descending)
    const scoreDiff = other._totalScore.value - this._totalScore.value
    if (scoreDiff !== 0) return scoreDiff

    // Secondary sort: average score (descending)
    const avgDiff = other._averageScore - this._averageScore
    if (avgDiff !== 0) return avgDiff

    // Tertiary sort: player ID (ascending for consistency)
    return this._playerId.toString().localeCompare(other._playerId.toString())
  }

  /**
   * Check if this ranking is better than another
   */
  isBetterThan(other: PlayerRanking): boolean {
    return this.compareTo(other) < 0
  }

  toDisplay(): {
    playerId: string
    totalScore: number
    scoreCount: number
    averageScore: number
  } {
    return {
      playerId: this._playerId.toString(),
      totalScore: this._totalScore.value,
      scoreCount: this._scoreCount,
      averageScore: Math.round(this._averageScore * 100) / 100, // Round to 2 decimal places
    }
  }
}
