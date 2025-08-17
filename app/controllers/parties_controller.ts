import type { HttpContext } from '@adonisjs/core/http'
import GameService from '#application/services/game_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import LucidScoreRepository from '#infrastructure/repositories/lucid_score_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import { partiesListValidator } from '#validators/parties_list_validator'
import PartiePolicy from '#policies/partie_policy'

/**
 * PartiesController
 *
 * Contrôleur pour la gestion de la liste des parties utilisateur.
 * Utilise les patterns AdonisJS v6 + Inertia pour l'interface utilisateur.
 *
 * Architecture hexagonale : Interface Layer → Application Layer (GameService)
 */
export default class PartiesController {
  private gameService: GameService

  constructor() {
    // Instanciation manuelle des dépendances (workaround IoC)
    const gameRepository = new LucidGameRepository()
    const playerRepository = new LucidPlayerRepository()
    const roundRepository = new LucidRoundRepository()
    const scoreRepository = new LucidScoreRepository()
    const idGenerator = new UuidV7IdGenerator()

    // Services pour les commandes (CQRS)
    this.gameService = new GameService(
      gameRepository,
      playerRepository,
      roundRepository,
      scoreRepository,
      idGenerator
    )
  }

  /**
   * Affiche la liste des parties de l'utilisateur connecté
   *
   * GET /parties
   *
   * @param request - Requête HTTP avec paramètres de filtrage
   * @param inertia - Service Inertia pour rendu Vue
   * @param auth - Service d'authentification
   */
  async index({ request, inertia, auth }: HttpContext) {
    // 1. Authentification requise
    const user = auth.getUserOrFail()

    // 2. Validation des paramètres de requête
    const queryParams = await request.validateUsing(partiesListValidator)

    // 3. Construction du DTO de filtrage
    const filters: PartieFilterDto = {
      userId: user.id,
      status: queryParams.status ? [queryParams.status] : undefined,
      gameType: queryParams.gameType,
      limit: queryParams.limit ?? 20,
      cursor: queryParams.cursor,
    }

    // 4. Appel au service métier (Application Layer)
    const partiesData = await this.gameService.listParties(filters)

    // 5. Rendu Inertia avec données pour Vue
    return inertia.render('parties/index', {
      parties: partiesData,
      filters: {
        current: {
          status: filters.status,
          gameType: filters.gameType,
        },
        available: {
          statuses: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          gameTypes: ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY'],
        },
      },
      user: {
        id: user.id,
        fullName: user.fullName,
      },
    })
  }

  /**
   * Endpoint pour rafraîchissement AJAX/Fetch
   * Retourne uniquement les données JSON sans rendu de page
   *
   * GET /parties/data
   */
  async data({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const queryParams = await request.validateUsing(partiesListValidator)

    const filters: PartieFilterDto = {
      userId: user.id,
      status: queryParams.status ? [queryParams.status] : undefined,
      gameType: queryParams.gameType,
      limit: queryParams.limit ?? 20,
      cursor: queryParams.cursor,
    }

    const partiesData = await this.gameService.listParties(filters)

    return response.json({
      parties: partiesData,
      success: true,
    })
  }

  /**
   * Affiche le détail complet d'une partie
   *
   * GET /parties/:id
   *
   * @param params - Paramètres de route avec l'ID de la partie
   * @param inertia - Service Inertia pour rendu Vue
   * @param auth - Service d'authentification
   * @param response - Response HTTP pour gestion d'erreurs
   */
  async show({ params, inertia, auth, bouncer, response }: HttpContext) {
    try {
      // 1. Authentification requise
      const user = auth.getUserOrFail()

      // 2. Validation de l'ID
      const gameId = Number(params.id)
      if (!gameId || Number.isNaN(gameId) || gameId <= 0) {
        return response.status(400).json({
          error: 'Invalid game ID',
          message: "L'identifiant de la partie doit être un nombre valide",
        })
      }

      // 3. Récupération directe via modèles Lucid
      const db = await import('@adonisjs/lucid/services/db')

      const game = await db.default.from('games').where('id', gameId).first()
      if (!game) {
        return response.status(404).json({
          error: 'Game not found',
          message: "Cette partie n'existe pas",
        })
      }

      // 4. Vérification d'autorisation avec Policy AdonisJS
      if (await bouncer.with(PartiePolicy).denies('view', game.user_id)) {
        return response.status(403).json({
          error: 'Forbidden',
          message: "Vous n'avez pas accès à cette partie",
        })
      }

      // 5. Rendu Inertia avec données basiques (pour tester)
      return inertia.render('parties/show', {
        game: {
          id: game.id,
          userId: game.user_id,
          gameType: game.game_type,
          pointsLimit: game.points_limit,
          status: game.status,
          opponentId: game.opponent_id,
          playerScore: game.player_score,
          opponentScore: game.opponent_score,
          mission: game.mission,
          deployment: game.deployment,
          primaryScoringMethod: game.primary_scoring_method,
          notes: game.notes,
          createdAt: game.created_at,
          startedAt: game.started_at,
          completedAt: game.completed_at,
          winner: null,
          isEditable: game.status === 'PLANNED' || game.status === 'IN_PROGRESS',
        },
        players: [], // Vide pour test
        rounds: [], // Vide pour test
        secondaryScores: [], // Vide pour test
        stats: { totalRounds: 0, completedRounds: 0 }, // Basique pour test
        user: {
          id: user.id,
          fullName: user.fullName || user.username,
        },
        meta: {
          title: `Partie ${game.id} - ${game.game_type}`,
          canEdit: game.status === 'PLANNED' || game.status === 'IN_PROGRESS',
          gameTypeLabel: this.getGameTypeLabel(game.game_type),
          statusLabel: this.getStatusLabel(game.status),
        },
      })
    } catch (error) {
      // Erreur générique - ne pas exposer les détails internes
      return response.status(500).json({
        error: 'Internal error',
        message: 'Une erreur est survenue lors de la récupération de la partie',
      })
    }
  }

  /**
   * Helper pour formater les types de jeu
   */
  private getGameTypeLabel(gameType: string): string {
    const labels = {
      MATCHED_PLAY: 'Jeu Équilibré',
      NARRATIVE: 'Narratif',
      OPEN_PLAY: 'Jeu Libre',
    }
    return labels[gameType as keyof typeof labels] || gameType
  }

  /**
   * Helper pour formater les statuts
   */
  private getStatusLabel(status: string): string {
    const labels = {
      PLANNED: 'Planifiée',
      IN_PROGRESS: 'En Cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    }
    return labels[status as keyof typeof labels] || status
  }
}
