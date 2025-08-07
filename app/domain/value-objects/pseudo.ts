/**
 * Pseudo Value Object
 * Represents a player's display name with business rules
 */
export default class Pseudo {
  private static readonly MIN_LENGTH = 3
  private static readonly MAX_LENGTH = 50
  private static readonly VALID_CHARACTERS_REGEX = /^[a-zA-Z0-9\s\-_]+$/

  private readonly _value: string

  constructor(value: string) {
    const trimmedValue = value?.trim() || ''

    if (!trimmedValue || trimmedValue.length === 0) {
      throw new Error('Pseudo cannot be empty')
    }

    if (trimmedValue.length < Pseudo.MIN_LENGTH || trimmedValue.length > Pseudo.MAX_LENGTH) {
      throw new Error('Pseudo must be between 3 and 50 characters')
    }

    if (!Pseudo.VALID_CHARACTERS_REGEX.test(trimmedValue)) {
      throw new Error('Pseudo contains invalid characters')
    }

    this._value = trimmedValue
  }

  get value(): string {
    return this._value
  }

  equals(other: Pseudo): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
