import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * RoundAlreadyCompletedError
 * Raised when trying to modify a round that is already completed
 * Domain error following ubiquitous language
 */
export class RoundAlreadyCompletedError extends Error {
  public readonly code = DomainErrorCodes.ROUND_ALREADY_COMPLETED

  constructor(readonly gameId: string, readonly roundNumber: number) {
    super(`Round ${roundNumber} in game ${gameId} is already completed`)
    this.name = 'RoundAlreadyCompletedError'
  }
}