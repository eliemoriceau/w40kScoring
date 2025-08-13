/**
 * UpdateRoundScoresDto
 * Data Transfer Object for updating round scores
 * Input boundary following hexagonal architecture
 */
export interface UpdateRoundScoresDto {
  gameId: string           // ID de la partie
  roundNumber: number      // Numéro du round (1-5)
  playerScore: number      // Score du joueur (≥ 0)
  opponentScore: number    // Score de l'adversaire (≥ 0)
  requestingUserId: number // ID utilisateur pour autorisation
}

/**
 * UpdateRoundScoresDtoFactory
 * Factory with validation for creating DTOs
 * Ensures data integrity at application boundary
 */
export class UpdateRoundScoresDtoFactory {
  static create(data: {
    gameId?: string
    roundNumber?: number
    playerScore?: number
    opponentScore?: number
    requestingUserId?: number
  }): UpdateRoundScoresDto {
    this.validate(data)

    return {
      gameId: data.gameId!.trim(),
      roundNumber: data.roundNumber!,
      playerScore: data.playerScore!,
      opponentScore: data.opponentScore!,
      requestingUserId: data.requestingUserId!,
    }
  }

  private static validate(data: {
    gameId?: string
    roundNumber?: number
    playerScore?: number
    opponentScore?: number
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

    // Player score validation
    if (!Number.isInteger(data.playerScore) || data.playerScore < 0) {
      throw new Error('Player score must be a non-negative integer')
    }

    // Opponent score validation  
    if (!Number.isInteger(data.opponentScore) || data.opponentScore < 0) {
      throw new Error('Opponent score must be a non-negative integer')
    }

    // Requesting user validation
    if (!Number.isInteger(data.requestingUserId) || data.requestingUserId <= 0) {
      throw new Error('Requesting user ID must be a positive integer')
    }
  }
}