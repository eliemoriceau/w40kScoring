import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * InvalidScoresError
 * Raised when scores provided are invalid (negative, non-integer, etc.)
 * Domain error following ubiquitous language
 */
export class InvalidScoresError extends Error {
  public readonly code = DomainErrorCodes.INVALID_SCORES

  constructor(readonly reason: string) {
    super(`Invalid scores: ${reason}`)
    this.name = 'InvalidScoresError'
  }
}