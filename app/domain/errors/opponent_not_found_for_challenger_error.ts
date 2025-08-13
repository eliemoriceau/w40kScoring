import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * OpponentNotFoundForChallengerError
 * Raised when opponent cannot be found for CHALLENGER deficit calculation
 */
export class OpponentNotFoundForChallengerError extends Error {
  public readonly code = DomainErrorCodes.OPPONENT_NOT_FOUND_FOR_CHALLENGER

  constructor(
    readonly gameId: string,
    readonly playerId: string
  ) {
    super(
      `Cannot find opponent for player ${playerId} in game ${gameId} for CHALLENGER deficit calculation`
    )
    this.name = 'OpponentNotFoundForChallengerError'
  }
}
