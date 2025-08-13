import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * SecondaryScoreNameRequiredError
 * Raised when SECONDARY score is created without a name
 */
export class SecondaryScoreNameRequiredError extends Error {
  public readonly code = DomainErrorCodes.SECONDARY_SCORE_NAME_REQUIRED

  constructor() {
    super('Score name is required for SECONDARY score type')
    this.name = 'SecondaryScoreNameRequiredError'
  }
}
