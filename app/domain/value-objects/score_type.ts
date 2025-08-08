/**
 * ScoreType Value Object
 * Represents the different types of scores in Warhammer 40K games
 * Enforces business rules for score type validation and behavior
 */
export default class ScoreType {
  private static readonly VALID_TYPES = [
    'OBJECTIVE',
    'BONUS',
    'PENALTY',
    'PRIMARY',
    'SECONDARY',
  ] as const

  private readonly _value: string

  constructor(value: string) {
    this.validate(value)
    this._value = value
  }

  get value(): string {
    return this._value
  }

  private validate(value: string): void {
    if (!ScoreType.VALID_TYPES.includes(value as any)) {
      throw new Error(
        `Invalid score type: ${value}. Valid types are: ${ScoreType.VALID_TYPES.join(', ')}`
      )
    }
  }

  static fromString(value: string): ScoreType {
    return new ScoreType(value)
  }

  static getAllValidTypes(): readonly string[] {
    return ScoreType.VALID_TYPES
  }

  equals(other: ScoreType): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  /**
   * Check if this score type allows positive values
   * PENALTY type only allows negative values, others allow positive
   */
  allowsPositiveValues(): boolean {
    return this._value !== 'PENALTY'
  }

  /**
   * Check if this score type allows negative values
   * Only PENALTY type allows negative values
   */
  allowsNegativeValues(): boolean {
    return this._value === 'PENALTY'
  }

  /**
   * Get human-readable display name
   */
  getDisplayName(): string {
    switch (this._value) {
      case 'OBJECTIVE':
        return 'Objective'
      case 'BONUS':
        return 'Bonus'
      case 'PENALTY':
        return 'Penalty'
      case 'PRIMARY':
        return 'Primary'
      case 'SECONDARY':
        return 'Secondary'
      default:
        return this._value
    }
  }
}
