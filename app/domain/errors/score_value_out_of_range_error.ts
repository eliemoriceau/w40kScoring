import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * ScoreValueOutOfRangeError
 * Raised when score value is outside allowed range (0-15 for ScoreService)
 */
export class ScoreValueOutOfRangeError extends Error {
  public readonly code = DomainErrorCodes.SCORE_VALUE_OUT_OF_RANGE

  constructor(
    readonly value: number,
    readonly min: number,
    readonly max: number
  ) {
    super(`Score value ${value} is out of range. Must be between ${min} and ${max}`)
    this.name = 'ScoreValueOutOfRangeError'
  }
}
