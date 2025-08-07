import { PlayerCommandRepository } from '#domain/repositories/player_command_repository'
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import PlayerModel from '#models/player'
import db from '@adonisjs/lucid/services/db'

/**
 * LucidPlayerCommandRepository - Infrastructure Adapter for Commands
 * Implements the PlayerCommandRepository domain port using Lucid ORM (Write operations)
 */
export default class LucidPlayerCommandRepository implements PlayerCommandRepository {
  async save(player: Player): Promise<Player> {
    // Check if player exists first
    const existingPlayer = await PlayerModel.find(player.id.value)
    
    let playerModel: PlayerModel
    
    if (existingPlayer) {
      // Update existing player
      existingPlayer.gameId = player.gameId.value
      existingPlayer.userId = player.userId
      existingPlayer.pseudo = player.pseudo.value
      playerModel = await existingPlayer.save()
    } else {
      // Create new player (let database generate ID)
      playerModel = await PlayerModel.create({
        gameId: player.gameId.value,
        userId: player.userId,
        pseudo: player.pseudo.value,
      })
    }

    return this.toDomainEntity(playerModel)
  }

  async delete(id: PlayerId): Promise<void> {
    await PlayerModel.query().where('id', id.value).delete()
  }

  async saveBatch(players: Player[]): Promise<Player[]> {
    const savedPlayers: Player[] = []

    // Process each player using the same save method to ensure consistency
    for (const player of players) {
      const savedPlayer = await this.save(player)
      savedPlayers.push(savedPlayer)
    }

    return savedPlayers
  }

  async deleteByGameId(gameId: number): Promise<void> {
    await PlayerModel.query().where('gameId', gameId).delete()
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
