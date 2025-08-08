import { RoundCommandRepository } from '#domain/repositories/round_command_repository'
import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import RoundModel from '#models/round'

/**
 * LucidRoundCommandRepository - Infrastructure Adapter for Commands
 * Implements the RoundCommandRepository domain port using Lucid ORM (Write operations)
 */
export default class LucidRoundCommandRepository implements RoundCommandRepository {
  async save(round: Round): Promise<Round> {
    // Check if round exists first
    const existingRound = await RoundModel.find(round.id.value)

    let roundModel: RoundModel

    if (existingRound) {
      // Update existing round
      existingRound.gameId = round.gameId.value
      existingRound.roundNumber = round.roundNumber.value
      existingRound.playerScore = round.playerScore
      existingRound.opponentScore = round.opponentScore
      existingRound.isCompleted = round.isCompleted
      roundModel = await existingRound.save()
    } else {
      // Create new round (let database generate ID if needed)
      roundModel = await RoundModel.create({
        gameId: round.gameId.value,
        roundNumber: round.roundNumber.value,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        isCompleted: round.isCompleted,
      })
    }

    return this.toDomainEntity(roundModel)
  }

  async saveBatch(rounds: Round[]): Promise<Round[]> {
    const savedRounds: Round[] = []

    // Process each round using the same save method to ensure consistency
    for (const round of rounds) {
      const savedRound = await this.save(round)
      savedRounds.push(savedRound)
    }

    return savedRounds
  }

  async delete(id: RoundId): Promise<void> {
    await RoundModel.query().where('id', id.value).delete()
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await RoundModel.query().where('game_id', gameId.value).delete()
  }

  async deleteMultiple(ids: RoundId[]): Promise<void> {
    const idValues = ids.map((id) => id.value)
    await RoundModel.query().whereIn('id', idValues).delete()
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
