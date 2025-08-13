import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * RoundNotFoundError
 * Raised when a round cannot be found for a specific game and round number
 * Domain error following ubiquitous language
 */
export class RoundNotFoundError extends Error {
  public readonly code = DomainErrorCodes.ROUND_NOT_FOUND

  constructor(
    readonly gameId: string,
    readonly roundNumber: number
  ) {
    super(`Round ${roundNumber} not found for game ${gameId}`)
    this.name = 'RoundNotFoundError'
  }
}
