import Score from '#domain/entities/score'
import Game from '#domain/entities/game'
import {
  ScoreResponseDto,
  ScoreListResponseDto,
  PlayerTotalResponseDto,
} from '#application/dto/score_response_dto'

/**
 * ScoreMapper
 * Maps Score domain entity to response DTOs
 * Follows DDD mapping patterns between layers
 */
export class ScoreMapper {
  /**
   * Maps Score entity to ScoreResponseDto
   * @param score - Domain Score entity
   * @param game - Parent Game entity for authorization context
   * @param canModify - Whether user can modify this score
   */
  static toDto(score: Score, game: Game, canModify: boolean = false): ScoreResponseDto {
    return {
      id: score.id.value.toString(),
      roundId: score.roundId.value.toString(),
      playerId: score.playerId.value.toString(),
      scoreType: score.scoreType.value,
      scoreName: score.scoreName.value,
      scoreValue: score.scoreValue.value,
      canModify: canModify && game.isInProgress(), // Only modifiable if game in progress
      createdAt: score.createdAt,
    }
  }

  /**
   * Maps array of Score entities to ScoreResponseDto array
   * @param scores - Array of Score entities
   * @param game - Parent Game entity
   * @param canModify - Whether user can modify scores
   */
  static toDtoArray(scores: Score[], game: Game, canModify: boolean = false): ScoreResponseDto[] {
    return scores
      .map((score) => this.toDto(score, game, canModify))
      .sort((a, b) => {
        // Sort by score type priority, then by creation date
        const typeOrder = { PRIMARY: 1, SECONDARY: 2, CHALLENGER: 3 }
        const aOrder = typeOrder[a.scoreType as keyof typeof typeOrder] || 4
        const bOrder = typeOrder[b.scoreType as keyof typeof typeOrder] || 4

        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
  }

  /**
   * Maps scores to ScoreListResponseDto with pagination metadata
   * @param scores - Array of Score entities
   * @param game - Parent Game entity
   * @param canModify - Whether user can modify scores
   */
  static toListDto(scores: Score[], game: Game, canModify: boolean = false): ScoreListResponseDto {
    const scoresDto = this.toDtoArray(scores, game, canModify)

    return {
      scores: scoresDto,
      pagination: {
        total: scoresDto.length,
        hasMore: false, // All scores are returned, no pagination needed
      },
    }
  }

  /**
   * Calculate player total with breakdown by score type
   * @param scores - Array of Score entities for a player
   * @param playerId - Player ID
   * @param gameId - Game ID
   */
  static toPlayerTotalDto(
    scores: Score[],
    playerId: string,
    gameId: string
  ): PlayerTotalResponseDto {
    const breakdown = {
      primary: 0,
      secondary: 0,
      challenger: 0,
    }

    let totalScore = 0

    scores.forEach((score) => {
      const value = score.scoreValue.value
      totalScore += value

      switch (score.scoreType.value) {
        case 'PRIMARY':
          breakdown.primary += value
          break
        case 'SECONDARY':
          breakdown.secondary += value
          break
        case 'CHALLENGER':
          breakdown.challenger += value
          break
      }
    })

    return {
      playerId,
      gameId,
      totalScore,
      breakdown,
      scoreCount: scores.length,
    }
  }
}
