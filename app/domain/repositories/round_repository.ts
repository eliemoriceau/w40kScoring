import { RoundQueryRepository } from './round_query_repository.js'
import { RoundCommandRepository } from './round_command_repository.js'

/**
 * Combined Round Repository Interface
 * Provides both query and command operations for Round entities
 * Follows the same pattern as other repositories in the system
 */
export interface RoundRepository extends RoundQueryRepository, RoundCommandRepository {}
