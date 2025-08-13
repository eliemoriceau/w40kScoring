import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * ChallengerForbiddenInFirstRoundError
 * Raised when trying to add CHALLENGER score in the first round
 * CHALLENGER requires previous round data for deficit calculation
 */
export class ChallengerForbiddenInFirstRoundError extends Error {
  public readonly code = DomainErrorCodes.CHALLENGER_FORBIDDEN_IN_FIRST_ROUND

  constructor() {
    super(
      'CHALLENGER score is forbidden in the first round (no previous round for deficit calculation)'
    )
    this.name = 'ChallengerForbiddenInFirstRoundError'
  }
}
