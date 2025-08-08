import { ScoreQueryRepository } from './score_query_repository.js'
import { ScoreCommandRepository } from './score_command_repository.js'

/**
 * Combined Score Repository Interface
 * Provides both query and command operations for Score entities
 * Follows the same pattern as other repositories in the system
 */
export interface ScoreRepository extends ScoreQueryRepository, ScoreCommandRepository {}
