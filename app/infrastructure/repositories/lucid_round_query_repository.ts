import { RoundQueryRepository } from '#domain/repositories/round_query_repository'
import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import RoundModel from '#models/round'

/**
 * LucidRoundQueryRepository - Infrastructure Adapter for Queries
 * Implements the RoundQueryRepository domain port using Lucid ORM (Read-only operations)
 */
export default class LucidRoundQueryRepository implements RoundQueryRepository {
  async findById(id: RoundId): Promise<Round | null> {
    const roundModel = await RoundModel.find(id.value)

    if (!roundModel) {
      return null
    }

    return this.toDomainEntity(roundModel)
  }

  async findByGameId(gameId: GameId): Promise<Round[]> {
    const roundModels = await RoundModel.query()
      .where('game_id', gameId.value)
      .orderBy('round_number', 'asc')

    return roundModels.map((model) => this.toDomainEntity(model))
  }

  async findByGameIdAndNumber(gameId: GameId, roundNumber: RoundNumber): Promise<Round | null> {
    const roundModel = await RoundModel.query()
      .where('game_id', gameId.value)
      .where('round_number', roundNumber.value)
      .first()

    if (!roundModel) {
      return null
    }

    return this.toDomainEntity(roundModel)
  }

  async countCompletedRoundsByGame(gameId: GameId): Promise<number> {
    const countResult = await RoundModel.query()
      .where('game_id', gameId.value)
      .where('is_completed', true)
      .count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0)
  }

  async countRoundsByGame(gameId: GameId): Promise<number> {
    const countResult = await RoundModel.query().where('game_id', gameId.value).count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0)
  }

  async exists(id: RoundId): Promise<boolean> {
    const countResult = await RoundModel.query().where('id', id.value).count('* as total')

    return Number((countResult[0] as any)?.$extras?.total ?? 0) > 0
  }

  async findLatestRoundForGame(gameId: GameId): Promise<Round | null> {
    const roundModel = await RoundModel.query()
      .where('game_id', gameId.value)
      .orderBy('round_number', 'desc')
      .first()

    if (!roundModel) {
      return null
    }

    return this.toDomainEntity(roundModel)
  }

  async findIncompleteRoundsByGame(gameId: GameId): Promise<Round[]> {
    const roundModels = await RoundModel.query()
      .where('game_id', gameId.value)
      .where('is_completed', false)
      .orderBy('round_number', 'asc')

    return roundModels.map((model) => this.toDomainEntity(model))
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
    const rounds = await RoundModel.query().where('game_id', gameId.value)

    const completedRounds = rounds.filter((round) => Boolean(round.isCompleted))

    const stats = {
      totalRounds: rounds.length,
      completedRounds: completedRounds.length,
      totalPlayerScore: completedRounds.reduce((sum, round) => sum + round.playerScore, 0),
      totalOpponentScore: completedRounds.reduce((sum, round) => sum + round.opponentScore, 0),
      playerWins: completedRounds.filter((round) => round.playerScore > round.opponentScore).length,
      opponentWins: completedRounds.filter((round) => round.opponentScore > round.playerScore)
        .length,
      draws: completedRounds.filter((round) => round.playerScore === round.opponentScore).length,
    }

    return stats
  }

  /**
   * Convert Lucid model to Domain entity using proper domain factory
   */
  private toDomainEntity(model: RoundModel): Round {
    // Create value objects
    const roundId = new RoundId(model.id)
    const gameId = new GameId(model.gameId)
    const roundNumber = new RoundNumber(model.roundNumber)

    // Use domain factory for proper reconstruction
    return Round.reconstruct({
      id: roundId,
      gameId,
      roundNumber,
      playerScore: model.playerScore,
      opponentScore: model.opponentScore,
      isCompleted: Boolean(model.isCompleted),
      createdAt: model.createdAt.toJSDate(),
    })
  }
}
