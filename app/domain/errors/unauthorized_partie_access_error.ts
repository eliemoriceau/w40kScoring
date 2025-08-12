import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * UnauthorizedPartieAccessError
 * Raised when user tries to access a partie they don't own or aren't authorized to access
 * Domain error following ubiquitous language
 */
export class UnauthorizedPartieAccessError extends Error {
  public readonly code = DomainErrorCodes.UNAUTHORIZED_PARTIE_ACCESS

  constructor(readonly partieId: string, readonly userId: number) {
    super(`User ${userId} is not authorized to access partie ${partieId}`)
    this.name = 'UnauthorizedPartieAccessError'
  }
}