import { ScoreQueryRepository } from '#domain/repositories/score_query_repository'
import Score from '#domain/entities/score'
import GameId from '#domain/value-objects/game_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreModel from '#models/score'

/**
 * Enhanced Score Query Repository - Performance Optimized
 *
 * Résout les problèmes N+1 queries avec des requêtes optimisées
 * qui utilisent des JOINs et des preloads au lieu de boucles
 */
export class EnhancedScoreQueryRepository implements ScoreQueryRepository {
  /**
   * 🚀 OPTIMISÉ - Récupère tous les scores d'une partie en UNE requête
   * Au lieu de : 1 requête pour les rounds + N requêtes pour les scores
   * Maintenant : 1 seule requête optimisée avec JOIN
   */
  async findByGameIdWithRounds(gameId: GameId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .join('rounds', 'scores.round_id', 'rounds.id')
      .where('rounds.game_id', gameId.value)
      .preload('round') // Eager loading pour éviter les N+1
      .orderBy('rounds.round_number')
      .orderBy('scores.created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  /**
   * 🚀 OPTIMISÉ - Groupe les scores par round en mémoire (plus efficace)
   * Une seule requête DB + groupement in-memory vs N+1 requêtes
   */
  async findScoresByGameIdGroupedByRound(gameId: GameId): Promise<Map<RoundId, Score[]>> {
    const scores = await this.findByGameIdWithRounds(gameId)

    // Groupement en mémoire (plus efficace que plusieurs requêtes)
    const groupedScores = new Map<RoundId, Score[]>()

    for (const score of scores) {
      const roundId = score.roundId
      if (!groupedScores.has(roundId)) {
        groupedScores.set(roundId, [])
      }
      groupedScores.get(roundId)!.push(score)
    }

    return groupedScores
  }

  // Implementation des autres méthodes de l'interface
  async findById(id: string): Promise<Score | null> {
    const scoreModel = await ScoreModel.find(id)
    return scoreModel ? this.toDomainEntity(scoreModel) : null
  }

  async findByRoundId(roundId: RoundId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('round_id', roundId.value)
      .orderBy('created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByPlayerId(playerId: PlayerId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('player_id', playerId.value)
      .preload('round')
      .orderBy('created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('player_id', playerId.value)
      .orderBy('created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async calculateTotalScoreByPlayer(playerId: PlayerId): Promise<number> {
    const result = await ScoreModel.query()
      .where('player_id', playerId.value)
      .sum('score_value as total')
      .first()

    return Number(result?.$extras.total || 0)
  }

  async calculateTotalScoreByRound(roundId: RoundId): Promise<number> {
    const result = await ScoreModel.query()
      .where('round_id', roundId.value)
      .sum('score_value as total')
      .first()

    return Number(result?.$extras.total || 0)
  }

  async getScoreStatsByPlayer(playerId: PlayerId): Promise<{
    totalScore: number
    averageScore: number
    maxScore: number
    minScore: number
    count: number
  }> {
    const result = await ScoreModel.query()
      .where('player_id', playerId.value)
      .select([
        ScoreModel.raw('SUM(score_value) as totalScore'),
        ScoreModel.raw('AVG(score_value) as averageScore'),
        ScoreModel.raw('MAX(score_value) as maxScore'),
        ScoreModel.raw('MIN(score_value) as minScore'),
        ScoreModel.raw('COUNT(*) as count'),
      ])
      .first()

    if (!result?.$extras) {
      return { totalScore: 0, averageScore: 0, maxScore: 0, minScore: 0, count: 0 }
    }

    const extras = result.$extras
    return {
      totalScore: Number(extras.totalScore || 0),
      averageScore: Number(extras.averageScore || 0),
      maxScore: Number(extras.maxScore || 0),
      minScore: Number(extras.minScore || 0),
      count: Number(extras.count || 0),
    }
  }

  async findByType(scoreType: string): Promise<Score[]> {
    const scoreModels = await ScoreModel.query()
      .where('score_type', scoreType)
      .preload('round')
      .orderBy('created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findTopScoringPlayers(
    gameId: GameId,
    limit: number = 10
  ): Promise<
    {
      playerId: number
      totalScore: number
      averageScore: number
    }[]
  > {
    const results = await ScoreModel.query()
      .join('rounds', 'scores.round_id', 'rounds.id')
      .where('rounds.game_id', gameId.value)
      .groupBy('scores.player_id')
      .select([
        'scores.player_id as playerId',
        ScoreModel.raw('SUM(scores.score_value) as totalScore'),
        ScoreModel.raw('AVG(scores.score_value) as averageScore'),
      ])
      .orderBy('totalScore', 'desc')
      .limit(limit)

    return results.map((result) => ({
      playerId: result.playerId,
      totalScore: Number(result.$extras.totalScore || 0),
      averageScore: Number(result.$extras.averageScore || 0),
    }))
  }

  /**
   * Convertit un modèle Lucid en entité Domain
   */
  private toDomainEntity(scoreModel: ScoreModel): Score {
    return Score.reconstitute(
      scoreModel.id,
      scoreModel.roundId,
      scoreModel.playerId,
      scoreModel.scoreType,
      scoreModel.scoreName,
      scoreModel.scoreValue,
      scoreModel.createdAt
    )
  }
}
