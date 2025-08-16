import {
  GameDetailSummary,
  PlayerSummary,
  RoundSummary,
  ScoreSummary,
} from '#domain/value-objects/game_detail_summary'
import GameId from '#domain/value-objects/game_id'
import { GameQueryRepository } from '#domain/repositories/i_game_query_repository'
import { PlayerQueryRepository } from '#domain/repositories/player_query_repository'
import { RoundQueryRepository } from '#domain/repositories/round_query_repository'
import { ScoreQueryRepository } from '#domain/repositories/score_query_repository'

/**
 * GameDetailService - Application Service
 *
 * Service d'application dédié à la récupération et présentation
 * des détails complets d'une partie selon les principes CQRS.
 *
 * Orchestre les requêtes cross-aggregate pour construire une vue
 * cohérente de toutes les données d'une partie.
 */
export class GameDetailService {
  constructor(
    private readonly gameQueryRepository: GameQueryRepository,
    private readonly playerQueryRepository: PlayerQueryRepository,
    private readonly roundQueryRepository: RoundQueryRepository,
    private readonly scoreQueryRepository: ScoreQueryRepository
  ) {}

  /**
   * Récupère le détail complet d'une partie
   *
   * @param gameId - Identifiant de la partie
   * @param userId - ID de l'utilisateur demandeur (pour les contrôles d'accès)
   * @returns GameDetailSummary complet ou null si non trouvé
   *
   * @throws Error si l'utilisateur n'a pas accès à cette partie
   */
  async getGameDetail(gameId: GameId, userId: number): Promise<GameDetailSummary | null> {
    // 1. Récupérer la partie
    const game = await this.gameQueryRepository.findById(gameId)
    if (!game) {
      return null
    }

    // 2. Vérifier les droits d'accès
    this.validateUserAccess(game.userId, userId)

    // 3. Récupérer toutes les données associées en parallèle
    const [players, rounds, allScores] = await Promise.all([
      this.playerQueryRepository.findByGameId(gameId),
      this.roundQueryRepository.findByGameId(gameId),
      this.getScoresForGame(gameId),
    ])

    // 4. Mapper vers les structures de summary
    const playerSummaries: PlayerSummary[] = players.map((player) => ({
      id: player.id.value,
      gameId: player.gameId.value,
      userId: player.userId,
      pseudo: player.pseudo.value,
      isGuest: player.isGuest,
      createdAt: player.createdAt,
    }))

    const roundSummaries: RoundSummary[] = rounds.map((round) => ({
      id: round.id.value,
      gameId: round.gameId.value,
      roundNumber: round.roundNumber.value,
      playerScore: round.playerScore,
      opponentScore: round.opponentScore,
      isCompleted: round.isCompleted,
      createdAt: round.createdAt,
    }))

    // 5. Filtrer les scores secondaires uniquement
    const secondaryScores: ScoreSummary[] = allScores
      .filter((score) => score.scoreType.value === 'SECONDARY')
      .map((score) => ({
        id: Number(score.id.value),
        roundId: score.roundId.value,
        playerId: score.playerId.value,
        scoreType: score.scoreType.value,
        scoreName: score.scoreName.value,
        scoreValue: score.scoreValue.value,
        createdAt: score.createdAt,
      }))

    // 6. Construire et retourner le summary complet
    return new GameDetailSummary(
      game.id.value,
      game.userId,
      game.gameType.value,
      game.pointsLimit.value,
      game.status.value,
      game.opponentId,
      game.playerScore,
      game.opponentScore,
      game.mission,
      game.deployment,
      game.primaryScoringMethod,
      game.notes,
      game.createdAt,
      game.startedAt,
      game.completedAt,
      playerSummaries,
      roundSummaries,
      secondaryScores
    )
  }

  /**
   * Vérifie si l'utilisateur peut accéder à la partie
   *
   * @param gameUserId - ID du propriétaire de la partie
   * @param requestUserId - ID de l'utilisateur demandeur
   * @throws Error si l'accès est refusé
   */
  private validateUserAccess(gameUserId: number, requestUserId: number): void {
    if (gameUserId !== requestUserId) {
      throw new Error('Unauthorized access to this game')
    }
  }

  /**
   * Récupère tous les scores d'une partie
   *
   * @param gameId - Identifiant de la partie
   * @returns Array de tous les scores de la partie
   */
  private async getScoresForGame(gameId: GameId) {
    const rounds = await this.roundQueryRepository.findByGameId(gameId)
    const allScores = []

    for (const round of rounds) {
      const roundScores = await this.scoreQueryRepository.findByRoundId(round.id)
      allScores.push(...roundScores)
    }

    return allScores
  }

  /**
   * Vérifie si une partie existe et est accessible
   *
   * @param gameId - Identifiant de la partie
   * @param userId - ID de l'utilisateur
   * @returns true si la partie existe et est accessible
   */
  async isGameAccessible(gameId: GameId, userId: number): Promise<boolean> {
    try {
      const summary = await this.getGameDetail(gameId, userId)
      return summary !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Récupère les statistiques rapides d'une partie
   *
   * @param gameId - Identifiant de la partie
   * @param userId - ID de l'utilisateur
   * @returns Statistiques de base pour l'affichage
   */
  async getGameStats(
    gameId: GameId,
    userId: number
  ): Promise<{
    totalRounds: number
    completedRounds: number
    totalSecondaryScores: number
    gameStatus: string
  } | null> {
    const summary = await this.getGameDetail(gameId, userId)
    if (!summary) {
      return null
    }

    return {
      totalRounds: summary.rounds.length,
      completedRounds: summary.rounds.filter((r) => r.isCompleted).length,
      totalSecondaryScores: summary.secondaryScores.length,
      gameStatus: summary.status,
    }
  }
}
