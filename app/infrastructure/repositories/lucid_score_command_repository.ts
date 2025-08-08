import { ScoreCommandRepository } from '#domain/repositories/score_command_repository'
import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import ScoreModel from '#models/score'

/**
 * LucidScoreCommandRepository - Infrastructure Adapter for Commands
 * Implements the ScoreCommandRepository domain port using Lucid ORM (Write operations)
 */
export default class LucidScoreCommandRepository implements ScoreCommandRepository {
  async save(score: Score): Promise<Score> {
    // Check if score exists first
    const existingScore = await ScoreModel.find(score.id.value)

    let scoreModel: ScoreModel

    if (existingScore) {
      // Update existing score
      existingScore.roundId = score.roundId.value
      existingScore.joueurId = score.playerId.value
      existingScore.typeScore = score.scoreType.value
      existingScore.nomScore = score.scoreName.value
      existingScore.valeurScore = score.scoreValue.value
      scoreModel = await existingScore.save()
    } else {
      // Create new score (let database generate ID if needed)
      scoreModel = await ScoreModel.create({
        roundId: score.roundId.value,
        joueurId: score.playerId.value,
        typeScore: score.scoreType.value,
        nomScore: score.scoreName.value,
        valeurScore: score.scoreValue.value,
      })
    }

    return this.toDomainEntity(scoreModel)
  }

  async saveBatch(scores: Score[]): Promise<Score[]> {
    const savedScores: Score[] = []

    // Process each score using the same save method to ensure consistency
    for (const score of scores) {
      const savedScore = await this.save(score)
      savedScores.push(savedScore)
    }

    return savedScores
  }

  async delete(id: ScoreId): Promise<void> {
    await ScoreModel.query().where('id', id.value).delete()
  }

  async deleteByRoundId(roundId: RoundId): Promise<void> {
    await ScoreModel.query().where('round_id', roundId.value).delete()
  }

  async deleteByPlayerId(playerId: PlayerId): Promise<void> {
    await ScoreModel.query().where('joueur_id', playerId.value).delete()
  }

  async deleteByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<void> {
    await ScoreModel.query()
      .where('round_id', roundId.value)
      .where('joueur_id', playerId.value)
      .delete()
  }

  async deleteMultiple(ids: ScoreId[]): Promise<void> {
    const idValues = ids.map((id) => id.value)
    await ScoreModel.query().whereIn('id', idValues).delete()
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
