import { RoundRepository } from '#domain/repositories/round_repository'
import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import LucidRoundQueryRepository from './lucid_round_query_repository.js'
import LucidRoundCommandRepository from './lucid_round_command_repository.js'

/**
 * LucidRoundRepository - Combined Infrastructure Adapter
 * Implements the complete RoundRepository interface by delegating
 * to separate query and command repositories (CQRS pattern)
 */
export default class LucidRoundRepository implements RoundRepository {
  private queryRepository: LucidRoundQueryRepository
  private commandRepository: LucidRoundCommandRepository

  constructor() {
    this.queryRepository = new LucidRoundQueryRepository()
    this.commandRepository = new LucidRoundCommandRepository()
  }

  // Query operations (delegated to query repository)
  async findById(id: RoundId): Promise<Round | null> {
    return this.queryRepository.findById(id)
  }

  async findByGameId(gameId: GameId): Promise<Round[]> {
    return this.queryRepository.findByGameId(gameId)
  }

  async findByGameIdAndNumber(gameId: GameId, roundNumber: RoundNumber): Promise<Round | null> {
    return this.queryRepository.findByGameIdAndNumber(gameId, roundNumber)
  }

  async countCompletedRoundsByGame(gameId: GameId): Promise<number> {
    return this.queryRepository.countCompletedRoundsByGame(gameId)
  }

  async countRoundsByGame(gameId: GameId): Promise<number> {
    return this.queryRepository.countRoundsByGame(gameId)
  }

  async exists(id: RoundId): Promise<boolean> {
    return this.queryRepository.exists(id)
  }

  async findLatestRoundForGame(gameId: GameId): Promise<Round | null> {
    return this.queryRepository.findLatestRoundForGame(gameId)
  }

  async findIncompleteRoundsByGame(gameId: GameId): Promise<Round[]> {
    return this.queryRepository.findIncompleteRoundsByGame(gameId)
  }

  async getRoundStatsByGame(gameId: GameId): Promise<{
    totalRounds: number
    completedRounds: number
    totalPlayerScore: number
    totalOpponentScore: number
    playerWins: number
    opponentWins: number
    draws: number
  }> {
    return this.queryRepository.getRoundStatsByGame(gameId)
  }

  // Command operations (delegated to command repository)
  async save(round: Round): Promise<Round> {
    return this.commandRepository.save(round)
  }

  async saveBatch(rounds: Round[]): Promise<Round[]> {
    return this.commandRepository.saveBatch(rounds)
  }

  async delete(id: RoundId): Promise<void> {
    return this.commandRepository.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    return this.commandRepository.deleteByGameId(gameId)
  }

  async deleteMultiple(ids: RoundId[]): Promise<void> {
    return this.commandRepository.deleteMultiple(ids)
  }
}
