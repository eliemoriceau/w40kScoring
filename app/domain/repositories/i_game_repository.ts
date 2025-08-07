import { GameQueryRepository } from './i_game_query_repository'
import { GameCommandRepository } from './i_game_command_repository'

/**
 * GameRepository Interface - Domain Port
 * Combines both command and query operations for convenience
 * This is a port in the hexagonal architecture
 *
 * @deprecated Consider using GameQueryRepository and GameCommandRepository separately
 * for better CQRS separation. This interface is kept for backward compatibility.
 */
export interface GameRepository extends GameQueryRepository, GameCommandRepository {
  // This interface now inherits all methods from both command and query repositories
  // No additional methods needed - everything is inherited
}
