import ScoreType from './score_type.js'

/**
 * ScoreValue Value Object
 * Represents a score value in Warhammer 40K games
 * Enforces business rules based on score types and game context
 */
export default class ScoreValue {
  private readonly _value: number

  constructor(value: number) {
    this.validate(value)
    this._value = value
  }

  get value(): number {
    return this._value
  }

  private validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Score value must be an integer')
    }
  }

  /**
   * Factory method to create ScoreValue with type validation
   */
  static forType(value: number, scoreType: ScoreType): ScoreValue {
    const scoreValue = new ScoreValue(value)

    // Apply business rules based on score type
    if (!scoreType.allowsPositiveValues() && value > 0) {
      throw new Error(`${scoreType.value} score type does not allow positive values, got: ${value}`)
    }

    if (!scoreType.allowsNegativeValues() && value < 0) {
      throw new Error(`${scoreType.value} score type does not allow negative values, got: ${value}`)
    }

    return scoreValue
  }

  equals(other: ScoreValue): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }

  /**
   * Check if the value is positive
   */
  isPositive(): boolean {
    return this._value > 0
  }

  /**
   * Check if the value is negative
   */
  isNegative(): boolean {
    return this._value < 0
  }

  /**
   * Check if the value is zero
   */
  isZero(): boolean {
    return this._value === 0
  }

  /**
   * Get the absolute value
   */
  absolute(): number {
    return Math.abs(this._value)
  }

  /**
   * Add two score values together
   */
  add(other: ScoreValue): ScoreValue {
    return new ScoreValue(this._value + other._value)
  }

  /**
   * Subtract another score value
   */
  subtract(other: ScoreValue): ScoreValue {
    return new ScoreValue(this._value - other._value)
  }

  /**
   * Check if this value is compatible with a score type
   */
  isCompatibleWith(scoreType: ScoreType): boolean {
    if (this.isPositive() && !scoreType.allowsPositiveValues()) {
      return false
    }

    if (this.isNegative() && !scoreType.allowsNegativeValues()) {
      return false
    }

    return true
  }
}
