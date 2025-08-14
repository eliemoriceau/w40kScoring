import type { HttpContext } from '@adonisjs/core/http'
import GameService from '#application/services/game_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import { partiesListValidator } from '#validators/parties_list_validator'

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
    this.gameService = new GameService(gameRepository)
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
      status: queryParams.status,
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
      status: queryParams.status,
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
}