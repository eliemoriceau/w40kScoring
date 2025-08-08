/**
 * ScoreId Value Object
 * Represents a unique identifier for Score entities
 * Supports both UUID v7 strings and legacy integer IDs for backward compatibility
 * Enforces validation rules for Score identification
 */
export default class ScoreId {
  private readonly _value: string

  constructor(value: number | string) {
    this.validate(value)
    this._value = this.normalize(value)
  }

  get value(): string {
    return this._value
  }

  private validate(value: number | string): void {
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new Error('Score ID must be an integer')
      }

      if (value <= 0) {
        throw new Error(`Score ID must be a positive integer, got: ${value}`)
      }
    } else if (typeof value === 'string') {
      // Validate UUID format (loose validation for flexibility)
      if (!this.isValidUuidFormat(value) && !this.isNumericString(value)) {
        throw new Error('Invalid ScoreId format. Must be a valid UUID or positive integer')
      }
    } else {
      throw new Error('ScoreId must be a number or string')
    }
  }

  private normalize(value: number | string): string {
    if (typeof value === 'number') {
      return value.toString()
    }
    return value
  }

  private isValidUuidFormat(value: string): boolean {
    // UUID format: 8-4-4-4-12 characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  }

  private isNumericString(value: string): boolean {
    const num = Number.parseInt(value, 10)
    return !Number.isNaN(num) && num > 0 && num.toString() === value
  }

  equals(other: ScoreId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
