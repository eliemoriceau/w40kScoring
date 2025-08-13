import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * UnauthorizedRoundAccessError
 * Raised when user tries to access or modify rounds they don't have permission for
 * Domain error following ubiquitous language
 */
export class UnauthorizedRoundAccessError extends Error {
  public readonly code = DomainErrorCodes.UNAUTHORIZED_ROUND_ACCESS

  constructor(readonly gameId: string, readonly userId: number) {
    super(`User ${userId} is not authorized to access rounds for game ${gameId}`)
    this.name = 'UnauthorizedRoundAccessError'
  }
}