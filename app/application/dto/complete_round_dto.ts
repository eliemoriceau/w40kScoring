/**
 * CompleteRoundDto
 * Data Transfer Object for completing a round
 * Input boundary following hexagonal architecture
 */
export interface CompleteRoundDto {
  gameId: string           // ID de la partie
  roundNumber: number      // Numéro du round (1-5)
  requestingUserId: number // ID utilisateur pour autorisation
}

/**
 * CompleteRoundDtoFactory
 * Factory with validation for creating DTOs
 * Ensures data integrity at application boundary
 */
export class CompleteRoundDtoFactory {
  static create(data: {
    gameId?: string
    roundNumber?: number
    requestingUserId?: number
  }): CompleteRoundDto {
    this.validate(data)

    return {
      gameId: data.gameId!.trim(),
      roundNumber: data.roundNumber!,
      requestingUserId: data.requestingUserId!,
    }
  }

  private static validate(data: {
    gameId?: string
    roundNumber?: number
    requestingUserId?: number
  }): void {
    // Game ID validation
    if (!data.gameId || typeof data.gameId !== 'string' || data.gameId.trim().length === 0) {
      throw new Error('Game ID is required and must be a non-empty string')
    }

    // Round number validation (1-5)
    if (!Number.isInteger(data.roundNumber) || data.roundNumber < 1 || data.roundNumber > 5) {
      throw new Error('Round number must be an integer between 1 and 5')
    }

    // Requesting user validation
    if (!Number.isInteger(data.requestingUserId) || data.requestingUserId <= 0) {
      throw new Error('Requesting user ID must be a positive integer')
    }
  }
}