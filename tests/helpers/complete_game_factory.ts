import Game from '#domain/entities/game'
import Player from '#domain/entities/player'
import Round from '#domain/entities/round'
import Score from '#domain/entities/score'
import GameFactory from '#tests/helpers/game_factory'
import { PlayerFactory } from '#tests/helpers/player_factory'
import { RoundFactory } from '#tests/helpers/round_factory'
import { ScoreFactory } from '#tests/helpers/score_factory'
import GameId from '#domain/value-objects/game_id'
import PlayerId from '#domain/value-objects/player_id'
import RoundId from '#domain/value-objects/round_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import { IdGenerator } from '#domain/services/id_generator'
import ScoreId from '#domain/value-objects/score_id'
import Pseudo from '#domain/value-objects/pseudo'
import RoundNumber from '#domain/value-objects/round_number'

/**
 * Seeded random number generator for reproducible results
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }
}

/**
 * Test IdGenerator that generates sequential IDs for predictable tests
 */
class TestIdGenerator implements IdGenerator {
  private counter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.counter++)
  }

  reset() {
    this.counter = 1
  }
}

export interface CompleteGameResult {
  game: Game
  players: Player[]
  rounds: Round[]
  scores: Score[]
}

export interface CompleteGameOptions {
  gameId?: GameId
  userId?: number
  gameType?: GameType
  pointsLimit?: PointsLimit
  players?: Array<{
    pseudo: string
    userId?: number | null
  }>
  roundCount?: number
  scorePattern?: 'realistic' | 'escalating' | 'random' | 'close'
  includeDetailedScores?: boolean
  seed?: number
}

/**
 * CompleteGameFactory - Creates complete game scenarios for testing and seeding
 * Orchestrates Game, Players, Rounds, and Scores creation in a cohesive manner
 * Provides realistic W40K game data for development and testing
 */
export default class CompleteGameFactory {
  private static gameIdCounter = 1
  private static playerIdCounter = 1
  private static roundIdCounter = 1
  private static testIdGenerator = new TestIdGenerator()

  /**
   * Create a complete game with all related entities
   */
  static createCompleteGame(options: CompleteGameOptions = {}): CompleteGameResult {
    const rng = options.seed ? new SeededRandom(options.seed) : new SeededRandom(Date.now())
    
    // Create the main game
    const gameId = options.gameId || new GameId(this.gameIdCounter++)
    const userId = options.userId || 1
    const gameType = options.gameType || GameType.MATCHED_PLAY
    const pointsLimit = options.pointsLimit || new PointsLimit(2000)

    const game = GameFactory.createBasic({
      id: gameId,
      userId,
      gameType,
      pointsLimit,
    })

    // Create players
    const playerConfigs = options.players || [
      { pseudo: 'Player1', userId: userId },
      { pseudo: 'Player2', userId: null }, // Guest player
    ]

    const players = this.createPlayersForGame(gameId, playerConfigs, rng)

    // Set opponent on game
    const opponentPlayer = players.find(p => p.userId !== userId) || players[1]
    if (opponentPlayer.userId) {
      game.setOpponent(opponentPlayer.userId)
    }

    // Start the game
    game.start(GameFactory.generateMissionName())

    // Create rounds
    const roundCount = options.roundCount || 5
    const rounds = this.createRoundsForGame(gameId, roundCount, options.scorePattern || 'realistic', rng)

    // Create detailed scores if requested
    const scores: Score[] = []
    if (options.includeDetailedScores) {
      scores.push(...this.createDetailedScores(rounds, players, rng))
    }

    // Calculate final game scores and complete the game
    const finalPlayerScore = rounds.reduce((sum, round) => sum + round.playerScore, 0)
    const finalOpponentScore = rounds.reduce((sum, round) => sum + round.opponentScore, 0)
    
    game.complete(finalPlayerScore, finalOpponentScore)

    return {
      game,
      players,
      rounds,
      scores,
    }
  }

