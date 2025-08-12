import Game from '#domain/entities/game'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'

/**
 * GameFactory - Test Helper for creating Game domain entities
 * Provides convenient methods for creating games in tests with sensible defaults
 * Following the same pattern as other factories in the system
 */
export default class GameFactory {
  private static defaultUserId = 1
  private static gameCounter = 1

  /**
   * Create a basic game with default values (PLANNED status)
   */
  static createBasic(overrides?: {
    id?: GameId
    userId?: number
    gameType?: GameType
    pointsLimit?: PointsLimit
    notes?: string
  }): Game {
    const defaults = {
      id: new GameId(this.gameCounter++),
      userId: overrides?.userId || this.defaultUserId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
    }

    const data = { ...defaults, ...overrides }
    const game = Game.createNew(data.id, data.userId, data.gameType, data.pointsLimit)

    if (overrides?.notes) {
      game.updateNotes(overrides.notes)
    }

    return game
  }

  /**
   * Create a completed game with scores
   */
  static createCompleted(
    playerScore: number,
    opponentScore: number,
    overrides?: {
      id?: GameId
      userId?: number
      gameType?: GameType
      pointsLimit?: PointsLimit
      mission?: string
      opponentId?: number
      notes?: string
    }
  ): Game {
    const game = this.createBasic(overrides)

    // Set opponent before starting
    if (overrides?.opponentId) {
      game.setOpponent(overrides.opponentId)
    } else {
      game.setOpponent(this.defaultUserId + 1)
    }

    // Start the game
    game.start(overrides?.mission)

    // Complete the game
    game.complete(playerScore, opponentScore)

    return game
  }

  /**
   * Create an in-progress game
   */
  static createInProgress(overrides?: {
    id?: GameId
    userId?: number
    gameType?: GameType
    pointsLimit?: PointsLimit
    mission?: string
    opponentId?: number
    notes?: string
  }): Game {
    const game = this.createBasic(overrides)

    // Set opponent before starting
    if (overrides?.opponentId) {
      game.setOpponent(overrides.opponentId)
    } else {
      game.setOpponent(this.defaultUserId + 1)
    }

    // Start the game
    game.start(overrides?.mission || this.generateMissionName())

    return game
  }

  /**
   * Create a cancelled game
   */
  static createCancelled(overrides?: {
    id?: GameId
    userId?: number
    gameType?: GameType
    pointsLimit?: PointsLimit
    wasInProgress?: boolean
  }): Game {
    let game: Game

    if (overrides?.wasInProgress) {
      game = this.createInProgress(overrides)
    } else {
      game = this.createBasic(overrides)
    }

    game.cancel()
    return game
  }

  /**
   * Reconstruct a game from persistence data
   */
  static reconstruct(overrides?: {
    id?: GameId
    userId?: number
    gameType?: GameType
    pointsLimit?: PointsLimit
    status?: GameStatus
    opponentId?: number | null
    playerScore?: number | null
    opponentScore?: number | null
    mission?: string | null
    notes?: string
    createdAt?: Date
    startedAt?: Date | null
    completedAt?: Date | null
  }): Game {
    const defaults = {
      id: new GameId(this.gameCounter++),
      userId: this.defaultUserId,
      gameType: GameType.MATCHED_PLAY,
      pointsLimit: new PointsLimit(2000),
      status: GameStatus.PLANNED,
      opponentId: null,
      playerScore: null,
      opponentScore: null,
      mission: null,
      notes: '',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    }

    const data = { ...defaults, ...overrides }
    return Game.reconstruct(data)
  }

  /**
   * Create a batch of games
   */
  static createBatch(
    count: number,
    template?: {
      userIdStart?: number
      gameTypeDistribution?: GameType[]
      statusMix?: ('PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED')[]
      pointsLimits?: number[]
    }
  ): Game[] {
    const defaults = {
      userIdStart: this.defaultUserId,
      gameTypeDistribution: [GameType.MATCHED_PLAY],
      statusMix: ['PLANNED'] as const,
      pointsLimits: [2000],
    }

    const config = { ...defaults, ...template }
    const games: Game[] = []

    for (let i = 0; i < count; i++) {
      const gameId = new GameId(this.gameCounter++)
      const userId = config.userIdStart + i
      const gameType = config.gameTypeDistribution[i % config.gameTypeDistribution.length]
      const pointsLimit = new PointsLimit(config.pointsLimits[i % config.pointsLimits.length])
      const status = config.statusMix[i % config.statusMix.length]

      let game: Game

      switch (status) {
        case 'COMPLETED':
          game = this.createCompleted(this.randomScore(60, 100), this.randomScore(60, 100), {
            id: gameId,
            userId,
            gameType,
            pointsLimit,
          })
          break
        case 'IN_PROGRESS':
          game = this.createInProgress({ id: gameId, userId, gameType, pointsLimit })
          break
        case 'CANCELLED':
          game = this.createCancelled({ id: gameId, userId, gameType, pointsLimit })
          break
        default:
          game = this.createBasic({ id: gameId, userId, gameType, pointsLimit })
      }

      games.push(game)
    }

    return games
  }

