import Player from '#domain/entities/player'
import { JoueurResponseDto } from '#application/dto/joueur_response_dto'

/**
 * JoueurMapper
 * Maps Player domain entity to JoueurResponseDto
 * Follows DDD mapping patterns between layers
 */
export class JoueurMapper {
  /**
   * Maps Player entity to JoueurResponseDto
   */
  static toDto(player: Player, gameOwnerId?: number): JoueurResponseDto {
    return {
      id: player.id.value.toString(),
      partieId: player.gameId.value.toString(),
      pseudo: player.pseudo.value,
      userId: player.userId,
      isGuest: player.isGuest,
      isOwner: player.userId === gameOwnerId,
      createdAt: player.createdAt,
    }
  }

  /**
   * Maps array of Player entities to JoueurResponseDto array
   */
  static toDtoArray(players: Player[], gameOwnerId?: number): JoueurResponseDto[] {
    return players.map((player) => this.toDto(player, gameOwnerId))
  }
}