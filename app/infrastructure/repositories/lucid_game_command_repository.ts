import { GameCommandRepository } from '#domain/repositories/i_game_command_repository'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'
import GameModel from '#models/game'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * LucidGameCommandRepository - Infrastructure Adapter for Commands
 * Implements the IGameCommandRepository domain port using Lucid ORM (Write operations)
 */
export default class LucidGameCommandRepository implements GameCommandRepository {
  async save(game: Game): Promise<Game> {
    const gameModel = await GameModel.updateOrCreate(
      { id: game.id.value },
      {
        userId: game.userId,
        opponentId: game.opponentId,
        gameType: game.gameType.value as 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY',
        pointsLimit: game.pointsLimit.value,
        status: game.status.value as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        playerScore: game.playerScore,
        opponentScore: game.opponentScore,
        mission: game.mission,
        notes: game.notes || null,
        startedAt: game.startedAt ? DateTime.fromJSDate(game.startedAt) : null,
        completedAt: game.completedAt ? DateTime.fromJSDate(game.completedAt) : null,
      }
    )

    return this.toDomainEntity(gameModel)
  }

  async delete(id: GameId): Promise<void> {
    await GameModel.query().where('id', id.value).delete()
  }

  async saveBatch(games: Game[]): Promise<Game[]> {
    const savedGames: Game[] = []

    // Use transaction for batch operations
    await db.transaction(async (trx) => {
      for (const game of games) {
        const gameModel = await GameModel.updateOrCreate(
          { id: game.id.value },
          {
            userId: game.userId,
            opponentId: game.opponentId,
            gameType: game.gameType.value as 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY',
            pointsLimit: game.pointsLimit.value,
            status: game.status.value as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
            playerScore: game.playerScore,
            opponentScore: game.opponentScore,
            mission: game.mission,
            notes: game.notes || null,
            startedAt: game.startedAt ? DateTime.fromJSDate(game.startedAt) : null,
            completedAt: game.completedAt ? DateTime.fromJSDate(game.completedAt) : null,
          },
          { client: trx }
        )
        const savedGame = this.toDomainEntity(gameModel)
        savedGames.push(savedGame)
      }
    })

    return savedGames
  }

  async bulkUpdateStatus(gameIds: GameId[], status: string): Promise<void> {
    const ids = gameIds.map((id) => id.value)

    await GameModel.query()
      .whereIn('id', ids)
      .update({ status: status as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' })
  }

  /**
   * Convert Lucid model to Domain entity using proper domain factory
   */
  private toDomainEntity(model: GameModel): Game {
    // Create value objects
    const gameId = new GameId(model.id)
    const gameType = GameType.fromValue(model.gameType)
    const pointsLimit = new PointsLimit(model.pointsLimit)
    const status = GameStatus.fromValue(model.status)

    // Use domain factory for proper reconstruction
    return Game.reconstruct({
      id: gameId,
      userId: model.userId,
      gameType,
      pointsLimit,
      status,
      opponentId: model.opponentId,
      playerScore: model.playerScore,
      opponentScore: model.opponentScore,
      mission: model.mission,
      notes: model.notes || '',
      createdAt: model.createdAt.toJSDate(),
      startedAt: model.startedAt?.toJSDate() || null,
      completedAt: model.completedAt?.toJSDate() || null,
    })
  }
}
