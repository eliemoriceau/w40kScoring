import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * ChallengerAlreadyExistsInRoundError
 * Raised when trying to add a second CHALLENGER score in the same round
 * Business rule: Only one CHALLENGER score per round is allowed
 */
export class ChallengerAlreadyExistsInRoundError extends Error {
  public readonly code = DomainErrorCodes.CHALLENGER_ALREADY_EXISTS_IN_ROUND

  constructor(readonly roundId: string) {
    super(
      `A CHALLENGER score already exists in round ${roundId}. Only one CHALLENGER per round is allowed`
    )
    this.name = 'ChallengerAlreadyExistsInRoundError'
  }
}
