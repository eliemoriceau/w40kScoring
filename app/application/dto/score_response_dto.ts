/**
 * ScoreResponseDto
 * Data Transfer Object for score responses
 * Output boundary following hexagonal architecture
 */
export interface ScoreResponseDto {
  id: string
  roundId: string
  playerId: string
  scoreType: string
  scoreName: string
  scoreValue: number
  canModify: boolean // Based on authorization and business rules
  createdAt: Date
}

/**
 * ScoreListResponseDto
 * Paginated response for listing scores
 */
export interface ScoreListResponseDto {
  scores: ScoreResponseDto[]
  pagination: {
    total: number
    hasMore: boolean // Always false for scores (all scores returned)
  }
}

/**
 * PlayerTotalResponseDto
 * Response for player total calculation across a game
 */
export interface PlayerTotalResponseDto {
  playerId: string
  gameId: string
  totalScore: number
  breakdown: {
    primary: number
    secondary: number
    challenger: number
  }
  scoreCount: number
}