  /**
   * Create specific game scenarios
   */
  static createScenario(
    scenario: 'competitive' | 'domination' | 'learning' | 'tournament'
  ): CompleteGameResult {
    switch (scenario) {
      case 'competitive':
        return this.createCompleteGame({
          scorePattern: 'close',
          includeDetailedScores: true,
          players: [
            { pseudo: 'ImperialGuard_Alpha', userId: 1 },
            { pseudo: 'Tau_Commander_X', userId: 2 },
          ],
        })

      case 'domination':
        const dominationGame = this.createCompleteGame({
          scorePattern: 'escalating',
          includeDetailedScores: true,
          players: [
            { pseudo: 'SpaceMarines_Vet', userId: 1 },
            { pseudo: 'Newbie_Recruit', userId: null },
          ],
          seed: 999, // Force predictable domination scenario
        })

        // Override scores to ensure domination (one player much higher)
        const domPlayerTotal = dominationGame.game.playerScore!
        const domOpponentTotal = dominationGame.game.opponentScore!
        
        // If difference isn't big enough, adjust one of them
        if (Math.abs(domPlayerTotal - domOpponentTotal) <= 25) {
          const higherScore = Math.max(domPlayerTotal, domOpponentTotal)
          const lowerScore = Math.min(domPlayerTotal, domOpponentTotal) - 30 // Create 30+ point difference
          
          // Re-complete the game with adjusted scores
          const adjustedGame = GameFactory.createCompleted(
            domPlayerTotal > domOpponentTotal ? higherScore + 30 : Math.max(10, lowerScore),
            domPlayerTotal > domOpponentTotal ? Math.max(10, lowerScore) : higherScore + 30,
            { id: dominationGame.game.id }
          )
          
          return {
            ...dominationGame,
            game: adjustedGame,
          }
        }
        
        return dominationGame

      case 'learning':
        const learningGame = this.createCompleteGame({
          pointsLimit: new PointsLimit(500), // Combat Patrol size
          scorePattern: 'realistic',
          includeDetailedScores: false,
          players: [
            { pseudo: 'Beginner_1', userId: null },
            { pseudo: 'Beginner_2', userId: null },
          ],
          seed: 555, // Predictable seed
        })

        // Ensure low scores for learning scenario
        const learningPlayerTotal = learningGame.game.playerScore!
        const learningOpponentTotal = learningGame.game.opponentScore!
        
        // If scores are too high, adjust them down
        if (learningPlayerTotal > 60 || learningOpponentTotal > 60) {
          const adjustedGame = GameFactory.createCompleted(
            Math.min(learningPlayerTotal, 45), // Cap at 45
            Math.min(learningOpponentTotal, 45), // Cap at 45
            { 
              id: learningGame.game.id,
              pointsLimit: new PointsLimit(500)
            }
          )
          
          return {
            ...learningGame,
            game: adjustedGame,
          }
        }
        
        return learningGame

      case 'tournament':
        return this.createCompleteGame({
          gameType: GameType.MATCHED_PLAY,
          pointsLimit: new PointsLimit(2000),
          scorePattern: 'realistic',
          includeDetailedScores: true,
          players: [
            { pseudo: 'Tournament_Pro', userId: 1 },
            { pseudo: 'Rising_Star', userId: 2 },
          ],
        })

      default:
        throw new Error(`Unknown scenario: ${scenario}`)
    }
  }

  /**
   * Create games for different W40K formats
   */
  static createForFormat(
    format: 'combat-patrol' | 'incursion' | 'strike-force' | 'onslaught'
  ): CompleteGameResult {
    const configurations = {
      'combat-patrol': {
        pointsLimit: new PointsLimit(500),
        gameType: GameType.NARRATIVE,
        roundCount: 3,
        scorePattern: 'realistic' as const,
      },
      incursion: {
        pointsLimit: new PointsLimit(1000),
        gameType: GameType.MATCHED_PLAY,
        roundCount: 4,
        scorePattern: 'realistic' as const,
      },
      'strike-force': {
        pointsLimit: new PointsLimit(2000),
        gameType: GameType.MATCHED_PLAY,
        roundCount: 5,
        scorePattern: 'realistic' as const,
      },
      onslaught: {
        pointsLimit: new PointsLimit(3000),
        gameType: GameType.OPEN_PLAY,
        roundCount: 5,
        scorePattern: 'escalating' as const,
      },
    }

    const config = configurations[format]
    return this.createCompleteGame({
      ...config,
      includeDetailedScores: true,
    })
  }

  /**
   * Create players for a game
   */
  private static createPlayersForGame(
    gameId: GameId,
    playerConfigs: Array<{ pseudo: string; userId?: number | null }>,
    rng: SeededRandom
  ): Player[] {
    return playerConfigs.map((config) => {
      const playerId = new PlayerId(this.playerIdCounter++)
      
      if (config.userId === null || config.userId === undefined) {
        return PlayerFactory.createGuestPlayer({
          id: playerId,
          gameId,
          pseudo: new Pseudo(config.pseudo),
        })
      } else {
        return PlayerFactory.createRegisteredPlayer({
          id: playerId,
          gameId,
          userId: config.userId,
          pseudo: new Pseudo(config.pseudo),
        })
      }
    })
  }

  /**
   * Create rounds for a game with scoring patterns
   */
  private static createRoundsForGame(
    gameId: GameId,
    roundCount: number,
    scorePattern: 'realistic' | 'escalating' | 'random' | 'close',
    rng: SeededRandom
  ): Round[] {
    const rounds: Round[] = []

    for (let i = 1; i <= roundCount; i++) {
      const roundId = new RoundId(this.roundIdCounter++)
      const roundNumber = new RoundNumber(i)
      
      const round = RoundFactory.createNew({
        id: roundId,
        gameId,
        roundNumber,
      })

      const scores = this.generateScoresForPattern(scorePattern, i, roundCount, rng)
      round.completeRound(scores.player, scores.opponent)
      
      rounds.push(round)
    }

    return rounds
  }

