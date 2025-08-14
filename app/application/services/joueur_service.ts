import { AddJoueurDto } from '#application/dto/add_joueur_dto'
import { JoueurResponseDto, JoueurListResponseDto } from '#application/dto/joueur_response_dto'
import { JoueurMapper } from '#application/mappers/joueur_mapper'
import Player from '#domain/entities/player'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import { GameRepository } from '#domain/repositories/i_game_repository'
import { PlayerRepository } from '#domain/repositories/player_repository'
import { IdGenerator } from '#domain/services/id_generator'
import { PseudoAlreadyTakenError } from '#domain/errors/pseudo_already_taken_error'
import { PartieNotFoundError } from '#domain/errors/partie_not_found_error'
import { UnauthorizedPartieAccessError } from '#domain/errors/unauthorized_partie_access_error'

/**
 * JoueurService - Application Service
 *
 * Orchestrates joueur operations following hexagonal architecture principles.
 * Handles business validation, authorization, and domain events.
 */
export default class JoueurService {
  constructor(
    private playerRepository: PlayerRepository,
    private gameRepository: GameRepository,
    private idGenerator: IdGenerator
  ) {}

  /**
   * Add a joueur to a partie with authorization and validation
   */
  async addJoueur(dto: AddJoueurDto): Promise<JoueurResponseDto> {
    // 1. Authorization: verify requesting user is owner of the partie
    const gameId = new GameId(Number(dto.partieId))
    const game = await this.gameRepository.findById(gameId)

    if (!game) {
      throw new PartieNotFoundError(dto.partieId)
    }

    if (game.userId !== dto.requestingUserId) {
      throw new UnauthorizedPartieAccessError(dto.partieId, dto.requestingUserId)
    }

    // 2. Check pseudo uniqueness in the partie
    const pseudoTaken = await this.playerRepository.isPseudoTakenInGame(gameId, dto.pseudo)
    if (pseudoTaken) {
      throw new PseudoAlreadyTakenError(dto.pseudo, dto.partieId)
    }

    // 3. Create the player
    const playerId = this.idGenerator.generatePlayerId()
    const pseudo = new Pseudo(dto.pseudo)

    const player = dto.userId
      ? Player.createForRegisteredUser(playerId, gameId, dto.userId, pseudo)
      : Player.createForGuest(playerId, gameId, pseudo)

    // 4. Save player (with race condition handling)
    try {
      const savedPlayer = await this.playerRepository.save(player)
      return JoueurMapper.toDto(savedPlayer, game.userId)
    } catch (error) {
      // Map database errors to domain errors
      if (this.isDuplicateError(error)) {
        throw new PseudoAlreadyTakenError(dto.pseudo, dto.partieId)
      }
      throw error
    }
  }

  /**
   * List joueurs in a partie with authorization
   */
  async listJoueurs(partieId: string, requestingUserId: number): Promise<JoueurListResponseDto> {
    // 1. Authorization (owner or participant can read)
    const gameId = new GameId(Number(partieId))
    const game = await this.gameRepository.findById(gameId)

    if (!game) {
      throw new PartieNotFoundError(partieId)
    }

    const isOwner = game.userId === requestingUserId
    const isParticipant = await this.playerRepository.findByGameAndUser(gameId, requestingUserId)

    if (!isOwner && !isParticipant) {
      throw new UnauthorizedPartieAccessError(partieId, requestingUserId)
    }

    // 2. Retrieve joueurs
    const players = await this.playerRepository.findByGameId(gameId)
    const joueursDto = JoueurMapper.toDtoArray(players, game.userId)

    return {
      joueurs: joueursDto,
      pagination: {
        hasMore: false, // Simple pagination for now
        total: joueursDto.length,
      },
    }
  }

  /**
   * Check if error is a database duplicate constraint error
   */
  private isDuplicateError(error: any): boolean {
    // PostgreSQL unique violation
    if (error.code === '23505') return true
    // SQLite unique constraint
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return true
    return false
  }
}
