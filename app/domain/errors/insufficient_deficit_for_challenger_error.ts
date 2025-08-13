import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * InsufficientDeficitForChallengerError
 * Raised when player doesn't have sufficient deficit to use CHALLENGER score
 * Business rule: Player must have deficit >= 6 points in previous round
 */
export class InsufficientDeficitForChallengerError extends Error {
  public readonly code = DomainErrorCodes.INSUFFICIENT_DEFICIT_FOR_CHALLENGER

  constructor(
    readonly actualDeficit: number,
    readonly requiredDeficit: number
  ) {
    super(
      `Insufficient deficit for CHALLENGER score. Current deficit: ${actualDeficit}, required: >=${requiredDeficit} points`
    )
    this.name = 'InsufficientDeficitForChallengerError'
  }
}
