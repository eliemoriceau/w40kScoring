/**
 * JoueurResponseDto
 * Data Transfer Object for Joueur responses
 * Represents the public contract for Joueur data
 */
export interface JoueurResponseDto {
  id: string
  partieId: string
  pseudo: string
  userId?: number
  isGuest: boolean
  isOwner: boolean // If this is the creator of the partie
  createdAt: Date
}

/**
 * Paginated response for listing Joueurs
 */
export interface JoueurListResponseDto {
  joueurs: JoueurResponseDto[]
  pagination: {
    hasMore: boolean
    total: number
  }
}