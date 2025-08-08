import ScoreValue from './score_value.js'

/**
 * ScoreStatsSummary Value Object
 * Represents aggregated statistics for scores with business logic
 * Used by repository queries to return structured statistics
 */
export default class ScoreStatsSummary {
  private readonly _totalScore: ScoreValue
  private readonly _positiveScores: number
  private readonly _negativeScores: number
  private readonly _averageScore: number
  private readonly _scoreCount: number
  private readonly _scoresByType: Map<string, ScoreValue>

  constructor(
    totalScore: ScoreValue,
    positiveScores: number,
    negativeScores: number,
    scoreCount: number,
    scoresByType: Record<string, ScoreValue>
  ) {
    this.validate(positiveScores, negativeScores, scoreCount, scoresByType)
    this._totalScore = totalScore
    this._positiveScores = positiveScores
    this._negativeScores = negativeScores
    this._scoreCount = scoreCount
    this._averageScore = scoreCount > 0 ? totalScore.value / scoreCount : 0
    this._scoresByType = new Map(Object.entries(scoresByType))
  }

  get totalScore(): ScoreValue {
    return this._totalScore
  }

  get positiveScores(): number {
    return this._positiveScores
  }

  get negativeScores(): number {
    return this._negativeScores
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
    positiveScores: number,
    negativeScores: number,
    scoreCount: number,
    scoresByType: Record<string, ScoreValue>
  ): void {
    if (!Number.isInteger(positiveScores) || positiveScores < 0) {
      throw new Error('Positive scores count must be a non-negative integer')
    }
    if (!Number.isInteger(negativeScores) || negativeScores < 0) {
      throw new Error('Negative scores count must be a non-negative integer')
    }
    if (!Number.isInteger(scoreCount) || scoreCount < 0) {
      throw new Error('Score count must be a non-negative integer')
    }
    if (positiveScores + negativeScores > scoreCount) {
      throw new Error('Sum of positive and negative scores cannot exceed total score count')
    }
    if (!scoresByType || typeof scoresByType !== 'object') {
      throw new Error('Scores by type must be a valid object')
    }
  }

  /**
   * Get the zero scores count (neither positive nor negative)
   */
  get zeroScores(): number {
    return this._scoreCount - this._positiveScores - this._negativeScores
  }

  /**
   * Check if performance is above average (positive trend)
   */
  isAboveAverage(baseline: number = 0): boolean {
    return this._averageScore > baseline
  }

  /**
   * Get performance ratio (positive vs negative scores)
   */
  getPerformanceRatio(): number {
    if (this._negativeScores === 0) {
      return this._positiveScores > 0 ? Infinity : 0
    }
    return this._positiveScores / this._negativeScores
  }

  /**
   * Get score for a specific type
   */
  getScoreByType(scoreType: string): ScoreValue | null {
    return this._scoresByType.get(scoreType) || null
  }

  /**
   * Get all score types
   */
  getScoreTypes(): string[] {
    return Array.from(this._scoresByType.keys()).sort()
  }

  /**
   * Check if has scores of specific type
   */
  hasScoreType(scoreType: string): boolean {
    return this._scoresByType.has(scoreType)
  }

  equals(other: ScoreStatsSummary): boolean {
    if (
      !this._totalScore.equals(other._totalScore) ||
      this._positiveScores !== other._positiveScores ||
      this._negativeScores !== other._negativeScores ||
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
    positiveScores: number
    negativeScores: number
    zeroScores: number
    averageScore: number
    scoreCount: number
    performanceRatio: number
    scoresByType: Record<string, number>
  } {
    const scoresByTypeDisplay: Record<string, number> = {}
    for (const [type, value] of this._scoresByType) {
      scoresByTypeDisplay[type] = value.value
    }

    return {
      totalScore: this._totalScore.value,
      positiveScores: this._positiveScores,
      negativeScores: this._negativeScores,
      zeroScores: this.zeroScores,
      averageScore: Math.round(this._averageScore * 100) / 100,
      scoreCount: this._scoreCount,
      performanceRatio: Math.round(this.getPerformanceRatio() * 100) / 100,
      scoresByType: scoresByTypeDisplay,
    }
  }
}
