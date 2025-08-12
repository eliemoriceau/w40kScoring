import Game from '#domain/entities/game'
import Player from '#domain/entities/player'
import Round from '#domain/entities/round'
import Score from '#domain/entities/score'
import GameId from '#domain/value-objects/game_id'
import PlayerId from '#domain/value-objects/player_id'
import RoundId from '#domain/value-objects/round_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import Pseudo from '#domain/value-objects/pseudo'
import RoundNumber from '#domain/value-objects/round_number'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import { GameRepository } from '#domain/repositories/i_game_repository'
import { PlayerRepository } from '#domain/repositories/player_repository'
import { RoundRepository } from '#domain/repositories/round_repository'
import { ScoreRepository } from '#domain/repositories/score_repository'
import { IdGenerator } from '#domain/services/id_generator'
import CreateGameCommand from '#application/commands/create_game_command'
import StartGameCommand from '#application/commands/start_game_command'

/**
 * Complete Game Result for integration operations
 */
export interface CompleteGameResult {
  game: Game
  players: Player[]
  rounds: Round[]
  scores: Score[]
}

/**
 * Player Data for game creation
 */
export interface PlayerData {
  pseudo: string
  userId?: number | null
}

/**
 * Round Data for game creation
 */
export interface RoundData {
  roundNumber: number
  playerScore: number
  opponentScore: number
  scores?: Array<{
    playerId: string
    scoreType: string
    scoreName: string
    scoreValue: number
  }>
}

/**
 * Complete Game Data for creation
 */
export interface CompleteGameData {
  userId: number
  gameType: string
  pointsLimit: number
  players: PlayerData[]
  rounds?: RoundData[]
  mission?: string
}

/**
 * GameService - Application Service
 * 
 * Orchestrates complete game operations across all domain boundaries.
 * Provides high-level business operations for integration testing.
 * 
 * This service demonstrates the complete flow from Application layer
 * through Domain entities to Infrastructure persistence.
 */
export default class GameService {
  constructor(
    private gameRepository: GameRepository,
    private playerRepository: PlayerRepository,
    private roundRepository: RoundRepository,
    private scoreRepository: ScoreRepository,
    private idGenerator: IdGenerator
  ) {}

  /**
   * Create a complete game with players, rounds, and scores
   * 
   * This method demonstrates the full application layer orchestration:
   * 1. Domain validation through Commands
   * 2. Entity creation and business rules
   * 3. Cross-aggregate coordination
   * 4. Infrastructure persistence
   */
  async createCompleteGame(data: CompleteGameData): Promise<CompleteGameResult> {
    // 1. Validate command
    const createCommand = new CreateGameCommand(
      data.userId,
      data.gameType,
      data.pointsLimit,
      undefined,
      data.mission
    )

    // 2. Create game entity
    const gameType = GameType.fromValue(data.gameType)
    const pointsLimit = new PointsLimit(data.pointsLimit)
    
    // Generate a temporary ID - will be replaced by database on save
    const tempGameId = new GameId(Math.floor(Math.random() * 1000000))
    
    const game = Game.createNew(tempGameId, createCommand.userId, gameType, pointsLimit)

    // 3. Save game to get persistent ID
    const savedGame = await this.gameRepository.save(game)

    // 4. Create players for the game
    const players: Player[] = []
    for (const playerData of data.players) {
      // Generate a temporary PlayerId - will be replaced by database on save
      const tempPlayerId = new PlayerId(Math.floor(Math.random() * 1000000))
      const pseudo = new Pseudo(playerData.pseudo)
      
      const player = playerData.userId 
        ? Player.createForRegisteredUser(tempPlayerId, savedGame.id, playerData.userId, pseudo)
        : Player.createForGuest(tempPlayerId, savedGame.id, pseudo)
      
      const savedPlayer = await this.playerRepository.save(player)
      players.push(savedPlayer)
    }

    // 5. Set opponent if available
    const opponentPlayer = players.find(p => p.userId !== data.userId)
    if (opponentPlayer && opponentPlayer.userId) {
      savedGame.setOpponent(opponentPlayer.userId)
      await this.gameRepository.save(savedGame)
    }

    // 6. Start game if we have rounds to add
    let startedGame = savedGame
    if (data.rounds && data.rounds.length > 0) {
      const startCommand = new StartGameCommand(savedGame.id.value, savedGame.userId, data.mission)
      startedGame.start(startCommand.mission)
      startedGame = await this.gameRepository.save(startedGame)
    }

    // 7. Create rounds and scores
    const rounds: Round[] = []
    const scores: Score[] = []

    if (data.rounds) {
      for (const roundData of data.rounds) {
        // Create round
        const tempRoundId = new RoundId(Math.floor(Math.random() * 1000000))
        const roundNumber = new RoundNumber(roundData.roundNumber)
        const round = Round.createNew(tempRoundId, startedGame.id, roundNumber)

        // Complete round with scores
        round.completeRound(roundData.playerScore, roundData.opponentScore)
        const savedRound = await this.roundRepository.save(round)
        rounds.push(savedRound)

        // Create detailed scores if provided
        if (roundData.scores) {
          for (const scoreData of roundData.scores) {
            // Map string player index to actual PlayerId
            const playerIndex = parseInt(scoreData.playerId) - 1 // Convert to 0-based index
            if (playerIndex < 0 || playerIndex >= players.length) {
              throw new Error(`Invalid player index: ${scoreData.playerId}`)
            }
            
            const playerId = players[playerIndex].id
            const scoreType = new ScoreType(scoreData.scoreType)
            const scoreName = new ScoreName(scoreData.scoreName) 
            const scoreValue = ScoreValue.forType(scoreData.scoreValue, scoreType)
            
            const score = Score.create({
              roundId: savedRound.id,
              playerId,
              scoreType,
              scoreName,
              scoreValue,
              idGenerator: this.idGenerator,
            })

            const savedScore = await this.scoreRepository.save(score)
            scores.push(savedScore)
          }
        }
      }

      // 8. Complete game with final scores only if rounds were processed
      if (rounds.length > 0) {
        const finalPlayerScore = rounds.reduce((sum, round) => sum + round.playerScore, 0)
        const finalOpponentScore = rounds.reduce((sum, round) => sum + round.opponentScore, 0)
        
        startedGame.complete(finalPlayerScore, finalOpponentScore)
        startedGame = await this.gameRepository.save(startedGame)
      }
    }

    return {
      game: startedGame,
      players,
      rounds,
      scores,
    }
  }