  /**
   * Generate scores based on pattern
   */
  private static generateScoresForPattern(
    pattern: string,
    roundNumber: number,
    totalRounds: number,
    rng: SeededRandom
  ): { player: number; opponent: number } {
    switch (pattern) {
      case 'realistic':
        return {
          player: rng.range(5, 25),
          opponent: rng.range(5, 25),
        }

      case 'escalating':
        const baseScore = Math.floor((roundNumber / totalRounds) * 20) + 5
        return {
          player: baseScore + rng.range(-3, 8),
          opponent: baseScore + rng.range(-3, 8),
        }

      case 'close':
        const playerScore = rng.range(12, 20)
        const variance = rng.range(-3, 3)
        return {
          player: playerScore,
          opponent: Math.max(5, playerScore + variance),
        }

      case 'random':
        return {
          player: rng.range(0, 35),
          opponent: rng.range(0, 35),
        }

      default:
        return {
          player: rng.range(10, 20),
          opponent: rng.range(10, 20),
        }
    }
  }

  /**
   * Create detailed scores for rounds and players
   */
  private static createDetailedScores(
    rounds: Round[],
    players: Player[],
    rng: SeededRandom
  ): Score[] {
    const scores: Score[] = []

    rounds.forEach((round) => {
      players.forEach((player) => {
        // Create unique scores per player per round (no duplicates)
        const availableScoreTypes = ['PRIMARY', 'SECONDARY', 'OBJECTIVE', 'BONUS']
        if (rng.next() < 0.1) availableScoreTypes.push('PENALTY') // 10% chance of penalty
        
        // Shuffle and take 2-3 different score types to ensure uniqueness
        const selectedTypes = this.shuffleArray([...availableScoreTypes], rng).slice(0, rng.range(2, 3))
        
        selectedTypes.forEach((scoreTypeStr, index) => {
          const scoreValue = this.generateScoreValueForType(scoreTypeStr, rng)
          
          try {
            const score = this.createScoreForType(
              scoreTypeStr,
              round.id,
              player.id,
              scoreValue,
              rng,
              index // Add index to make score names unique
            )
            scores.push(score)
          } catch (error) {
            // Skip if score creation fails (e.g., invalid value for type)
            console.warn(`Skipping score creation: ${error}`)
          }
        })
      })
    })

    return scores
  }

  /**
   * Generate appropriate score values for different types
   */
  private static generateScoreValueForType(scoreType: string, rng: SeededRandom): number {
    switch (scoreType) {
      case 'PRIMARY':
        return rng.range(5, 15)
      case 'SECONDARY':
        return rng.range(3, 12)
      case 'OBJECTIVE':
        return rng.range(1, 8)
      case 'BONUS':
        return rng.range(2, 5)
      case 'PENALTY':
        return -rng.range(1, 5)
      default:
        return rng.range(1, 10)
    }
  }

  /**
   * Shuffle an array using seeded random
   */
  private static shuffleArray<T>(array: T[], rng: SeededRandom): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Create a score of specific type
   */
  private static createScoreForType(
    scoreType: string,
    roundId: RoundId,
    playerId: PlayerId,
    scoreValue: number,
    rng: SeededRandom,
    index: number = 0
  ): Score {
    const scoreNames = {
      PRIMARY: ['Control Objectives', 'Hold Center', 'Dominate Battlefield'],
      SECONDARY: ['Assassinate', 'Linebreaker', 'Engage All Fronts'],
      OBJECTIVE: ['Hold Objective 1', 'Hold Objective 2', 'Secure Zone'],
      BONUS: ['First Blood', 'Slay Warlord', 'Last Stand'],
      PENALTY: ['Late Deployment', 'Illegal List', 'Unsporting'],
    }

    const names = scoreNames[scoreType as keyof typeof scoreNames] || ['Generic Score']
    // Use index to ensure unique names within the same round/player/type combination
    const scoreName = `${names[index % names.length]} ${index > 0 ? index + 1 : ''}`

    switch (scoreType) {
      case 'PRIMARY':
        return ScoreFactory.createPrimary({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
      case 'SECONDARY':
        return ScoreFactory.createSecondary({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
      case 'OBJECTIVE':
        return ScoreFactory.createObjective({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
      case 'BONUS':
        return ScoreFactory.createBonus({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
      case 'PENALTY':
        return ScoreFactory.createPenalty({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
      default:
        return ScoreFactory.createObjective({
          roundId,
          playerId,
          scoreName,
          scoreValue,
          idGenerator: this.testIdGenerator,
        })
    }
  }

  /**
   * Reset all counters for predictable testing
   */
  static resetCounters(): void {
    this.gameIdCounter = 1
    this.playerIdCounter = 1
    this.roundIdCounter = 1
    this.testIdGenerator.reset()
    GameFactory.resetCounter()
  }

  /**
   * Generate W40K army names for realistic player pseudos
   */
  static generateArmyBasedPseudo(): string {
    const armies = [
      'SpaceMarine', 'ImperialGuard', 'Tau', 'Eldar', 'Ork', 'Chaos',
      'Tyranid', 'Necron', 'DarkEldar', 'BloodAngel', 'Ultramarine'
    ]
    
    const suffixes = ['Commander', 'Veteran', 'Alpha', 'Prime', 'Lord', 'Captain', 'Sergeant']
    
    const army = armies[Math.floor(Math.random() * armies.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    
    return `${army}_${suffix}`
  }
}