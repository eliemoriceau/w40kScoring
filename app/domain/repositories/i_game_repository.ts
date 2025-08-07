import { IGameQueryRepository } from './i_game_query_repository'
import { IGameCommandRepository } from './i_game_command_repository'

/**
 * IGameRepository Interface - Domain Port
 * Combines both command and query operations for convenience
 * This is a port in the hexagonal architecture
 * 
 * @deprecated Consider using IGameQueryRepository and IGameCommandRepository separately
 * for better CQRS separation. This interface is kept for backward compatibility.
 */
export interface IGameRepository extends IGameQueryRepository, IGameCommandRepository {
  // This interface now inherits all methods from both command and query repositories
  // No additional methods needed - everything is inherited
}