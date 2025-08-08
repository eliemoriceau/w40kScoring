/**
 * ScoreId Value Object
 * Represents a unique identifier for Score entities
 * Enforces validation rules for Score identification
 */
export default class ScoreId {
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
      throw new Error('Score ID must be an integer')
    }

    if (value <= 0) {
      throw new Error(`Score ID must be a positive integer, got: ${value}`)
    }
  }

  equals(other: ScoreId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }
}
