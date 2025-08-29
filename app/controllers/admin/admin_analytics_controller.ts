import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsService from '#application/services/analytics_service'
import { inject } from '@adonisjs/core'

@inject()
export default class AdminAnalyticsController {
  constructor(protected analyticsService: AnalyticsService) {}

  /**
   * Affiche la page principale des analytics admin
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Récupération des métriques principales
    const [platformMetrics, gameInsights, periodComparison] = await Promise.all([
      this.analyticsService.getPlatformMetrics(),
      this.analyticsService.getGameInsights(),
      this.analyticsService.getPeriodComparison()
    ])

    const breadcrumbItems = [
      { label: 'Administration', href: '/admin' },
      { label: 'Analytics' }
    ]

    return inertia.render('admin/analytics/Index', {
      user,
      platformMetrics,
      gameInsights,
      periodComparison,
      breadcrumbItems,
      title: 'Analytics - Administration'
    })
  }

  /**
   * API endpoint pour les métriques de plateforme
   */
  async platformMetrics({ response }: HttpContext) {
    try {
      const metrics = await this.analyticsService.getPlatformMetrics()
      return response.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Failed to load platform metrics'
      })
    }
  }

  /**
   * API endpoint pour les insights de jeux
   */
  async gameInsights({ response }: HttpContext) {
    try {
      const insights = await this.analyticsService.getGameInsights()
      return response.json({
        success: true,
        data: insights
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Failed to load game insights'
      })
    }
  }

  /**
   * API endpoint pour les statistiques d'un joueur spécifique
   */
  async playerStats({ params, request, response }: HttpContext) {
    try {
      const userId = Number(params.userId)
      const period = request.input('period', 'all') as 'week' | 'month' | 'all'

      const stats = await this.analyticsService.getPlayerStats(userId, period)
      return response.json({
        success: true,
        data: stats
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Failed to load player statistics'
      })
    }
  }

  /**
   * API endpoint pour la comparaison de périodes
   */
  async periodComparison({ response }: HttpContext) {
    try {
      const comparison = await this.analyticsService.getPeriodComparison()
      return response.json({
        success: true,
        data: comparison
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Failed to load period comparison'
      })
    }
  }

  /**
   * Page détaillée des analytics joueurs
   */
  async players({ inertia, auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const period = request.input('period', 'all') as 'week' | 'month' | 'all'

    // Note: Cette méthode pourrait être étendue pour afficher tous les joueurs
    // Pour l'instant, on se concentre sur les métriques générales

    const breadcrumbItems = [
      { label: 'Administration', href: '/admin' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Joueurs' }
    ]

    return inertia.render('admin/analytics/Players', {
      user,
      period,
      breadcrumbItems,
      title: 'Analytics Joueurs - Administration'
    })
  }

  /**
   * Page détaillée des analytics de jeux
   */
  async games({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const gameInsights = await this.analyticsService.getGameInsights()

    const breadcrumbItems = [
      { label: 'Administration', href: '/admin' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Parties' }
    ]

    return inertia.render('admin/analytics/Games', {
      user,
      gameInsights,
      breadcrumbItems,
      title: 'Analytics Parties - Administration'
    })
  }

  /**
   * Page des métriques de plateforme
   */
  async platform({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const [platformMetrics, periodComparison] = await Promise.all([
      this.analyticsService.getPlatformMetrics(),
      this.analyticsService.getPeriodComparison()
    ])

    const breadcrumbItems = [
      { label: 'Administration', href: '/admin' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Plateforme' }
    ]

    return inertia.render('admin/analytics/Platform', {
      user,
      platformMetrics,
      periodComparison,
      breadcrumbItems,
      title: 'Analytics Plateforme - Administration'
    })
  }
}