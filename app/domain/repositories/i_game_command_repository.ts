import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'

/**
 * IGameCommandRepository Interface - CQRS Command Side
 * Defines write operations for game data manipulation
 * This is a port in the hexagonal architecture focused on commands
 */
export interface IGameCommandRepository {
  /**
   * Save a new game or update an existing one
   */
  save(game: Game): Promise<Game>

  /**
   * Delete a game (soft delete recommended)
   */
  delete(id: GameId): Promise<void>

  /**
   * Save multiple games in a batch operation
   */
  saveBatch(games: Game[]): Promise<Game[]>

  /**
   * Update game status for multiple games
   */
  bulkUpdateStatus(gameIds: GameId[], status: string): Promise<void>
}