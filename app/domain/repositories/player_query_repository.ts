import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'

/**
 * PlayerQueryRepository Interface - CQRS Query Side
 * Defines read-only operations for player data retrieval
 * This is a port in the hexagonal architecture focused on queries
 */
export interface PlayerQueryRepository {
  /**
   * Find a player by their unique identifier
   */
  findById(id: PlayerId): Promise<Player | null>

  /**
   * Find all players for a specific game
   */
  findByGameId(gameId: GameId): Promise<Player[]>

  /**
   * Find players by user ID across all games
   */
  findByUserId(userId: number): Promise<Player[]>

  /**
   * Find player by game and user (for registered users)
   */
  findByGameAndUser(gameId: GameId, userId: number): Promise<Player | null>

  /**
   * Check if a player exists
   */
  exists(id: PlayerId): Promise<boolean>

  /**
   * Check if a pseudo is already used in a specific game
   */
  isPseudoTakenInGame(gameId: GameId, pseudo: string): Promise<boolean>

  /**
   * Count players in a specific game
   */
  countByGame(gameId: GameId): Promise<number>

  /**
   * Find guest players (not linked to any user)
   */
  findGuestPlayers(gameId: GameId): Promise<Player[]>

  /**
   * Find players by pseudo pattern (for search/autocomplete)
   */
  findByPseudoPattern(pattern: string, limit: number): Promise<Player[]>
}
