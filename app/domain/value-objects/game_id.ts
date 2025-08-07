/**
 * GameId Value Object
 * Represents a unique identifier for a game
 */
export default class GameId {
  private readonly _value: number

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('GameId must be a positive integer')
    }
    this._value = value
  }

  get value(): number {
    return this._value
  }

  equals(other: GameId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }
}