  /**
   * Create realistic W40K game scenarios
   */
  static createRealisticScenario(
    scenario: 'close' | 'domination' | 'low-scoring' | 'high-scoring',
    overrides?: {
      id?: GameId
      userId?: number
      gameType?: GameType
      pointsLimit?: PointsLimit
    }
  ): Game {
    let playerScore: number
    let opponentScore: number
    let mission: string

    switch (scenario) {
      case 'close':
        playerScore = this.randomScore(75, 85)
        opponentScore = playerScore + this.randomScore(-5, 5)
        opponentScore = Math.max(0, Math.min(100, opponentScore)) // Clamp to valid range
        mission = this.generateMissionName()
        break

      case 'domination':
        const highScore = this.randomScore(85, 100)
        const lowScore = this.randomScore(20, 55)
        if (Math.random() > 0.5) {
          playerScore = highScore
          opponentScore = lowScore
        } else {
          playerScore = lowScore
          opponentScore = highScore
        }
        mission = 'Priority Targets'
        break

      case 'low-scoring':
        playerScore = this.randomScore(15, 45)
        opponentScore = this.randomScore(15, 45)
        mission = 'Secure and Control'
        break

      case 'high-scoring':
        playerScore = this.randomScore(90, 100)
        opponentScore = this.randomScore(90, 100)
        mission = 'Deploy Scramblers'
        break

      default:
        throw new Error(`Unknown scenario: ${scenario}`)
    }

    return this.createCompleted(playerScore, opponentScore, {
      ...overrides,
      mission,
    })
  }

  /**
   * Generate realistic W40K mission names
   */
  static generateMissionName(): string {
    const actions = [
      'Secure',
      'Priority',
      'Recover',
      'Deploy',
      'Control',
      'Sweep',
      'Engage',
      'Assassinate',
      'Linebreaker',
    ]

    const targets = [
      'and Control',
      'Targets',
      'the Relic',
      'Scramblers',
      'Territory',
      'and Clear',
      'on All Fronts',
      'Characters',
      'Formation',
    ]

    const action = actions[Math.floor(Math.random() * actions.length)]
    const target = targets[Math.floor(Math.random() * targets.length)]

    return `${action} ${target}`
  }

  /**
   * Create games for different point limits (common W40K formats)
   */
  static createByPointsFormat(
    format: 'combat-patrol' | 'incursion' | 'strike-force' | 'onslaught',
    overrides?: {
      id?: GameId
      userId?: number
      status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
    }
  ): Game {
    const pointsLimits = {
      'combat-patrol': 500,
      'incursion': 1000,
      'strike-force': 2000,
      'onslaught': 3000,
    }

    const pointsLimit = new PointsLimit(pointsLimits[format])
    const baseGame = {
      pointsLimit,
      gameType:
        format === 'incursion' || format === 'combat-patrol'
          ? GameType.NARRATIVE
          : GameType.MATCHED_PLAY,
      ...overrides,
    }

    switch (overrides?.status) {
      case 'COMPLETED':
        // Scale scores based on points limit
        const baseScore = Math.floor((pointsLimit.value / 2000) * 80)
        return this.createCompleted(
          this.randomScore(baseScore - 10, baseScore + 20),
          this.randomScore(baseScore - 10, baseScore + 20),
          baseGame
        )
      case 'IN_PROGRESS':
        return this.createInProgress(baseGame)
      default:
        return this.createBasic(baseGame)
    }
  }

  /**
   * Reset the internal counter for predictable testing
   */
  static resetCounter(): void {
    this.gameCounter = 1
  }

  /**
   * Helper method to generate random scores
   */
  private static randomScore(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}
