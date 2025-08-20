/**
 * DTO pour la mise à jour du score d'un round
 * 
 * Utilisé par l'API endpoint PUT /parties/:gameId/rounds/:roundId/score
 */
export interface UpdateRoundScoreDto {
  /**
   * ID de la partie
   */
  gameId: number

  /**
   * ID du round à mettre à jour
   */
  roundId: number

  /**
   * ID du joueur qui fait la modification
   */
  playerId: number

  /**
   * Nouveau score (0-50 pour les scores primaires)
   */
  score: number
}

/**
 * DTO de réponse après mise à jour d'un score
 */
export interface UpdateRoundScoreResponseDto {
  success: true
  round: {
    id: number
    roundNumber: number
    playerScore: number
    opponentScore: number
    isCompleted: boolean
    gameId: number
  }
}