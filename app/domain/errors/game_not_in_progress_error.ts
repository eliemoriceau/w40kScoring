import { DomainErrorCodes } from './domain_error_codes.js'

/**
 * GameNotInProgressError
 * Raised when trying to modify rounds of a game that is not in progress
 * Domain error following ubiquitous language
 */
export class GameNotInProgressError extends Error {
  public readonly code = DomainErrorCodes.GAME_NOT_IN_PROGRESS

  constructor(readonly gameId: string) {
    super(`Game ${gameId} is not in progress and cannot be modified`)
    this.name = 'GameNotInProgressError'
  }
}