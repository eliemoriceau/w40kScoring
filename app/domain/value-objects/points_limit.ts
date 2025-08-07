/**
 * PointsLimit Value Object
 * Represents the points limit for a Warhammer 40K game
 */
export default class PointsLimit {
  private static readonly MIN_POINTS = 500
  private static readonly MAX_POINTS = 5000
  private static readonly STANDARD_TOURNAMENT_SIZES = [1000, 1500, 2000]

  private readonly _value: number

  constructor(value: number) {
    if (value < PointsLimit.MIN_POINTS || value > PointsLimit.MAX_POINTS) {
      throw new Error(
        `Points limit must be between ${PointsLimit.MIN_POINTS} and ${PointsLimit.MAX_POINTS}`
      )
    }

    if (value % 50 !== 0) {
      throw new Error('Points limit must be a multiple of 50')
    }

    this._value = value
  }

  get value(): number {
    return this._value
  }

  equals(other: PointsLimit): boolean {
    return this._value === other._value
  }

  isStandardTournamentSize(): boolean {
    return PointsLimit.STANDARD_TOURNAMENT_SIZES.includes(this._value)
  }

  getEstimatedDurationMinutes(): number {
    // Estimated game duration based on points
    if (this._value <= 500) return 60
    if (this._value <= 1000) return 90
    if (this._value <= 1500) return 105
    if (this._value <= 2000) return 120
    return 150
  }

  toString(): string {
    return `${this._value} pts`
  }
}
