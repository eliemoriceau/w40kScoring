import { AddScoreDto } from '#application/dto/add_score_dto'
import { UpdateScoreDto } from '#application/dto/update_score_dto'
import {
  ScoreResponseDto,
  ScoreListResponseDto,
  PlayerTotalResponseDto,
} from '#application/dto/score_response_dto'
import { ScoreMapper } from '#application/mappers/score_mapper'
import Score from '#domain/entities/score'
import GameId from '#domain/value-objects/game_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import RoundNumber from '#domain/value-objects/round_number'
import ScoreId from '#domain/value-objects/score_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import { ScoreCommandRepository } from '#domain/repositories/score_command_repository'
import { ScoreQueryRepository } from '#domain/repositories/score_query_repository'
import { GameQueryRepository } from '#domain/repositories/game_query_repository'
import { RoundQueryRepository } from '#domain/repositories/round_query_repository'
import { PlayerQueryRepository } from '#domain/repositories/player_query_repository'
import { IdGenerator } from '#domain/services/id_generator'
import { InvalidScoreTypeForServiceError } from '#domain/errors/invalid_score_type_for_service_error'
import { ScoreValueOutOfRangeError } from '#domain/errors/score_value_out_of_range_error'
import { SecondaryScoreNameRequiredError } from '#domain/errors/secondary_score_name_required_error'
import { ChallengerForbiddenInFirstRoundError } from '#domain/errors/challenger_forbidden_in_first_round_error'
import { ChallengerAlreadyExistsInRoundError } from '#domain/errors/challenger_already_exists_in_round_error'
import { InsufficientDeficitForChallengerError } from '#domain/errors/insufficient_deficit_for_challenger_error'
import { OpponentNotFoundForChallengerError } from '#domain/errors/opponent_not_found_for_challenger_error'
import { UnauthorizedScoreAccessError } from '#domain/errors/unauthorized_score_access_error'
import { RoundNotFoundError } from '#domain/errors/round_not_found_error'

/**
 * ScoreService - Application Service
 *
 * Orchestrates score operations following hexagonal architecture principles.
 * Handles business validation, authorization, and complex CHALLENGER rules.
 * Supports only PRIMARY, SECONDARY, CHALLENGER score types.
 */
export default class ScoreService {
  private static readonly ALLOWED_TYPES = ['PRIMARY', 'SECONDARY', 'CHALLENGER'] as const
  private static readonly MIN_VALUE = 0
  private static readonly MAX_VALUE = 15
  private static readonly MIN_DEFICIT_FOR_CHALLENGER = 6

  constructor(
    private scoreRepository: ScoreCommandRepository & ScoreQueryRepository,
    private gameRepository: GameQueryRepository,
    private roundRepository: RoundQueryRepository,
    private playerRepository: PlayerQueryRepository,
    private idGenerator: IdGenerator
  ) {}

  /**
   * Add a new score with comprehensive validation and business rules
   */
  async addScore(dto: AddScoreDto): Promise<ScoreResponseDto> {
    // 1. Basic validation
    this.validateScoreType(dto.scoreType)
    this.validateScoreValue(dto.scoreValue)
    this.validateSecondaryScoreName(dto.scoreType, dto.scoreName)

    // 2. Get round and game for authorization and business rules
    const roundId = new RoundId(Number(dto.roundId))
    const round = await this.roundRepository.findById(roundId)
    if (!round) {
      throw new RoundNotFoundError(dto.roundId, 0)
    }

    const game = await this.gameRepository.findById(round.gameId)
    if (!game) {
      throw new RoundNotFoundError(dto.roundId, 0)
    }

    // 3. Authorization: owner or participant
    await this.validateAuthorization(game.id, dto.requestingUserId)

    // 4. CHALLENGER-specific business rules
    if (dto.scoreType === 'CHALLENGER') {
      await this.validateChallengerRules(dto, round, game.id)
    }

    // 5. Create and save score
    const playerId = new PlayerId(Number(dto.playerId))
    const scoreType = new ScoreType(dto.scoreType)
    const scoreName = new ScoreName(dto.scoreName || 'Default')
    const scoreValue = ScoreValue.forType(dto.scoreValue, scoreType)

    const score = Score.create({
      roundId,
      playerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: this.idGenerator,
    })

    const savedScore = await this.scoreRepository.save(score)

    // 6. Return response with authorization context
    const canModify = await this.canUserModifyScores(game.id, dto.requestingUserId)
    return ScoreMapper.toDto(savedScore, game, canModify)
  }

