import { GameRepository } from '#domain/repositories/i_game_repository'
import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'
import GameModel from '#models/game'

/**
 * LucidGameRepository - Infrastructure Adapter
 * Implements the IGameRepository domain port using Lucid ORM
 */
export default class LucidGameRepository implements GameRepository {
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
        startedAt: game.startedAt,
        completedAt: game.completedAt,
      }
    )

    return this.toDomainEntity(gameModel)
  }

  async findById(id: GameId): Promise<Game | null> {
    const gameModel = await GameModel.find(id.value)

    if (!gameModel) {
      return null
    }

    return this.toDomainEntity(gameModel)
  }

  async findByUserId(userId: number): Promise<Game[]> {
    const gameModels = await GameModel.query().where('userId', userId).orderBy('createdAt', 'desc')

    return gameModels.map((model) => this.toDomainEntity(model))
  }

  async findByUserIdWithFilters(
    userId: number,
    filters: {
      status?: string[]
      gameType?: string[]
      limit?: number
      offset?: number
    }
  ): Promise<{ games: Game[]; total: number }> {
    let query = GameModel.query().where('userId', userId)

    if (filters.status && filters.status.length > 0) {
      query = query.whereIn('status', filters.status)
    }

    if (filters.gameType && filters.gameType.length > 0) {
      query = query.whereIn('gameType', filters.gameType)
    }

    // Count total for pagination
    const countQuery = query.clone()
    const total = await countQuery.count('* as total')
    const totalCount = Number(total[0]?.total ?? 0)

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.offset(filters.offset)
    }

    query = query.orderBy('createdAt', 'desc')

    const gameModels = await query
    const games = gameModels.map((model) => this.toDomainEntity(model))

    return { games, total: totalCount }
  }

  async delete(id: GameId): Promise<void> {
    await GameModel.query().where('id', id.value).delete()
  }

  async exists(id: GameId): Promise<boolean> {
    const count = await GameModel.query().where('id', id.value).count('* as total')

    return Number(count[0]?.total ?? 0) > 0
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
