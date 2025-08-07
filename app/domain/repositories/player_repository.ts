import { PlayerQueryRepository } from './player_query_repository.js'
import { PlayerCommandRepository } from './player_command_repository.js'

/**
 * PlayerRepository Interface - Domain Port
 * Combines both command and query operations for convenience
 * This is a port in the hexagonal architecture
 *
 * @deprecated Consider using PlayerQueryRepository and PlayerCommandRepository separately
 * for better CQRS separation. This interface is kept for backward compatibility.
 */
export interface PlayerRepository extends PlayerQueryRepository, PlayerCommandRepository {
  // This interface now inherits all methods from both command and query repositories
  // No additional methods needed - everything is inherited
}
