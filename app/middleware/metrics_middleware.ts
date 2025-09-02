import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PerformanceMetricsService from '#services/performance_metrics_service'

/**
 * Middleware pour collecter automatiquement les métriques de performance HTTP
 */
export default class MetricsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Ne pas mesurer l'endpoint metrics lui-même pour éviter une boucle
    if (ctx.request.url().startsWith('/metrics')) {
      return await next()
    }

    const startTime = process.hrtime.bigint()

    // Incrémenter les connexions actives
    PerformanceMetricsService.incrementActiveConnections()

    try {
      await next()
    } finally {
      // Décrémenter les connexions actives
      PerformanceMetricsService.decrementActiveConnections()

      // Calculer la durée en secondes
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1e9

      // Enregistrer les métriques
      PerformanceMetricsService.recordHttpRequest(ctx, duration)
    }
  }
}
