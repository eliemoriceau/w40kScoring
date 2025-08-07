/**
 * PlayerId Value Object
 * Represents a unique identifier for a player within the system
 */
export default class PlayerId {
  private readonly _value: number

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Player ID must be a positive integer')
    }

    this._value = value
  }

  get value(): number {
    return this._value
  }

  equals(other: PlayerId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value.toString()
  }
}
