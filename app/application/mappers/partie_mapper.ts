import Game from '#domain/entities/game'
import { PartieResponseDto } from '#application/dto/partie_response_dto'

/**
 * PartieMapper
 * Maps Game domain entity to PartieResponseDto
 * Follows DDD mapping patterns between layers
 */
export class PartieMapper {
  /**
   * Maps Game entity to PartieResponseDto
   */
  static toDto(game: Game): PartieResponseDto {
    return {
      id: game.id.value.toString(),
      userId: game.userId,
      gameType: game.gameType.value,
      pointsLimit: game.pointsLimit.value,
      status: game.status.value,
      opponentId: game.opponentId || undefined,
      mission: game.mission || undefined,
      playerScore: game.playerScore || undefined,
      opponentScore: game.opponentScore || undefined,
      notes: game.notes || undefined,
      createdAt: game.createdAt,
      startedAt: game.startedAt || undefined,
      completedAt: game.completedAt || undefined,
      // Enhanced metadata
      metadata: {
        winner: game.getWinner() || undefined,
        isInProgress: game.isInProgress(),
        canBeModified: game.status.value === 'PLANNED' || game.status.value === 'IN_PROGRESS',
      },
    }
  }

  /**
   * Maps array of Game entities to PartieResponseDto array
   */
  static toDtoArray(games: Game[]): PartieResponseDto[] {
    return games.map((game) => this.toDto(game))
  }
}