  /**
   * Get complete game data by ID
   * 
   * Demonstrates cross-repository queries and data aggregation
   */
  async getCompleteGame(gameId: GameId): Promise<CompleteGameResult | null> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) return null

    const players = await this.playerRepository.findByGameId(gameId)
    const rounds = await this.roundRepository.findByGameId(gameId)
    
    const scores: Score[] = []
    for (const round of rounds) {
      const roundScores = await this.scoreRepository.findByRoundId(round.id)
      scores.push(...roundScores)
    }

    return {
      game,
      players,
      rounds,
      scores,
    }
  }

  /**
   * Add round to existing game
   * 
   * Demonstrates game state management and validation
   */
  async addRoundToGame(
    gameId: GameId,
    roundNumber: number,
    playerScore: number,
    opponentScore: number
  ): Promise<Round> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (!game.isInProgress()) {
      throw new Error('Game must be in progress to add rounds')
    }

    const tempRoundId = new RoundId(Math.floor(Math.random() * 1000000))
    const round = Round.createNew(tempRoundId, gameId, new RoundNumber(roundNumber))

    round.completeRound(playerScore, opponentScore)
    return await this.roundRepository.save(round)
  }

  /**
   * Complete game with final scores
   * 
   * Demonstrates aggregate coordination and business rules
   */
  async completeGame(gameId: GameId): Promise<Game> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    const rounds = await this.roundRepository.findByGameId(gameId)
    
    const finalPlayerScore = rounds.reduce((sum, round) => sum + round.playerScore, 0)
    const finalOpponentScore = rounds.reduce((sum, round) => sum + round.opponentScore, 0)

    game.complete(finalPlayerScore, finalOpponentScore)
    return await this.gameRepository.save(game)
  }

  /**
   * Delete complete game (cascade)
   * 
   * Demonstrates transaction-like operations across aggregates
   */
  async deleteCompleteGame(gameId: GameId): Promise<void> {
    // Get all related entities first
    const players = await this.playerRepository.findByGameId(gameId)
    const rounds = await this.roundRepository.findByGameId(gameId)

    // Delete scores first (dependencies)
    for (const round of rounds) {
      const scores = await this.scoreRepository.findByRoundId(round.id)
      for (const score of scores) {
        await this.scoreRepository.delete(score.id)
      }
    }

    // Delete rounds
    for (const round of rounds) {
      await this.roundRepository.delete(round.id)
    }

    // Delete players
    for (const player of players) {
      await this.playerRepository.delete(player.id)
    }

    // Finally delete game
    await this.gameRepository.delete(gameId)
  }

  /**
   * Update game with new round and scores
   * 
   * Demonstrates complex business operations and validations
   */
  async updateGameWithRound(
    gameId: GameId,
    roundData: RoundData,
    playersMap: Map<string, PlayerId>
  ): Promise<{ round: Round; scores: Score[] }> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    // Create and save round
    const tempRoundId = new RoundId(Math.floor(Math.random() * 1000000))
    const round = Round.createNew(tempRoundId, gameId, new RoundNumber(roundData.roundNumber))

    round.completeRound(roundData.playerScore, roundData.opponentScore)
    const savedRound = await this.roundRepository.save(round)

    // Create detailed scores
    const scores: Score[] = []
    if (roundData.scores) {
      for (const scoreData of roundData.scores) {
        const playerId = playersMap.get(scoreData.playerId)
        if (!playerId) {
          throw new Error(`Player not found: ${scoreData.playerId}`)
        }

        const scoreType = new ScoreType(scoreData.scoreType)
        const scoreName = new ScoreName(scoreData.scoreName)
        const scoreValue = ScoreValue.forType(scoreData.scoreValue, scoreType)
        
        const score = Score.create({
          roundId: savedRound.id,
          playerId,
          scoreType,
          scoreName,
          scoreValue,
          idGenerator: this.idGenerator,
        })

        const savedScore = await this.scoreRepository.save(score)
        scores.push(savedScore)
      }
    }

    return { round: savedRound, scores }
  }
}