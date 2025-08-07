import { PlayerQueryRepository } from '#domain/repositories/player_query_repository'
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import PlayerModel from '#models/player'

/**
 * LucidPlayerQueryRepository - Infrastructure Adapter for Queries
 * Implements the PlayerQueryRepository domain port using Lucid ORM (Read-only operations)
 */
export default class LucidPlayerQueryRepository implements PlayerQueryRepository {
  async findById(id: PlayerId): Promise<Player | null> {
    const playerModel = await PlayerModel.find(id.value)

    if (!playerModel) {
      return null
    }

    return this.toDomainEntity(playerModel)
  }

  async findByGameId(gameId: GameId): Promise<Player[]> {
    const playerModels = await PlayerModel.query()
      .where('gameId', gameId.value)
      .orderBy('createdAt', 'asc')

    return playerModels.map((model) => this.toDomainEntity(model))
  }

  async findByUserId(userId: number): Promise<Player[]> {
    const playerModels = await PlayerModel.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')

    return playerModels.map((model) => this.toDomainEntity(model))
  }

  async findByGameAndUser(gameId: GameId, userId: number): Promise<Player | null> {
    const playerModel = await PlayerModel.query()
      .where('gameId', gameId.value)
      .where('userId', userId)
      .first()

    if (!playerModel) {
      return null
    }

    return this.toDomainEntity(playerModel)
  }

  async exists(id: PlayerId): Promise<boolean> {
    const countResult = await PlayerModel.query().where('id', id.value).count('* as total')

    return Number((countResult[0] as any)?.total ?? 0) > 0
  }

  async isPseudoTakenInGame(gameId: GameId, pseudo: string): Promise<boolean> {
    const countResult = await PlayerModel.query()
      .where('gameId', gameId.value)
      .where('pseudo', pseudo)
      .count('* as total')

    return Number((countResult[0] as any)?.total ?? 0) > 0
  }

  async countByGame(gameId: GameId): Promise<number> {
    const countResult = await PlayerModel.query().where('gameId', gameId.value).count('* as total')

    return Number((countResult[0] as any)?.total ?? 0)
  }

  async findGuestPlayers(gameId: GameId): Promise<Player[]> {
    const playerModels = await PlayerModel.query()
      .where('gameId', gameId.value)
      .whereNull('userId')
      .orderBy('createdAt', 'asc')

    return playerModels.map((model) => this.toDomainEntity(model))
  }

  async findByPseudoPattern(pattern: string, limit: number): Promise<Player[]> {
    const playerModels = await PlayerModel.query()
      .where('pseudo', 'like', `%${pattern}%`)
      .limit(limit)
      .orderBy('pseudo', 'asc')

    return playerModels.map((model) => this.toDomainEntity(model))
  }

  /**
   * Convert Lucid model to Domain entity using proper domain factory
   */
  private toDomainEntity(model: PlayerModel): Player {
    // Create value objects
    const playerId = new PlayerId(model.id)
    const gameId = new GameId(model.gameId)
    const pseudo = new Pseudo(model.pseudo)

    // Use domain factory for proper reconstruction
    return Player.reconstruct({
      id: playerId,
      gameId,
      userId: model.userId,
      pseudo,
      createdAt: model.createdAt.toJSDate(),
    })
  }
}
