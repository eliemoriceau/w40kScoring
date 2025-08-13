import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * UnauthorizedScoreAccessError
 * Raised when user tries to modify scores without proper authorization
 * Business rule: Only game owner and participants can modify scores
 */
export class UnauthorizedScoreAccessError extends Error {
  public readonly code = DomainErrorCodes.UNAUTHORIZED_SCORE_ACCESS

  constructor(
    readonly userId: number,
    readonly gameId: string
  ) {
    super(`User ${userId} is not authorized to modify scores for game ${gameId}`)
    this.name = 'UnauthorizedScoreAccessError'
  }
}
