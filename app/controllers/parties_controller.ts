import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import GameService from '#application/services/game_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import LucidScoreRepository from '#infrastructure/repositories/lucid_score_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import { partiesListValidator } from '#validators/parties_list_validator'
import {
  gameCreationWizardValidator,
  userSearchValidator,
  GameCreationWizardValidationRules,
  type GameCreationWizardRequest,
} from '#validators/game_creation_wizard_validator'
import { WizardGameMapper } from '#application/mappers/wizard_game_mapper'
import User from '#models/user'
import { GameDetailService } from '#application/services/game_detail_service'
import LucidGameQueryRepository from '#infrastructure/repositories/lucid_game_query_repository'
import LucidPlayerQueryRepository from '#infrastructure/repositories/lucid_player_query_repository'
import LucidRoundQueryRepository from '#infrastructure/repositories/lucid_round_query_repository'
import LucidScoreQueryRepository from '#infrastructure/repositories/lucid_score_query_repository'
import GameId from '#domain/value-objects/game_id'

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
  private gameDetailService: GameDetailService

  constructor() {
    // Instanciation manuelle des dépendances (workaround IoC)
    const gameRepository = new LucidGameRepository()
    const playerRepository = new LucidPlayerRepository()
    const roundRepository = new LucidRoundRepository()
    const scoreRepository = new LucidScoreRepository()
    const idGenerator = new UuidV7IdGenerator()

    // Query repositories pour le GameDetailService
    const gameQueryRepository = new LucidGameQueryRepository()
    const playerQueryRepository = new LucidPlayerQueryRepository()
    const roundQueryRepository = new LucidRoundQueryRepository()
    const scoreQueryRepository = new LucidScoreQueryRepository()

    // Services pour les commandes (CQRS)
    this.gameService = new GameService(
      gameRepository,
      playerRepository,
      roundRepository,
      scoreRepository,
      idGenerator
    )

    // Service pour les requêtes de détail
    this.gameDetailService = new GameDetailService(
      gameQueryRepository,
      playerQueryRepository,
      roundQueryRepository,
      scoreQueryRepository
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
  async show({ params, inertia, auth, response }: HttpContext) {
    try {
      // 1. Authentification requise
      const user = auth.getUserOrFail()

      // 2. Validation de l'ID et création du value object
      const gameIdNumber = Number(params.id)
      if (!gameIdNumber || Number.isNaN(gameIdNumber) || gameIdNumber <= 0) {
        return response.status(400).json({
          error: 'Invalid game ID',
          message: "L'identifiant de la partie doit être un nombre valide",
        })
      }

      const gameId = new GameId(gameIdNumber)

      // 3. Récupération via le service application (pattern CQRS)
      const gameDetail = await this.gameDetailService.getGameDetail(gameId, user.id)

      if (!gameDetail) {
        return response.status(404).json({
          error: 'Game not found',
          message: "Cette partie n'existe pas",
        })
      }

      // 4. Rendu Inertia avec les données complètes
      return inertia.render('parties/show', {
        game: {
          id: gameDetail.gameId,
          userId: gameDetail.userId,
          gameType: gameDetail.gameType,
          pointsLimit: gameDetail.pointsLimit,
          status: gameDetail.status,
          opponentId: gameDetail.opponentId,
          playerScore: gameDetail.playerScore,
          opponentScore: gameDetail.opponentScore,
          mission: gameDetail.mission,
          deployment: gameDetail.deployment,
          primaryScoringMethod: gameDetail.primaryScoringMethod,
          notes: gameDetail.notes,
          createdAt: gameDetail.createdAt,
          startedAt: gameDetail.startedAt,
          completedAt: gameDetail.completedAt,
          winner: gameDetail.getWinner(),
          isEditable: gameDetail.isEditable(),
        },
        players: gameDetail.players,
        rounds: gameDetail.rounds,
        secondaryScores: gameDetail.getSecondaryScoresForPlayer(
          gameDetail.getMainPlayer()?.id || 0
        ),
        stats: {
          totalRounds: gameDetail.rounds.length,
          completedRounds: gameDetail.rounds.filter((r) => r.isCompleted).length,
        },
        user: {
          id: user.id,
          fullName: user.fullName || user.username,
        },
        meta: {
          title: `Partie ${gameDetail.gameId} - ${gameDetail.gameType}`,
          canEdit: gameDetail.isEditable(),
          gameTypeLabel: this.getGameTypeLabel(gameDetail.gameType),
          statusLabel: this.getStatusLabel(gameDetail.status),
        },
      })
    } catch (error) {
      logger.error('Game detail retrieval failed', {
        error: error.message,
        stack: error.stack,
        userId: auth.user?.id,
        gameId: params.id,
        action: 'game_detail_view',
      })

      // Distinguer les erreurs d'autorisation
      if (error.message.includes('access')) {
        return response.status(403).json({
          error: 'Forbidden',
          message: "Vous n'avez pas accès à cette partie",
        })
      }

      // Erreur générique
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

  /**
   * Affiche le wizard de création de partie
   *
   * GET /parties/create
   */
  async create({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // TODO: Récupérer la liste des amis de l'utilisateur
    const userFriends: Array<{ id: number; pseudo: string; avatar?: string }> = []

    // TODO: Récupérer la liste des missions disponibles
    const availableMissions = [
      { id: 1, name: 'Seize Ground', description: 'Contrôlez les objectifs' },
      { id: 2, name: 'Annihilation', description: 'Éliminez les unités ennemies' },
      { id: 3, name: 'Capture and Control', description: 'Maintenez votre position' },
    ]

    const gameTypes = [
      { value: 'MATCHED_PLAY' as const, displayName: 'Jeu Équilibré' },
      { value: 'NARRATIVE' as const, displayName: 'Narratif' },
      { value: 'OPEN_PLAY' as const, displayName: 'Jeu Libre' },
    ]

    return inertia.render('parties/create/index', {
      availableMissions,
      gameTypes,
      userFriends,
      currentUser: {
        id: user.id,
        pseudo: user.fullName || user.username,
        email: user.email,
      },
    })
  }

  /**
   * Traite la création de partie via le wizard
   *
   * POST /parties/create
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      // 1. Authentification requise
      const user = auth.getUserOrFail()

      // 2. Validation des données
      const wizardData = (await request.validateUsing(
        gameCreationWizardValidator
      )) as GameCreationWizardRequest

      // 3. Validation des règles métier spécifiques
      const businessErrors = GameCreationWizardValidationRules.validateComplete(wizardData)
      if (businessErrors.length > 0) {
        return response.status(422).json({
          error: 'Validation métier échouée',
          message: 'Les données ne respectent pas les règles métier',
          details: businessErrors,
        })
      }

      // 4. Validation de la cohérence des données
      WizardGameMapper.validateWizardData(wizardData)

      // 5. Conversion vers les données de service
      const completeGameData = WizardGameMapper.toCompleteGameData(wizardData, user.id)

      // 6. Création de la partie via le service
      const result = await this.gameService.createCompleteGame(completeGameData)

      // 7. Réponse de succès avec redirection
      return response.status(201).json({
        success: true,
        message: '⚔️ Bataille créée avec succès !',
        data: {
          gameId: result.game.id.value,
          status: result.game.status.value,
          gameType: result.game.gameType.value,
          pointsLimit: result.game.pointsLimit.value,
          playersCount: result.players.length,
          roundsCount: result.rounds.length,
          scoresCount: result.scores.length,
        },
        redirect: `/parties/${result.game.id.value}`,
        meta: WizardGameMapper.extractGameMetadata(wizardData),
      })
    } catch (error) {
      logger.error('Game creation failed', {
        error: error.message,
        stack: error.stack,
        userId: auth.user?.id,
        action: 'wizard_game_creation',
      })

      // Distinguer les erreurs de validation des erreurs système
      if (error.message.includes('Validation') || error.message.includes('Invalid')) {
        return response.status(422).json({
          error: 'Données invalides',
          message: error.message,
          details: [error.message],
        })
      }

      // Erreur système générique
      return response.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la création de la partie',
        details: ['Veuillez réessayer ou contacter le support'],
      })
    }
  }

  /**
   * API de recherche d'utilisateurs pour le wizard
   *
   * GET /api/users/search
   */
  async searchUsers({ request, response, auth }: HttpContext) {
    try {
      // 1. Authentification requise
      const user = auth.getUserOrFail()

      // 2. Validation des paramètres
      const { q, limit = 10 } = await request.validateUsing(userSearchValidator)

      // 3. Recherche d'utilisateurs en base de données
      const users = await User.query()
        .where('id', '!=', user.id) // Exclure l'utilisateur actuel
        .where((query) => {
          query
            .whereILike('username', `%${q}%`)
            .orWhereILike('fullName', `%${q}%`)
            .orWhereILike('email', `%${q}%`)
        })
        .select('id', 'username', 'fullName', 'email')
        .limit(Math.min(limit, 20)) // Limite max de sécurité
        .orderBy('username', 'asc')

      // 4. Formater la réponse pour le frontend
      const formattedUsers = users.map((foundUser) => ({
        id: foundUser.id,
        pseudo: foundUser.fullName || foundUser.username,
        email: foundUser.email,
        username: foundUser.username,
        avatar: null, // TODO: Implémenter les avatars
      }))

      return response.json({
        users: formattedUsers,
        query: q,
        limit,
        total: formattedUsers.length,
      })
    } catch (error) {
      logger.error('User search failed', {
        error: error.message,
        stack: error.stack,
        userId: auth.user?.id,
        query: request.input('q'),
        action: 'user_search',
      })

      return response.status(500).json({
        error: 'Erreur de recherche',
        message: "Une erreur est survenue lors de la recherche d'utilisateurs",
        users: [],
      })
    }
  }
}
