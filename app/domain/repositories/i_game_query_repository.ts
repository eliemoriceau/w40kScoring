import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'

/**
 * GameQueryRepository Interface - CQRS Query Side
 * Defines read-only operations for game data retrieval
 * This is a port in the hexagonal architecture focused on queries
 */
export interface GameQueryRepository {
  /**
   * Find a game by its unique identifier
   */
  findById(id: GameId): Promise<Game | null>

  /**
   * Find all games for a specific user
   */
  findByUserId(userId: number): Promise<Game[]>

  /**
   * Find games by user with filtering and pagination
   */
  findByUserIdWithFilters(
    userId: number,
    filters: {
      status?: string[]
      gameType?: string[]
      limit?: number
      offset?: number
    }
  ): Promise<{
    games: Game[]
    total: number
  }>

  /**
   * Check if a game exists
   */
  exists(id: GameId): Promise<boolean>

  /**
   * Get games count by status for a user
   */
  countByUserAndStatus(userId: number, status: string): Promise<number>

  /**
   * Find recent games for a user
   */
  findRecentByUserId(userId: number, limit: number): Promise<Game[]>

  /**
   * Find games by opponent
   */
  findByOpponent(userId: number, opponentId: number): Promise<Game[]>
}
