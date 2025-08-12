/**
 * CreatePartieDto
 * Data Transfer Object for creating a new Partie
 * Follows DDD principles for application layer contracts
 */
export interface CreatePartieDto {
  userId: number
  gameType: string
  pointsLimit: number
  opponentId?: number
  mission?: string
}

/**
 * Factory for creating validated CreatePartieDto instances
 */
export class CreatePartieDtoFactory {
  static create(data: {
    userId: number
    gameType: string
    pointsLimit: number
    opponentId?: number
    mission?: string
  }): CreatePartieDto {
    this.validate(data)

    return {
      userId: data.userId,
      gameType: data.gameType.trim(),
      pointsLimit: data.pointsLimit,
      opponentId: data.opponentId,
      mission: data.mission?.trim() || undefined,
    }
  }

  private static validate(data: Partial<CreatePartieDto>): void {
    if (!data.userId || !Number.isInteger(data.userId) || data.userId <= 0) {
      throw new Error('User ID must be a positive integer')
    }

    if (!data.gameType || typeof data.gameType !== 'string' || data.gameType.trim() === '') {
      throw new Error('Game type cannot be empty')
    }

    if (!data.pointsLimit || !Number.isInteger(data.pointsLimit) || data.pointsLimit <= 0) {
      throw new Error('Points limit must be a positive integer')
    }

    if (
      data.opponentId !== undefined &&
      (!Number.isInteger(data.opponentId) || data.opponentId <= 0)
    ) {
      throw new Error('Opponent ID must be a positive integer')
    }
  }
}
