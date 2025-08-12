import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * PseudoAlreadyTakenError
 * Raised when a pseudo is already used in a specific partie
 * Domain error following ubiquitous language
 */
export class PseudoAlreadyTakenError extends Error {
  public readonly code = DomainErrorCodes.PSEUDO_ALREADY_TAKEN

  constructor(readonly pseudo: string, readonly partieId: string) {
    super(`Pseudo '${pseudo}' is already taken in partie ${partieId}`)
    this.name = 'PseudoAlreadyTakenError'
  }
}