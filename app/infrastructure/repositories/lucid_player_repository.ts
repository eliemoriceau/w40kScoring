import { PlayerRepository } from '#domain/repositories/player_repository'
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import LucidPlayerQueryRepository from './lucid_player_query_repository.js'
import LucidPlayerCommandRepository from './lucid_player_command_repository.js'

/**
 * LucidPlayerRepository - Combined Infrastructure Adapter
 * Implements the PlayerRepository domain port using Lucid ORM
 * Combines both query and command operations for convenience
 *
 * @deprecated Consider using LucidPlayerQueryRepository and LucidPlayerCommandRepository separately
 * for better CQRS separation. This adapter is kept for backward compatibility.
 */
export default class LucidPlayerRepository implements PlayerRepository {
  private queryRepository: LucidPlayerQueryRepository
  private commandRepository: LucidPlayerCommandRepository

  constructor() {
    this.queryRepository = new LucidPlayerQueryRepository()
    this.commandRepository = new LucidPlayerCommandRepository()
  }

  // Query operations (delegated to query repository)
  async findById(id: PlayerId) {
    return this.queryRepository.findById(id)
  }

  async findByGameId(gameId: GameId) {
    return this.queryRepository.findByGameId(gameId)
  }

  async findByUserId(userId: number) {
    return this.queryRepository.findByUserId(userId)
  }

  async findByGameAndUser(gameId: GameId, userId: number) {
    return this.queryRepository.findByGameAndUser(gameId, userId)
  }

  async exists(id: PlayerId) {
    return this.queryRepository.exists(id)
  }

  async isPseudoTakenInGame(gameId: GameId, pseudo: string) {
    return this.queryRepository.isPseudoTakenInGame(gameId, pseudo)
  }

  async countByGame(gameId: GameId) {
    return this.queryRepository.countByGame(gameId)
  }

  async findGuestPlayers(gameId: GameId) {
    return this.queryRepository.findGuestPlayers(gameId)
  }

  async findByPseudoPattern(pattern: string, limit: number) {
    return this.queryRepository.findByPseudoPattern(pattern, limit)
  }

  // Command operations (delegated to command repository)
  async save(player: Player) {
    return this.commandRepository.save(player)
  }

  async delete(id: PlayerId) {
    return this.commandRepository.delete(id)
  }

  async saveBatch(players: Player[]) {
    return this.commandRepository.saveBatch(players)
  }

  async deleteByGameId(gameId: number) {
    return this.commandRepository.deleteByGameId(gameId)
  }
}
