import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * InvalidScoreTypeForServiceError
 * Raised when an unsupported score type is used in ScoreService
 * Only PRIMARY, SECONDARY, CHALLENGER are allowed
 */
export class InvalidScoreTypeForServiceError extends Error {
  public readonly code = DomainErrorCodes.INVALID_SCORE_TYPE_FOR_SERVICE

  constructor(
    readonly scoreType: string,
    readonly allowedTypes: readonly string[]
  ) {
    super(
      `Invalid score type for ScoreService: ${scoreType}. Allowed types: ${allowedTypes.join(', ')}`
    )
    this.name = 'InvalidScoreTypeForServiceError'
  }
}