  /**
   * Update an existing score
   */
  async updateScore(dto: UpdateScoreDto): Promise<ScoreResponseDto> {
    // 1. Basic validation
    this.validateScoreValue(dto.scoreValue)

    // 2. Get existing score
    const scoreId = new ScoreId(Number(dto.scoreId))
    const score = await this.scoreRepository.findById(scoreId)
    if (!score) {
      throw new Error(`Score ${dto.scoreId} not found`)
    }

    // 3. Get round and game for authorization
    const round = await this.roundRepository.findById(score.roundId)
    if (!round) {
      throw new RoundNotFoundError(score.roundId.value.toString(), 0)
    }

    const game = await this.gameRepository.findById(round.gameId)
    if (!game) {
      throw new RoundNotFoundError(score.roundId.value.toString(), 0)
    }

    // 4. Authorization
    await this.validateAuthorization(game.id, dto.requestingUserId)

    // 5. Update score
    const newValue = ScoreValue.forType(dto.scoreValue, score.scoreType)
    score.updateValue(newValue)

    if (dto.scoreName) {
      const newName = new ScoreName(dto.scoreName)
      score.updateName(newName)
    }

    const savedScore = await this.scoreRepository.save(score)

    // 6. Return response
    const canModify = await this.canUserModifyScores(game.id, dto.requestingUserId)
    return ScoreMapper.toDto(savedScore, game, canModify)
  }

  /**
   * List all scores for a round (public access)
   */
  async listScores(roundId: string): Promise<ScoreListResponseDto> {
    // 1. Get round and game
    const roundIdObj = new RoundId(Number(roundId))
    const round = await this.roundRepository.findById(roundIdObj)
    if (!round) {
      throw new RoundNotFoundError(roundId, 0)
    }

    const game = await this.gameRepository.findById(round.gameId)
    if (!game) {
      throw new RoundNotFoundError(roundId, 0)
    }

    // 2. Get all scores for round
    const scores = await this.scoreRepository.findByRoundId(roundIdObj)

    // 3. Return list (public access - no authorization needed for reading)
    return ScoreMapper.toListDto(scores, game, false)
  }

  /**
   * Get total score for a player in a specific game
   */
  async getTotal(playerId: string, gameId: string): Promise<PlayerTotalResponseDto> {
    // 1. Get all scores for player in this game
    const playerIdObj = new PlayerId(Number(playerId))
    const gameIdObj = new GameId(Number(gameId))

    const scores = await this.scoreRepository.findByPlayerInGame(playerIdObj, gameIdObj)

    // 2. Calculate total with breakdown
    return ScoreMapper.toPlayerTotalDto(scores, playerId, gameId)
  }

  /**
   * Validate score type is allowed in ScoreService
   */
  private validateScoreType(scoreType: string): void {
    if (!ScoreService.ALLOWED_TYPES.includes(scoreType as any)) {
      throw new InvalidScoreTypeForServiceError(scoreType, ScoreService.ALLOWED_TYPES)
    }
  }

  /**
   * Validate score value is within allowed range (0-15)
   */
  private validateScoreValue(value: number): void {
    if (value < ScoreService.MIN_VALUE || value > ScoreService.MAX_VALUE) {
      throw new ScoreValueOutOfRangeError(value, ScoreService.MIN_VALUE, ScoreService.MAX_VALUE)
    }
  }

