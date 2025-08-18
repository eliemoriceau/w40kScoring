/**
 * GameDetailSummary - Value Object
 *
 * Encapsule toutes les données nécessaires pour afficher
 * une page de détail de partie complète avec joueurs, rounds et scores
 */
export class GameDetailSummary {
  constructor(
    public readonly gameId: number,
    public readonly userId: number,
    public readonly gameType: string,
    public readonly pointsLimit: number,
    public readonly status: string,
    public readonly opponentId: number | null,
    public readonly playerScore: number | null,
    public readonly opponentScore: number | null,
    public readonly mission: string | null,
    public readonly deployment: string | null,
    public readonly primaryScoringMethod: string | null,
    public readonly notes: string,
    public readonly createdAt: Date,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly players: PlayerSummary[],
    public readonly rounds: RoundSummary[],
    public readonly secondaryScores: ScoreSummary[]
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.gameId || this.gameId <= 0) {
      throw new Error('Game ID must be a positive number')
    }

    if (!this.userId || this.userId <= 0) {
      throw new Error('User ID must be a positive number')
    }

    if (this.players.length === 0) {
      throw new Error('Game must have at least one player')
    }

    if (this.players.length > 2) {
      throw new Error('Game cannot have more than 2 players')
    }
  }

  /**
   * Obtient le joueur principal (propriétaire de la partie)
   */
  getMainPlayer(): PlayerSummary | null {
    return this.players.find((p) => p.userId === this.userId) || null
  }

  /**
   * Obtient le joueur adversaire
   */
  getOpponentPlayer(): PlayerSummary | null {
    return this.players.find((p) => p.userId !== this.userId) || null
  }

  /**
   * Calcule le score total pour un joueur donné
   */
  getTotalScoreForPlayer(playerId: number): number {
    return this.rounds
      .filter((round) => round.isCompleted)
      .reduce((total, round) => {
        const playerInRound = this.getMainPlayer()?.id === playerId
        return total + (playerInRound ? round.playerScore : round.opponentScore)
      }, 0)
  }

  /**
   * Obtient les scores secondaires pour un joueur
   */
  getSecondaryScoresForPlayer(playerId: number): ScoreSummary[] {
    return this.secondaryScores.filter((score) => score.playerId === playerId)
  }

  /**
   * Détermine le gagnant de la partie
   */
  getWinner(): 'PLAYER' | 'OPPONENT' | 'DRAW' | null {
    if (this.status !== 'COMPLETED' || this.playerScore === null || this.opponentScore === null) {
      return null
    }

    if (this.playerScore > this.opponentScore) {
      return 'PLAYER'
    } else if (this.opponentScore > this.playerScore) {
      return 'OPPONENT'
    } else {
      return 'DRAW'
    }
  }

  /**
   * Vérifie si la partie peut être modifiée
   */
  isEditable(): boolean {
    return this.status === 'PLANNED' || this.status === 'IN_PROGRESS'
  }
}

/**
 * PlayerSummary - Données du joueur pour l'affichage
 */
export interface PlayerSummary {
  id: number
  gameId: number
  userId: number | null
  pseudo: string
  isGuest: boolean
  createdAt: Date
}

/**
 * RoundSummary - Données du round pour l'affichage
 */
export interface RoundSummary {
  id: number
  gameId: number
  roundNumber: number
  playerScore: number
  opponentScore: number
  isCompleted: boolean
  createdAt: Date
}

/**
 * ScoreSummary - Données des scores détaillés pour l'affichage
 */
export interface ScoreSummary {
  id: number
  roundId: number
  playerId: number
  scoreType: string
  scoreName: string
  scoreValue: number
  createdAt: Date
}
