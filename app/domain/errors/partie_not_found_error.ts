import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * PartieNotFoundError
 * Raised when trying to access a non-existent partie
 * Domain error following ubiquitous language
 */
export class PartieNotFoundError extends Error {
  public readonly code = DomainErrorCodes.PARTIE_NOT_FOUND

  constructor(readonly partieId: string) {
    super(`Partie with ID '${partieId}' not found`)
    this.name = 'PartieNotFoundError'
  }
}