  /**
   * Validate SECONDARY score has a name
   */
  private validateSecondaryScoreName(scoreType: string, scoreName: string): void {
    if (scoreType === 'SECONDARY' && (!scoreName || scoreName.trim().length === 0)) {
      throw new SecondaryScoreNameRequiredError()
    }
  }

  /**
   * Validate user authorization (owner or participant)
   */
  private async validateAuthorization(gameId: GameId, requestingUserId: number): Promise<void> {
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new UnauthorizedScoreAccessError(requestingUserId, gameId.value.toString())
    }

    // Check if user is owner
    const isOwner = game.userId === requestingUserId

    // Check if user is participant
    let isParticipant = false
    if (!isOwner) {
      const participant = await this.playerRepository.findByGameAndUser(gameId, requestingUserId)
      isParticipant = participant !== null
    }

    if (!isOwner && !isParticipant) {
      throw new UnauthorizedScoreAccessError(requestingUserId, gameId.value.toString())
    }
  }

  /**
   * Check if user can modify scores
   */
  private async canUserModifyScores(gameId: GameId, userId: number): Promise<boolean> {
    try {
      await this.validateAuthorization(gameId, userId)
      const game = await this.gameRepository.findById(gameId)
      return game?.isInProgress() || false
    } catch {
      return false
    }
  }

  /**
   * Validate complex CHALLENGER business rules
   */
  private async validateChallengerRules(
    dto: AddScoreDto,
    round: any,
    gameId: GameId
  ): Promise<void> {
    // Rule 1: CHALLENGER forbidden in first round
    if (round.roundNumber.value === 1) {
      throw new ChallengerForbiddenInFirstRoundError()
    }

    // Rule 2: Only one CHALLENGER per round
    const challengerExists = await this.scoreRepository.existsChallengerInRound(round.id)
    if (challengerExists) {
      throw new ChallengerAlreadyExistsInRoundError(dto.roundId)
    }

    // Rule 3: Player must have deficit >= 6 points in previous round
    const deficit = await this.calculatePreviousRoundDeficit(
      new PlayerId(Number(dto.playerId)),
      gameId,
      round.roundNumber
    )

    if (deficit < ScoreService.MIN_DEFICIT_FOR_CHALLENGER) {
      throw new InsufficientDeficitForChallengerError(
        deficit,
        ScoreService.MIN_DEFICIT_FOR_CHALLENGER
      )
    }
  }

  /**
   * Calculate deficit from previous round (OpponentScore - PlayerScore)
   */
  private async calculatePreviousRoundDeficit(
    playerId: PlayerId,
    gameId: GameId,
    currentRoundNumber: RoundNumber
  ): Promise<number> {
    // 1. Find previous round
    const previousRound = await this.roundRepository.findPreviousRound(gameId, currentRoundNumber)
    if (!previousRound) {
      throw new ChallengerForbiddenInFirstRoundError()
    }

    // 2. Get player's scores in previous round
    const playerScores = await this.scoreRepository.findByRoundAndPlayer(previousRound.id, playerId)
    const playerTotal = this.calculateScoreTotal(playerScores)

    // 3. Find opponent and get their scores
    const allPlayersInGame = await this.scoreRepository.findPlayersInGame(gameId)
    const opponent = allPlayersInGame.find((id) => !id.equals(playerId))

    if (!opponent) {
      throw new OpponentNotFoundForChallengerError(
        gameId.value.toString(),
        playerId.value.toString()
      )
    }

    const opponentScores = await this.scoreRepository.findByRoundAndPlayer(
      previousRound.id,
      opponent
    )
    const opponentTotal = this.calculateScoreTotal(opponentScores)

    // 4. Calculate deficit: OpponentScore - PlayerScore
    return opponentTotal - playerTotal
  }

  /**
   * Calculate total from array of scores
   */
  private calculateScoreTotal(scores: Score[]): number {
    return scores.reduce((total, score) => total + score.scoreValue.value, 0)
  }
}
