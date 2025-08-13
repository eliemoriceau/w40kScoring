/**
 * UpdateScoreDto
 * Data Transfer Object for updating existing scores
 * Input boundary following hexagonal architecture
 */
export interface UpdateScoreDto {
  scoreId: string // ID of the score to update
  scoreName?: string // Optional score name update
  scoreValue: number // New score value (0-15)
  requestingUserId: number // User ID for authorization
}

/**
 * UpdateScoreDtoFactory
 * Factory with validation for creating update DTOs
 * Ensures data integrity at application boundary
 */
export class UpdateScoreDtoFactory {
  private static readonly MIN_VALUE = 0
  private static readonly MAX_VALUE = 15

  static create(data: {
    scoreId?: string
    scoreName?: string
    scoreValue?: number
    requestingUserId?: number
  }): UpdateScoreDto {
    this.validate(data)

    return {
      scoreId: data.scoreId!.trim(),
      scoreName: data.scoreName ? data.scoreName.trim() : undefined,
      scoreValue: data.scoreValue!,
      requestingUserId: data.requestingUserId!,
    }
  }

  private static validate(data: {
    scoreId?: string
    scoreName?: string
    scoreValue?: number
    requestingUserId?: number
  }): void {
    // Score ID validation
    if (!data.scoreId || typeof data.scoreId !== 'string' || data.scoreId.trim().length === 0) {
      throw new Error('Score ID is required and must be a non-empty string')
    }

    // Score name validation (optional, but if provided must be valid)
    if (data.scoreName !== undefined && data.scoreName.trim().length === 0) {
      throw new Error('Score name, if provided, must be a non-empty string')
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
