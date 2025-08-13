/**
 * AddScoreDto
 * Data Transfer Object for adding a new score to a round
 * Input boundary following hexagonal architecture
 */
export interface AddScoreDto {
  roundId: string // ID of the round
  playerId: string // ID of the player
  scoreType: 'PRIMARY' | 'SECONDARY' | 'CHALLENGER' // Only allowed score types
  scoreName: string // Score name (required for SECONDARY)
  scoreValue: number // Score value (0-15)
  requestingUserId: number // User ID for authorization
}

/**
 * AddScoreDtoFactory
 * Factory with validation for creating DTOs
 * Ensures data integrity at application boundary
 */
export class AddScoreDtoFactory {
  private static readonly ALLOWED_TYPES = ['PRIMARY', 'SECONDARY', 'CHALLENGER'] as const
  private static readonly MIN_VALUE = 0
  private static readonly MAX_VALUE = 15

  static create(data: {
    roundId?: string
    playerId?: string
    scoreType?: string
    scoreName?: string
    scoreValue?: number
    requestingUserId?: number
  }): AddScoreDto {
    this.validate(data)

    return {
      roundId: data.roundId!.trim(),
      playerId: data.playerId!.trim(),
      scoreType: data.scoreType! as 'PRIMARY' | 'SECONDARY' | 'CHALLENGER',
      scoreName: data.scoreName ? data.scoreName.trim() : '',
      scoreValue: data.scoreValue!,
      requestingUserId: data.requestingUserId!,
    }
  }

  private static validate(data: {
    roundId?: string
    playerId?: string
    scoreType?: string
    scoreName?: string
    scoreValue?: number
    requestingUserId?: number
  }): void {
    // Round ID validation
    if (!data.roundId || typeof data.roundId !== 'string' || data.roundId.trim().length === 0) {
      throw new Error('Round ID is required and must be a non-empty string')
    }

    // Player ID validation
    if (!data.playerId || typeof data.playerId !== 'string' || data.playerId.trim().length === 0) {
      throw new Error('Player ID is required and must be a non-empty string')
    }

    // Score type validation
    if (
      !data.scoreType ||
      typeof data.scoreType !== 'string' ||
      !this.ALLOWED_TYPES.includes(data.scoreType as any)
    ) {
      throw new Error(
        `Score type must be one of: ${this.ALLOWED_TYPES.join(', ')}. Got: ${data.scoreType}`
      )
    }

    // Score name validation for SECONDARY type
    if (data.scoreType === 'SECONDARY' && (!data.scoreName || data.scoreName.trim().length === 0)) {
      throw new Error('Score name is required for SECONDARY score type')
    }

    // Score value validation (0-15)
    if (
      data.scoreValue === undefined ||
      !Number.isInteger(data.scoreValue) ||
      data.scoreValue < this.MIN_VALUE ||
      data.scoreValue > this.MAX_VALUE
    ) {
      throw new Error(
        `Score value must be an integer between ${this.MIN_VALUE} and ${this.MAX_VALUE}. Got: ${data.scoreValue}`
      )
    }

    // Requesting user validation
    if (
      data.requestingUserId === undefined ||
      !Number.isInteger(data.requestingUserId) ||
      data.requestingUserId <= 0
    ) {
      throw new Error('Requesting user ID must be a positive integer')
    }
  }
}
