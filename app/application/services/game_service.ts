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
import UpdateRoundScoreCommand from '#application/commands/update_round_score_command'
// Partie service imports
import { CreatePartieDto } from '#application/dto/create_partie_dto'
import { PartieResponseDto, PartieListResponseDto } from '#application/dto/partie_response_dto'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import { PartieMapper } from '#application/mappers/partie_mapper'
import { PaginationService } from '#application/services/pagination_service'
import PartieDeletedEvent from '#domain/events/partie_deleted_event'

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
    const opponentPlayer = players.find((p) => p.userId !== data.userId)
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

    // NOUVEAU : Créer automatiquement 5 rounds vides si aucun rounds fourni (undefined)
    // Si rounds: [] est passé explicitement, on respecte la volonté de l'utilisateur
    if (data.rounds === undefined) {
      const initialRounds = await this.createInitialRounds(savedGame.id)
      rounds.push(...initialRounds)
    } else if (data.rounds && data.rounds.length > 0) {
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
            const playerIndex = Number.parseInt(scoreData.playerId) - 1 // Convert to 0-based index
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

  /**
   * Crée automatiquement 5 rounds vides pour une nouvelle partie
   * 
   * Chaque round est créé avec des scores par défaut à 0
   * Utilisé lors de la création d'une partie via le wizard
   */
  private async createInitialRounds(gameId: GameId): Promise<Round[]> {
    const rounds: Round[] = []
    
    for (let i = 1; i <= 5; i++) {
      const roundId = new RoundId(Math.floor(Math.random() * 1000000))
      const round = Round.createEmpty(
        roundId,
        gameId,
        new RoundNumber(i)
      )
      
      const savedRound = await this.roundRepository.save(round)
      rounds.push(savedRound)
    }
    
    return rounds
  }

  /**
   * Met à jour le score d'un round spécifique
   * 
   * Utilisé pour l'édition inline des scores dans l'interface
   */
  async updateRoundScore(command: UpdateRoundScoreCommand): Promise<Round> {
    // 1. Récupérer le round
    const round = await this.roundRepository.findById(command.roundId)
    if (!round) {
      throw new Error(`Round not found: ${command.roundId.value}`)
    }

    // 2. Vérifier que le round appartient à la bonne partie
    if (!round.gameId.equals(command.gameId)) {
      throw new Error(`Round ${command.roundId.value} does not belong to game ${command.gameId.value}`)
    }

    // 3. Récupérer les scores actuels (défaut 0)
    const currentPlayerScore = round.playerScore ?? 0
    const currentOpponentScore = round.opponentScore ?? 0

    // 4. Déterminer quel score mettre à jour
    const isMainPlayer = await this.isMainPlayer(command.gameId, command.playerId)
    
    const newPlayerScore = isMainPlayer ? command.score : currentPlayerScore
    const newOpponentScore = isMainPlayer ? currentOpponentScore : command.score

    // 5. Mettre à jour les scores (garantis non-undefined)
    round.updateScores(newPlayerScore, newOpponentScore)

    // 6. Sauvegarder
    return await this.roundRepository.save(round)
  }

  /**
   * Vérifie si un joueur est le joueur principal de la partie
   * 
   * Le joueur principal est celui qui a créé la partie (game.userId)
   */
  private async isMainPlayer(gameId: GameId, playerId: PlayerId): Promise<boolean> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new Error(`Game not found: ${gameId.value}`)
    }
    
    const players = await this.playerRepository.findByGameId(gameId)
    const mainPlayer = players.find(p => p.userId === game.userId)
    
    return mainPlayer?.id.equals(playerId) ?? false
  }

  /**
   * Vérifie qu'un utilisateur a accès à une partie
   * 
   * L'accès est autorisé si l'utilisateur est le créateur ou un participant
   */
  async userHasAccessToGame(gameId: GameId, userId: number): Promise<boolean> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      return false
    }

    // L'utilisateur est le créateur de la partie
    if (game.userId === userId) {
      return true
    }

    // L'utilisateur est un participant de la partie
    const players = await this.playerRepository.findByGameId(gameId)
    const userPlayer = players.find(p => p.userId === userId)
    
    return !!userPlayer
  }

  // ========================================
  // PARTIE SERVICE METHODS (Issue #14)
  // ========================================

  /**
   * Create a new partie (simplified game creation)
   *
   * @param dto - CreatePartieDto with game configuration
   * @returns PartieResponseDto with created partie data
   */
  async createPartie(dto: CreatePartieDto): Promise<PartieResponseDto> {
    // 1. Validate via CreateGameCommand (reuse existing validation)
    const createCommand = new CreateGameCommand(
      dto.userId,
      dto.gameType,
      dto.pointsLimit,
      dto.opponentId,
      dto.mission
    )

    // 2. Create game entity via existing factory
    const gameType = GameType.fromValue(dto.gameType)
    const pointsLimit = new PointsLimit(dto.pointsLimit)

    // Generate a temporary ID - will be replaced by database on save
    const tempGameId = new GameId(Math.floor(Math.random() * 1000000))

    const game = Game.createNew(tempGameId, createCommand.userId, gameType, pointsLimit)

    // Set mission if provided (without starting the game)
    if (dto.mission) {
      game.setMission(dto.mission)
    }

    // 3. Save game to get persistent ID
    const savedGame = await this.gameRepository.save(game)

    // 4. Set opponent if provided
    if (dto.opponentId) {
      savedGame.setOpponent(dto.opponentId)
      await this.gameRepository.save(savedGame)
    }

    // 5. Return mapped DTO
    return PartieMapper.toDto(savedGame)
  }

  /**
   * Get a partie by ID
   *
   * @param id - GameId of the partie to retrieve
   * @returns PartieResponseDto or null if not found
   */
  async getPartie(id: GameId): Promise<PartieResponseDto | null> {
    const game = await this.gameRepository.findById(id)

    if (!game) {
      return null
    }

    return PartieMapper.toDto(game)
  }

  /**
   * List parties with advanced filtering and cursor-based pagination
   *
   * @param filters - PartieFilterDto with filtering options
   * @returns PartieListResponseDto with paginated results
   */
  async listParties(filters: PartieFilterDto): Promise<PartieListResponseDto> {
    // 1. Get all games from repository
    // Note: In a real implementation, filtering would be done at the repository level
    // For TDD purposes, we'll get all games and filter in the service
    const games = await this.gameRepository.findAll()

    // 2. Convert to DTOs
    const parties = PartieMapper.toDtoArray(games)

    // 3. Apply advanced filtering that might not be at repository level
    let filteredParties = this.applyAdvancedFilters(parties, filters)

    // 4. Apply pagination
    return PaginationService.paginate(filteredParties, filters)
  }

  /**
   * Delete a partie and all related entities
   *
   * @param id - GameId of the partie to delete
   */
  async deletePartie(id: GameId): Promise<void> {
    // 1. Get the game to validate it exists and get user info for event
    const game = await this.gameRepository.findById(id)
    if (!game) {
      throw new Error('Partie not found')
    }

    // 2. Use existing deleteCompleteGame logic
    await this.deleteCompleteGame(id)

    // 3. Raise partie-specific domain event
    // Note: In a full implementation, we would publish this event
    // For now, we're focusing on the structure
    new PartieDeletedEvent(id, game.userId, 'partie', 'partie_service', {
      gameType: game.gameType.value,
      status: game.status.value,
      deletedBy: 'system', // Could be enhanced to track actual user
    })
  }

  /**
   * Update partie status (start, complete, cancel)
   *
   * @param id - GameId of the partie to update
   * @param status - New status ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')
   * @returns Updated PartieResponseDto
   */
  async updatePartieStatus(id: GameId, status: string): Promise<PartieResponseDto> {
    const game = await this.gameRepository.findById(id)
    if (!game) {
      throw new Error('Partie not found')
    }

    // Apply status change based on current status and target status
    switch (status.toUpperCase()) {
      case 'IN_PROGRESS':
        if (!game.isInProgress()) {
          game.start('Status updated via Partie service')
        }
        break

      case 'COMPLETED':
        if (game.isInProgress()) {
          // For simplicity, complete with 0-0 score if no scores set
          const playerScore = game.playerScore || 0
          const opponentScore = game.opponentScore || 0
          game.complete(playerScore, opponentScore)
        }
        break

      case 'CANCELLED':
        game.cancel()
        break

      default:
        throw new Error(`Invalid status: ${status}`)
    }

    const savedGame = await this.gameRepository.save(game)
    return PartieMapper.toDto(savedGame)
  }

  /**
   * Apply advanced filters that might not be handled at repository level
   *
   * @param parties - Array of PartieResponseDto to filter
   * @param filters - PartieFilterDto with filtering criteria
   * @returns Filtered array of PartieResponseDto
   */
  private applyAdvancedFilters(
    parties: PartieResponseDto[],
    filters: PartieFilterDto
  ): PartieResponseDto[] {
    let filtered = [...parties]

    // Filter by user ID
    if (filters.userId) {
      filtered = filtered.filter((partie) => partie.userId === filters.userId)
    }

    // Filter by opponent ID
    if (filters.opponentId) {
      filtered = filtered.filter((partie) => partie.opponentId === filters.opponentId)
    }

    // Filter by status array
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((partie) => filters.status!.includes(partie.status))
    }

    // Filter by game type
    if (filters.gameType) {
      filtered = filtered.filter((partie) => partie.gameType === filters.gameType)
    }

    // Filter by points limit
    if (filters.pointsLimit && filters.pointsLimit.length > 0) {
      filtered = filtered.filter((partie) => filters.pointsLimit!.includes(partie.pointsLimit))
    }

    // Filter by date ranges
    if (filters.dateFrom) {
      filtered = filtered.filter((partie) => new Date(partie.createdAt) >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      filtered = filtered.filter((partie) => new Date(partie.createdAt) <= filters.dateTo!)
    }

    // Filter by has opponent
    if (filters.hasOpponent !== undefined) {
      filtered = filtered.filter((partie) =>
        filters.hasOpponent ? !!partie.opponentId : !partie.opponentId
      )
    }

    // Filter by has mission
    if (filters.hasMission !== undefined) {
      filtered = filtered.filter((partie) =>
        filters.hasMission ? !!partie.mission : !partie.mission
      )
    }

    return filtered
  }
}
