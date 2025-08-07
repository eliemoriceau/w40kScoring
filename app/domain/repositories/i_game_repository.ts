import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'

/**
 * IGameRepository Interface - Domain Port
 * Defines the contract for game persistence operations
 * This is a port in the hexagonal architecture
 */
export interface IGameRepository {
  /**
   * Save a new game or update an existing one
   */
  save(game: Game): Promise<Game>

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
   * Delete a game (soft delete recommended)
   */
  delete(id: GameId): Promise<void>

  /**
   * Check if a game exists
   */
  exists(id: GameId): Promise<boolean>
}