import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'

/**
 * PlayerCommandRepository Interface - CQRS Command Side
 * Defines write operations for player data manipulation
 * This is a port in the hexagonal architecture focused on commands
 */
export interface PlayerCommandRepository {
  /**
   * Save a new player or update an existing one
   */
  save(player: Player): Promise<Player>

  /**
   * Delete a player
   */
  delete(id: PlayerId): Promise<void>

  /**
   * Save multiple players in a batch operation
   */
  saveBatch(players: Player[]): Promise<Player[]>

  /**
   * Delete all players for a specific game
   */
  deleteByGameId(gameId: number): Promise<void>
}
