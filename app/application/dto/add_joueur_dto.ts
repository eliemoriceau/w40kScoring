/**
 * AddJoueurDto
 * Data Transfer Object for adding a joueur to a partie
 * Follows DDD principles for application layer contracts
 */
export interface AddJoueurDto {
  partieId: string
  pseudo: string
  userId?: number
  requestingUserId: number // For authorization
}

/**
 * Factory for creating validated AddJoueurDto instances
 */
export class AddJoueurDtoFactory {
  static create(data: {
    partieId: string
    pseudo: string
    userId?: number
    requestingUserId: number
  }): AddJoueurDto {
    this.validate(data)

    return {
      partieId: data.partieId.trim(),
      pseudo: data.pseudo.trim(),
      userId: data.userId,
      requestingUserId: data.requestingUserId,
    }
  }

  private static validate(data: Partial<AddJoueurDto>): void {
    if (!data.partieId || typeof data.partieId !== 'string' || data.partieId.trim() === '') {
      throw new Error('Partie ID is required and must be a non-empty string')
    }

    if (!data.pseudo || typeof data.pseudo !== 'string' || data.pseudo.trim().length < 2) {
      throw new Error('Pseudo is required and must be at least 2 characters')
    }

    if (data.pseudo.trim().length > 20) {
      throw new Error('Pseudo cannot exceed 20 characters')
    }

    if (
      !data.requestingUserId ||
      !Number.isInteger(data.requestingUserId) ||
      data.requestingUserId <= 0
    ) {
      throw new Error('Requesting user ID must be a positive integer')
    }

    if (data.userId !== undefined && (!Number.isInteger(data.userId) || data.userId <= 0)) {
      throw new Error('User ID must be a positive integer when provided')
    }
  }
}
