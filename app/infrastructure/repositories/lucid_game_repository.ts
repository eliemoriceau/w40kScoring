import { IGameRepository } from '#domain/repositories/i_game_repository'
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
export default class LucidGameRepository implements IGameRepository {
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
    const gameModels = await GameModel
      .query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')

    return gameModels.map(model => this.toDomainEntity(model))
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
    const games = gameModels.map(model => this.toDomainEntity(model))

    return { games, total: totalCount }
  }

  async delete(id: GameId): Promise<void> {
    await GameModel.query().where('id', id.value).delete()
  }

  async exists(id: GameId): Promise<boolean> {
    const count = await GameModel
      .query()
      .where('id', id.value)
      .count('* as total')
    
    return Number(count[0]?.total ?? 0) > 0
  }

  /**
   * Convert Lucid model to Domain entity
   */
  private toDomainEntity(model: GameModel): Game {
    // Create value objects
    const gameId = new GameId(model.id)
    const gameType = GameType.fromValue(model.gameType)
    const pointsLimit = new PointsLimit(model.pointsLimit)
    const status = GameStatus.fromValue(model.status)

    // Create domain entity using static factory method
    const game = Game.createNew(gameId, model.userId, gameType, pointsLimit)

    // Set all properties using reflection or a builder pattern
    // Since Game constructor is private, we need to create it and then update properties
    // This is a simplified version - in real implementation, you might want a builder pattern

    // For now, we'll create a new game and manually set the properties
    // In a real implementation, you'd have a proper reconstruction method
    const domainGame = this.reconstructGame(
      gameId,
      model.userId,
      gameType,
      pointsLimit,
      status,
      model.opponentId,
      model.playerScore,
      model.opponentScore,
      model.mission,
      model.notes || '',
      model.createdAt.toJSDate(),
      model.startedAt?.toJSDate() || null,
      model.completedAt?.toJSDate() || null
    )

    return domainGame
  }

  /**
   * Reconstruct domain entity with all properties
   * In a real implementation, this would be a proper factory method in the Game class
   */
  private reconstructGame(
    id: GameId,
    userId: number,
    gameType: GameType,
    pointsLimit: PointsLimit,
    status: GameStatus,
    opponentId: number | null,
    playerScore: number | null,
    opponentScore: number | null,
    mission: string | null,
    notes: string,
    createdAt: Date,
    startedAt: Date | null,
    completedAt: Date | null
  ): Game {
    // This is a workaround since Game constructor is private
    // In a real implementation, you'd add a static reconstruction method to Game class
    const game = Game.createNew(id, userId, gameType, pointsLimit)
    
    // Update game state based on database values
    if (opponentId) {
      game.setOpponent(opponentId)
    }
    
    if (notes) {
      game.updateNotes(notes)
    }

    // Handle game state transitions
    if (status.equals(GameStatus.IN_PROGRESS) && mission) {
      game.start(mission)
    } else if (status.equals(GameStatus.COMPLETED) && playerScore !== null && opponentScore !== null) {
      if (!status.equals(GameStatus.IN_PROGRESS)) {
        game.start(mission || undefined)
      }
      game.complete(playerScore, opponentScore)
    } else if (status.equals(GameStatus.CANCELLED)) {
      game.cancel()
    }

    return game
  }
}