/**
 * PartieResponseDto
 * Data Transfer Object for Partie responses
 * Represents the public contract for Partie data
 */
export interface PartieResponseDto {
  id: string
  userId: number
  gameType: string
  pointsLimit: number
  status: string
  opponentId?: number
  mission?: string
  playerScore?: number
  opponentScore?: number
  notes?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  // Metadata for advanced operations
  metadata?: {
    winner?: 'PLAYER' | 'OPPONENT' | 'DRAW'
    isInProgress?: boolean
    canBeModified?: boolean
  }
}

/**
 * Paginated response for listing Parties
 */
export interface PartieListResponseDto {
  parties: PartieResponseDto[]
  pagination: {
    nextCursor?: string
    hasMore: boolean
    totalCount?: number
  }
  filters: {
    applied: Record<string, unknown>
    available: string[]
  }
}
