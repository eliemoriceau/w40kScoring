import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'

/**
 * PlayerFactory - Test Helper for creating Player domain entities
 * Provides convenient methods for creating players in tests with sensible defaults
 */
export class PlayerFactory {
  /**
   * Create a registered player with default values
   */
  static createRegisteredPlayer(overrides?: {
    id?: PlayerId
    gameId?: GameId
    userId?: number
    pseudo?: Pseudo
  }): Player {
    const defaults = {
      id: new PlayerId(1),
      gameId: new GameId(1),
      userId: 123,
      pseudo: new Pseudo('TestPlayer'),
    }

    const data = { ...defaults, ...overrides }
    return Player.createForRegisteredUser(data.id, data.gameId, data.userId, data.pseudo)
  }

  /**
   * Create a guest player with default values
   */
  static createGuestPlayer(overrides?: {
    id?: PlayerId
    gameId?: GameId
    pseudo?: Pseudo
  }): Player {
    const defaults = {
      id: new PlayerId(2),
      gameId: new GameId(1),
      pseudo: new Pseudo('GuestPlayer'),
    }

    const data = { ...defaults, ...overrides }
    return Player.createForGuest(data.id, data.gameId, data.pseudo)
  }

  /**
   * Create a player using the reconstruct method (for testing persistence scenarios)
   */
  static reconstruct(overrides?: {
    id?: PlayerId
    gameId?: GameId
    userId?: number | null
    pseudo?: Pseudo
    createdAt?: Date
  }): Player {
    const defaults = {
      id: new PlayerId(1),
      gameId: new GameId(1),
      userId: 123 as number | null,
      pseudo: new Pseudo('ReconstructedPlayer'),
      createdAt: new Date(),
    }

    const data = { ...defaults, ...overrides }
    return Player.reconstruct(data)
  }

  /**
   * Create multiple players for bulk testing
   */
  static createBatch(
    count: number,
    template?: {
      gameId?: GameId
      userIdStart?: number
      pseudoPrefix?: string
      isGuest?: boolean
    }
  ): Player[] {
    const defaults = {
      gameId: new GameId(1),
      userIdStart: 100,
      pseudoPrefix: 'Player',
      isGuest: false,
    }

    const config = { ...defaults, ...template }
    const players: Player[] = []

    for (let i = 0; i < count; i++) {
      const playerId = new PlayerId(i + 1)
      const pseudo = new Pseudo(`${config.pseudoPrefix}${i + 1}`)

      if (config.isGuest) {
        players.push(Player.createForGuest(playerId, config.gameId, pseudo))
      } else {
        const userId = config.userIdStart + i
        players.push(Player.createForRegisteredUser(playerId, config.gameId, userId, pseudo))
      }
    }

    return players
  }

  /**
   * Create players with specific game membership
   */
  static createForGame(
    gameId: GameId,
    players: Array<{
      id?: PlayerId
      userId?: number | null
      pseudo: string
    }>
  ): Player[] {
    return players.map((playerData, index) => {
      const playerId = playerData.id || new PlayerId(index + 1)
      const pseudo = new Pseudo(playerData.pseudo)

      if (playerData.userId === null || playerData.userId === undefined) {
        return Player.createForGuest(playerId, gameId, pseudo)
      } else {
        return Player.createForRegisteredUser(playerId, gameId, playerData.userId, pseudo)
      }
    })
  }
}
