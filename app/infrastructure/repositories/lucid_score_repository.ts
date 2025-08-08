import { ScoreRepository } from '#domain/repositories/score_repository'
import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreValue from '#domain/value-objects/score_value'
import ScoreStatsSummary from '#domain/value-objects/score_stats_summary'
import RoundStatsSummary from '#domain/value-objects/round_stats_summary'
import PlayerRanking from '#domain/value-objects/player_ranking'
import LucidScoreQueryRepository from './lucid_score_query_repository.js'
import LucidScoreCommandRepository from './lucid_score_command_repository.js'

/**
 * LucidScoreRepository - Combined Infrastructure Adapter
 * Implements the complete ScoreRepository interface by delegating
 * to separate query and command repositories (CQRS pattern)
 */
export default class LucidScoreRepository implements ScoreRepository {
  private queryRepository: LucidScoreQueryRepository
  private commandRepository: LucidScoreCommandRepository

  constructor() {
    this.queryRepository = new LucidScoreQueryRepository()
    this.commandRepository = new LucidScoreCommandRepository()
  }

  // Query operations (delegated to query repository)
  async findById(id: ScoreId): Promise<Score | null> {
    return this.queryRepository.findById(id)
  }

  async findByRoundId(roundId: RoundId): Promise<Score[]> {
    return this.queryRepository.findByRoundId(roundId)
  }

  async findByPlayerId(playerId: PlayerId): Promise<Score[]> {
    return this.queryRepository.findByPlayerId(playerId)
  }

  async findByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<Score[]> {
    return this.queryRepository.findByRoundAndPlayer(roundId, playerId)
  }

  async findByType(scoreType: ScoreType): Promise<Score[]> {
    return this.queryRepository.findByType(scoreType)
  }

  async findByRoundAndType(roundId: RoundId, scoreType: ScoreType): Promise<Score[]> {
    return this.queryRepository.findByRoundAndType(roundId, scoreType)
  }

  async getTotalScoreByPlayer(playerId: PlayerId): Promise<ScoreValue> {
    return this.queryRepository.getTotalScoreByPlayer(playerId)
  }

  async getTotalScoreByRound(roundId: RoundId): Promise<ScoreValue> {
    return this.queryRepository.getTotalScoreByRound(roundId)
  }

  async getTotalScoreByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<ScoreValue> {
    return this.queryRepository.getTotalScoreByRoundAndPlayer(roundId, playerId)
  }

  async getScoreStatsByPlayer(playerId: PlayerId): Promise<ScoreStatsSummary> {
    return this.queryRepository.getScoreStatsByPlayer(playerId)
  }

  async getScoreStatsByRound(roundId: RoundId): Promise<RoundStatsSummary> {
    return this.queryRepository.getScoreStatsByRound(roundId)
  }

  async exists(id: ScoreId): Promise<boolean> {
    return this.queryRepository.exists(id)
  }

  async countByRound(roundId: RoundId): Promise<number> {
    return this.queryRepository.countByRound(roundId)
  }

  async countByPlayer(playerId: PlayerId): Promise<number> {
    return this.queryRepository.countByPlayer(playerId)
  }

  async findTopScoringPlayers(limit: number): Promise<PlayerRanking[]> {
    return this.queryRepository.findTopScoringPlayers(limit)
  }

  // Command operations (delegated to command repository)
  async save(score: Score): Promise<Score> {
    return this.commandRepository.save(score)
  }

  async saveBatch(scores: Score[]): Promise<Score[]> {
    return this.commandRepository.saveBatch(scores)
  }

  async delete(id: ScoreId): Promise<void> {
    return this.commandRepository.delete(id)
  }

  async deleteByRoundId(roundId: RoundId): Promise<void> {
    return this.commandRepository.deleteByRoundId(roundId)
  }

  async deleteByPlayerId(playerId: PlayerId): Promise<void> {
    return this.commandRepository.deleteByPlayerId(playerId)
  }

  async deleteByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<void> {
    return this.commandRepository.deleteByRoundAndPlayer(roundId, playerId)
  }

  async deleteMultiple(ids: ScoreId[]): Promise<void> {
    return this.commandRepository.deleteMultiple(ids)
  }
}
