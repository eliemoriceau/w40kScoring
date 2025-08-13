import { ScoreQueryRepository } from '#domain/repositories/score_query_repository'
import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import ScoreStatsSummary from '#domain/value-objects/score_stats_summary'
import RoundStatsSummary from '#domain/value-objects/round_stats_summary'
import PlayerRanking from '#domain/value-objects/player_ranking'
import ScoreModel from '#models/score'

/**
 * LucidScoreQueryRepository - Infrastructure Adapter for Queries
 * Implements the ScoreQueryRepository domain port using Lucid ORM (Read-only operations)
 */
export default class LucidScoreQueryRepository implements ScoreQueryRepository {
  async findById(id: ScoreId): Promise<Score | null> {
    const scoreModel = await ScoreModel.find(id.value)

    if (!scoreModel) {
      return null
    }

    return this.toDomainEntity(scoreModel)
  }

  async findByRoundId(roundId: RoundId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('round_id', roundId.value)
      .orderBy('created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByPlayerId(playerId: PlayerId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('joueur_id', playerId.value)
      .orderBy('created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('joueur_id', playerId.value)
      .orderBy('created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByType(scoreType: ScoreType): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('type_score', scoreType.value)
      .orderBy('created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByRoundAndType(roundId: RoundId, scoreType: ScoreType): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('type_score', scoreType.value)
      .orderBy('created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async getTotalScoreByPlayer(playerId: PlayerId): Promise<ScoreValue> {
    const result = await ScoreModel.query()
      .where('joueur_id', playerId.value)
      .sum('valeur_score as total')

    const total = Number((result[0] as any)?.$extras?.total ?? 0)
    return new ScoreValue(total)
  }

  async getTotalScoreByRound(roundId: RoundId): Promise<ScoreValue> {
    const result = await ScoreModel.query()
      .where('round_id', roundId.value)
      .sum('valeur_score as total')

    const total = Number((result[0] as any)?.$extras?.total ?? 0)
    return new ScoreValue(total)
  }

  async getTotalScoreByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<ScoreValue> {
    const result = await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('joueur_id', playerId.value)
      .sum('valeur_score as total')

    const total = Number((result[0] as any)?.$extras?.total ?? 0)
    return new ScoreValue(total)
  }

  async getScoreStatsByPlayer(playerId: PlayerId): Promise<ScoreStatsSummary> {
    const scores = await ScoreModel.query().where('joueur_id', playerId.value)

    const positiveScores = scores.filter((s) => s.valeurScore > 0).length
    const negativeScores = scores.filter((s) => s.valeurScore < 0).length
    const totalScore = scores.reduce((sum, s) => sum + s.valeurScore, 0)
    const scoreCount = scores.length

    const scoresByType: Record<string, ScoreValue> = {}
    scores.forEach((score) => {
      const currentValue = scoresByType[score.typeScore]?.value || 0
      const newValue = currentValue + score.valeurScore
      scoresByType[score.typeScore] = new ScoreValue(newValue)
    })

    return new ScoreStatsSummary(
      new ScoreValue(totalScore),
      positiveScores,
      negativeScores,
      scoreCount,
      scoresByType
    )
  }

  async getScoreStatsByRound(roundId: RoundId): Promise<RoundStatsSummary> {
    const scores = await ScoreModel.query().where('round_id', roundId.value)

    const uniquePlayers = new Set(scores.map((s) => s.joueurId))
    const playerCount = uniquePlayers.size
    const totalScore = scores.reduce((sum, s) => sum + s.valeurScore, 0)
    const scoreCount = scores.length

    const scoresByType: Record<string, ScoreValue> = {}
    scores.forEach((score) => {
      const currentValue = scoresByType[score.typeScore]?.value || 0
      const newValue = currentValue + score.valeurScore
      scoresByType[score.typeScore] = new ScoreValue(newValue)
    })

    return new RoundStatsSummary(new ScoreValue(totalScore), playerCount, scoreCount, scoresByType)
  }

  async exists(id: ScoreId): Promise<boolean> {
    const countResult = await ScoreModel.query().where('id', id.value).count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0) > 0
  }

  async countByRound(roundId: RoundId): Promise<number> {
    const countResult = await ScoreModel.query()
      .where('round_id', roundId.value)
      .count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0)
  }

  async countByPlayer(playerId: PlayerId): Promise<number> {
    const countResult = await ScoreModel.query()
      .where('joueur_id', playerId.value)
      .count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0)
  }

  async findTopScoringPlayers(limit: number): Promise<PlayerRanking[]> {
    const results = await ScoreModel.query()
      .select('joueur_id')
      .sum('valeur_score as total_score')
      .count('* as score_count')
      .groupBy('joueur_id')
      .orderBy('total_score', 'desc')
      .limit(limit)

    return results.map((result) => {
      const playerId = new PlayerId(result.joueurId)
      const totalScore = Number((result as any).$extras.total_score)
      const scoreCount = Number((result as any).$extras.score_count)

      return new PlayerRanking(playerId, new ScoreValue(totalScore), scoreCount)
    })
  }

  async existsChallengerInRound(roundId: RoundId): Promise<boolean> {
    const countResult = await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('type_score', 'CHALLENGER')
      .count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0) > 0
  }

  async findByPlayerInGame(playerId: PlayerId, gameId: GameId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .innerJoin('rounds', 'scores.round_id', 'rounds.id')
      .where('scores.joueur_id', playerId.value)
      .where('rounds.partie_id', gameId.value)
      .select('scores.*')
      .orderBy('scores.created_at', 'asc')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async getTotalByPlayerInGame(playerId: PlayerId, gameId: GameId): Promise<ScoreValue> {
    const result = await ScoreModel.query()
      .innerJoin('rounds', 'scores.round_id', 'rounds.id')
      .where('scores.joueur_id', playerId.value)
      .where('rounds.partie_id', gameId.value)
      .sum('scores.valeur_score as total')

    const total = Number((result[0] as any)?.$extras?.total ?? 0)
    return new ScoreValue(total)
  }

  async findPlayersInGame(gameId: GameId): Promise<PlayerId[]> {
    const results = await ScoreModel.query()
      .innerJoin('rounds', 'scores.round_id', 'rounds.id')
      .where('rounds.partie_id', gameId.value)
      .distinct('scores.joueur_id')
      .select('scores.joueur_id')

    return results.map((result) => new PlayerId(result.joueurId))
  }

  /**
   * Convert Lucid model to Domain entity using proper domain factory
   */
  private toDomainEntity(model: ScoreModel): Score {
    // Create value objects
    const scoreId = new ScoreId(model.id)
    const roundId = new RoundId(model.roundId)
    const playerId = new PlayerId(model.joueurId)
    const scoreType = new ScoreType(model.typeScore)
    const scoreName = new ScoreName(model.nomScore)
    const scoreValue = new ScoreValue(model.valeurScore)

    // Use domain factory for proper reconstruction
    return Score.reconstruct({
      id: scoreId,
      roundId,
      playerId,
      scoreType,
      scoreName,
      scoreValue,
      createdAt: model.createdAt.toJSDate(),
    })
  }
}
