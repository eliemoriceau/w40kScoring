import ScoreValue from './score_value.js'

/**
 * RoundStatsSummary Value Object
 * Represents aggregated statistics for a round with business logic
 * Used by repository queries to return structured round statistics
 */
export default class RoundStatsSummary {
  private readonly _totalScore: ScoreValue
  private readonly _playerCount: number
  private readonly _averageScore: number
  private readonly _scoreCount: number
  private readonly _scoresByType: Map<string, ScoreValue>

  constructor(
    totalScore: ScoreValue,
    playerCount: number,
    scoreCount: number,
    scoresByType: Record<string, ScoreValue>
  ) {
    this.validate(playerCount, scoreCount, scoresByType)
    this._totalScore = totalScore
    this._playerCount = playerCount
    this._scoreCount = scoreCount
    this._averageScore = playerCount > 0 ? totalScore.value / playerCount : 0
    this._scoresByType = new Map(Object.entries(scoresByType))
  }

  get totalScore(): ScoreValue {
    return this._totalScore
  }

  get playerCount(): number {
    return this._playerCount
  }

  get averageScore(): number {
    return this._averageScore
  }

  get scoreCount(): number {
    return this._scoreCount
  }

  get scoresByType(): Record<string, ScoreValue> {
    return Object.fromEntries(this._scoresByType)
  }

  private validate(
    playerCount: number,
    scoreCount: number,
    scoresByType: Record<string, ScoreValue>
  ): void {
    if (!Number.isInteger(playerCount) || playerCount < 0) {
      throw new Error('Player count must be a non-negative integer')
    }
    if (!Number.isInteger(scoreCount) || scoreCount < 0) {
      throw new Error('Score count must be a non-negative integer')
    }
    if (!scoresByType || typeof scoresByType !== 'object') {
      throw new Error('Scores by type must be a valid object')
    }
  }

  /**
   * Get average scores per player
   */
  getAverageScoresPerPlayer(): number {
    return this._playerCount > 0 ? this._scoreCount / this._playerCount : 0
  }

  /**
   * Get score for a specific type
   */
  getScoreByType(scoreType: string): ScoreValue | null {
    return this._scoresByType.get(scoreType) || null
  }

  /**
   * Get all score types in this round
   */
  getScoreTypes(): string[] {
    return Array.from(this._scoresByType.keys()).sort()
  }

  /**
   * Check if round has scores of specific type
   */
  hasScoreType(scoreType: string): boolean {
    return this._scoresByType.has(scoreType)
  }

  /**
   * Get the most valuable score type in this round
   */
  getHighestScoringType(): { type: string; score: ScoreValue } | null {
    if (this._scoresByType.size === 0) return null

    let highestType = ''
    let highestScore: ScoreValue | null = null

    for (const [type, score] of this._scoresByType) {
      if (!highestScore || score.value > highestScore.value) {
        highestType = type
        highestScore = score
      }
    }

    return highestScore ? { type: highestType, score: highestScore } : null
  }

  /**
   * Check if this is a high-scoring round
   */
  isHighScoringRound(threshold: number = 50): boolean {
    return this._averageScore >= threshold
  }

  /**
   * Check if round has competitive balance (std deviation analysis)
   */
  hasCompetitiveBalance(maxAverageDeviation: number = 20): boolean {
    // Simple heuristic: if average score per player is reasonable
    const avgPerPlayer = this.getAverageScoresPerPlayer()
    return avgPerPlayer >= 3 && avgPerPlayer <= maxAverageDeviation
  }

  equals(other: RoundStatsSummary): boolean {
    if (
      !this._totalScore.equals(other._totalScore) ||
      this._playerCount !== other._playerCount ||
      this._scoreCount !== other._scoreCount
    ) {
      return false
    }

    // Compare scoresByType maps
    if (this._scoresByType.size !== other._scoresByType.size) {
      return false
    }

    for (const [type, value] of this._scoresByType) {
      const otherValue = other._scoresByType.get(type)
      if (!otherValue || !value.equals(otherValue)) {
        return false
      }
    }

    return true
  }

  toDisplay(): {
    totalScore: number
    playerCount: number
    averageScore: number
    scoreCount: number
    averageScoresPerPlayer: number
    isHighScoring: boolean
    hasCompetitiveBalance: boolean
    scoresByType: Record<string, number>
    highestScoringType: { type: string; score: number } | null
  } {
    const scoresByTypeDisplay: Record<string, number> = {}
    for (const [type, value] of this._scoresByType) {
      scoresByTypeDisplay[type] = value.value
    }

    const highestScoring = this.getHighestScoringType()

    return {
      totalScore: this._totalScore.value,
      playerCount: this._playerCount,
      averageScore: Math.round(this._averageScore * 100) / 100,
      scoreCount: this._scoreCount,
      averageScoresPerPlayer: Math.round(this.getAverageScoresPerPlayer() * 100) / 100,
      isHighScoring: this.isHighScoringRound(),
      hasCompetitiveBalance: this.hasCompetitiveBalance(),
      scoresByType: scoresByTypeDisplay,
      highestScoringType: highestScoring
        ? { type: highestScoring.type, score: highestScoring.score.value }
        : null,
    }
  }
}
