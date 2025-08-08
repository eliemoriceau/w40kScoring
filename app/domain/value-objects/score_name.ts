/**
 * ScoreName Value Object
 * Represents the name/description of a score in Warhammer 40K games
 * Enforces validation rules for score naming
 */
export default class ScoreName {
  private static readonly MIN_LENGTH = 3
  private static readonly MAX_LENGTH = 100
  private static readonly VALID_CHARACTERS_REGEX = /^[a-zA-Z0-9\s.\-'",():+#%]+$/

  private readonly _value: string

  constructor(value: string) {
    const trimmedValue = value.trim()
    this.validate(trimmedValue)
    this._value = trimmedValue
  }

  get value(): string {
    return this._value
  }

  private validate(value: string): void {
    if (value.length === 0 || value.trim().length === 0) {
      throw new Error('Score name cannot be empty or contain only whitespace')
    }

    if (value.length < ScoreName.MIN_LENGTH || value.length > ScoreName.MAX_LENGTH) {
      throw new Error(
        `Score name must be between ${ScoreName.MIN_LENGTH} and ${ScoreName.MAX_LENGTH} characters long, got: ${value.length} characters`
      )
    }

    if (!ScoreName.VALID_CHARACTERS_REGEX.test(value)) {
      throw new Error(
        'Score name contains invalid characters. Only letters, numbers, spaces, and common punctuation (.-\'",():+#%) are allowed'
      )
    }
  }

  equals(other: ScoreName): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  /**
   * Get abbreviated version of the score name
   * Useful for UI display when space is limited
   */
  getAbbreviation(maxLength: number): string {
    if (this._value.length <= maxLength) {
      return this._value
    }

    return this._value.substring(0, maxLength - 3) + '...'
  }

  /**
   * Check if the score name contains a specific word (case-sensitive)
   */
  contains(word: string): boolean {
    return this._value.includes(word)
  }

  /**
   * Get the length of the score name
   */
  get length(): number {
    return this._value.length
  }
}
