/**
 * RoundNumber Value Object
 * Represents a round number in a Warhammer 40K game (1-5)
 * Enforces business rules for valid round numbers
 */
export default class RoundNumber {
  private static readonly MIN_ROUND = 1
  private static readonly MAX_ROUND = 5

  constructor(private readonly _value: number) {
    this.validate(_value)
  }

  private validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Round number must be an integer')
    }

    if (value < RoundNumber.MIN_ROUND || value > RoundNumber.MAX_ROUND) {
      throw new Error('Round number must be between 1 and 5')
    }
  }

  get value(): number {
    return this._value
  }

  equals(other: RoundNumber): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }

  toOrdinal(): string {
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th']
    return ordinals[this._value]
  }

  static fromString(value: string): RoundNumber {
    const numValue = Number.parseInt(value, 10)

    if (Number.isNaN(numValue)) {
      throw new Error('Invalid round number format')
    }

    return new RoundNumber(numValue)
  }

  next(): RoundNumber {
    if (this.isFinal()) {
      throw new Error('Round 5 is the final round')
    }

    return new RoundNumber(this._value + 1)
  }

  isFinal(): boolean {
    return this._value === RoundNumber.MAX_ROUND
  }

  static get MIN(): number {
    return RoundNumber.MIN_ROUND
  }

  static get MAX(): number {
    return RoundNumber.MAX_ROUND
  }
}
