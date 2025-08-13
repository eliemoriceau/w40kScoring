import Round from '#domain/entities/round'
import Game from '#domain/entities/game'
import { RoundResponseDto } from '#application/dto/round_response_dto'

/**
 * RoundMapper
 * Maps Round domain entity to RoundResponseDto
 * Follows DDD mapping patterns between layers
 */
export class RoundMapper {
  /**
   * Maps Round entity to RoundResponseDto
   * @param round - Domain Round entity
   * @param game - Parent Game entity for context
   * @param canModify - Whether user can modify this round
   */
  static toDto(round: Round, game: Game, canModify: boolean = false): RoundResponseDto {
    // Calculate winner based on current scores, even if not completed
    const winner = this.determineCurrentWinner(round.playerScore, round.opponentScore)

    return {
      id: round.id.value.toString(),
      gameId: round.gameId.value.toString(),
      roundNumber: round.roundNumber.value,
      playerScore: round.playerScore,
      opponentScore: round.opponentScore,
      isCompleted: round.isCompleted,
      winner: round.isCompleted ? round.getWinner() : winner,
      canModify: canModify && !round.isCompleted && game.isInProgress(),
      createdAt: round.createdAt,
      completedAt: round.isCompleted ? round.createdAt : undefined, // Simplified - using createdAt as proxy
    }
  }

  /**
   * Determine winner based on current scores (for display purposes)
   */
  private static determineCurrentWinner(
    playerScore: number,
    opponentScore: number
  ): 'PLAYER' | 'OPPONENT' | 'DRAW' | null {
    if (playerScore === 0 && opponentScore === 0) {
      return null // No scores yet
    }

    if (playerScore > opponentScore) {
      return 'PLAYER'
    } else if (opponentScore > playerScore) {
      return 'OPPONENT'
    } else {
      return 'DRAW'
    }
  }

  /**
   * Maps array of Round entities to RoundResponseDto array
   * @param rounds - Array of Round entities
   * @param game - Parent Game entity
   * @param canModify - Whether user can modify rounds
   */
  static toDtoArray(rounds: Round[], game: Game, canModify: boolean = false): RoundResponseDto[] {
    return rounds
      .map((round) => this.toDto(round, game, canModify))
      .sort((a, b) => a.roundNumber - b.roundNumber) // Ensure proper ordering
  }
}
