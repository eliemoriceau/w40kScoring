/**
 * RoundResponseDto
 * Data Transfer Object for round responses
 * Output boundary following hexagonal architecture
 */
export interface RoundResponseDto {
  id: string
  gameId: string
  roundNumber: number
  playerScore: number
  opponentScore: number
  isCompleted: boolean
  winner: 'PLAYER' | 'OPPONENT' | 'DRAW' | null
  canModify: boolean // Based on authorization and game state
  createdAt: Date
  completedAt?: Date
}

/**
 * RoundListResponseDto
 * Paginated response for listing rounds
 */
export interface RoundListResponseDto {
  rounds: RoundResponseDto[]
  pagination: {
    total: number
    hasMore: boolean
  }
}

/**
 * RoundStatsDto
 * Statistics for a specific round
 */
export interface RoundStatsDto {
  roundNumber: number
  isCompleted: boolean
  playerScore: number
  opponentScore: number
  winner: 'PLAYER' | 'OPPONENT' | 'DRAW' | null
  scoreDifference: number
  cumulativePlayerScore: number
  cumulativeOpponentScore: number
}
