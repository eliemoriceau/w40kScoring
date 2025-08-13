import { UpdateRoundScoresDto } from '#application/dto/update_round_scores_dto'
import { CompleteRoundDto } from '#application/dto/complete_round_dto'
import { RoundResponseDto, RoundListResponseDto } from '#application/dto/round_response_dto'
import { RoundMapper } from '#application/mappers/round_mapper'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import { RoundRepository } from '#domain/repositories/round_repository'
import { GameRepository } from '#domain/repositories/i_game_repository'
import { PlayerRepository } from '#domain/repositories/player_repository'
import { GameNotInProgressError } from '#domain/errors/game_not_in_progress_error'
import { RoundNotFoundError } from '#domain/errors/round_not_found_error'
import { RoundAlreadyCompletedError } from '#domain/errors/round_already_completed_error'
import { UnauthorizedRoundAccessError } from '#domain/errors/unauthorized_round_access_error'

/**
 * RoundService - Application Service
 *
 * Orchestrates round operations following hexagonal architecture principles.
 * Handles business validation, authorization, and domain events.
 */
export default class RoundService {
  constructor(
    private roundRepository: RoundRepository,
    private gameRepository: GameRepository,
    private playerRepository: PlayerRepository
  ) {}

  /**
   * Update round scores with authorization and validation
   */
  async updateRoundScores(dto: UpdateRoundScoresDto): Promise<RoundResponseDto> {
    // 1. Authorization: verify requesting user is owner or participant
    const gameId = new GameId(Number(dto.gameId))
    const game = await this.gameRepository.findById(gameId)

    if (!game) {
      throw new RoundNotFoundError(dto.gameId, dto.roundNumber) // Game not found
    }

    // Check if user is authorized (owner or participant)
    const isOwner = game.userId === dto.requestingUserId
    let isParticipant = false

    if (!isOwner) {
      const participant = await this.playerRepository.findByGameAndUser(
        gameId,
        dto.requestingUserId
      )
      isParticipant = participant !== null
    }

    if (!isOwner && !isParticipant) {
      throw new UnauthorizedRoundAccessError(dto.gameId, dto.requestingUserId)
    }

    // 2. Check game state - must be IN_PROGRESS
    if (!game.isInProgress()) {
      throw new GameNotInProgressError(dto.gameId)
    }

    // 3. Find the round
    const roundNumber = new RoundNumber(dto.roundNumber)
    const round = await this.roundRepository.findByGameIdAndNumber(gameId, roundNumber)

    if (!round) {
      throw new RoundNotFoundError(dto.gameId, dto.roundNumber)
    }

    // 4. Check if round is already completed
    if (round.isCompleted) {
      throw new RoundAlreadyCompletedError(dto.gameId, dto.roundNumber)
    }

    // 5. Update scores
    round.updateScores(dto.playerScore, dto.opponentScore)

    // 6. Save round
    const savedRound = await this.roundRepository.save(round)

    // 7. Return DTO with authorization context
    const canModify = (isOwner || isParticipant) && game.isInProgress()
    return RoundMapper.toDto(savedRound, game, canModify)
  }

  /**
   * Complete a round with authorization and validation
   */
  async completeRound(dto: CompleteRoundDto): Promise<RoundResponseDto> {
    // 1. Authorization: verify requesting user is owner or participant
    const gameId = new GameId(Number(dto.gameId))
    const game = await this.gameRepository.findById(gameId)

    if (!game) {
      throw new RoundNotFoundError(dto.gameId, dto.roundNumber)
    }

    // Check authorization
    const isOwner = game.userId === dto.requestingUserId
    let isParticipant = false

    if (!isOwner) {
      const participant = await this.playerRepository.findByGameAndUser(
        gameId,
        dto.requestingUserId
      )
      isParticipant = participant !== null
    }

    if (!isOwner && !isParticipant) {
      throw new UnauthorizedRoundAccessError(dto.gameId, dto.requestingUserId)
    }

    // 2. Check game state
    if (!game.isInProgress()) {
      throw new GameNotInProgressError(dto.gameId)
    }

    // 3. Find the round
    const roundNumber = new RoundNumber(dto.roundNumber)
    const round = await this.roundRepository.findByGameIdAndNumber(gameId, roundNumber)

    if (!round) {
      throw new RoundNotFoundError(dto.gameId, dto.roundNumber)
    }

    // 4. Complete round (idempotent - if already completed, do nothing)
    if (!round.isCompleted) {
      round.completeRound(round.playerScore, round.opponentScore)
      await this.roundRepository.save(round)
    }

    // 5. Return DTO
    const canModify = false // Completed rounds cannot be modified
    return RoundMapper.toDto(round, game, canModify)
  }

  /**
   * List rounds for a game with authorization
   */
  async listRounds(gameId: string, requestingUserId: number): Promise<RoundListResponseDto> {
    // 1. Authorization (owner or participant can read)
    const gameIdObj = new GameId(Number(gameId))
    const game = await this.gameRepository.findById(gameIdObj)

    if (!game) {
      throw new RoundNotFoundError(gameId, 0) // Game not found
    }

    const isOwner = game.userId === requestingUserId
    let isParticipant = false

    if (!isOwner) {
      const participant = await this.playerRepository.findByGameAndUser(gameIdObj, requestingUserId)
      isParticipant = participant !== null
    }

    if (!isOwner && !isParticipant) {
      throw new UnauthorizedRoundAccessError(gameId, requestingUserId)
    }

    // 2. Retrieve rounds
    const rounds = await this.roundRepository.findByGameId(gameIdObj)

    // 3. Map to DTOs with authorization context
    const canModify = (isOwner || isParticipant) && game.isInProgress()
    const roundsDto = RoundMapper.toDtoArray(rounds, game, canModify)

    return {
      rounds: roundsDto,
      pagination: {
        hasMore: false, // Simple pagination - all rounds returned
        total: roundsDto.length,
      },
    }
  }
}
