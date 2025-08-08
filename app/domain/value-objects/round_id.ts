/**
 * RoundId Value Object
 * Represents a unique identifier for a Round entity
 * Enforces business rules for valid round identifiers
 */
export default class RoundId {
  constructor(private readonly _value: number) {
    this.validate(_value)
  }

  private validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Round ID must be an integer')
    }

    if (value <= 0) {
      throw new Error(`Round ID must be a positive integer, got: ${value}`)
    }
  }

  get value(): number {
    return this._value
  }

  equals(other: RoundId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }
}
