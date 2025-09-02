import { HttpContext } from '@adonisjs/core/http'
import { promClient, globalRegistry } from '#start/metrics'

/**
 * Service pour collecter les métriques de performance HTTP
 */
export default class PerformanceMetricsService {
  // Métriques HTTP
  private static httpRequestsTotal = new promClient.Counter({
    name: 'w40k_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [globalRegistry],
  })

  private static httpRequestDuration = new promClient.Histogram({
    name: 'w40k_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [globalRegistry],
  })

  private static activeConnections = new promClient.Gauge({
    name: 'w40k_http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [globalRegistry],
  })

  // Métriques de base de données
  private static dbQueryDuration = new promClient.Histogram({
    name: 'w40k_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [globalRegistry],
  })

  private static dbConnectionsActive = new promClient.Gauge({
    name: 'w40k_db_connections_active',
    help: 'Number of active database connections',
    registers: [globalRegistry],
  })

  // Métriques applicatives
  private static gamesCreatedRate = new promClient.Counter({
    name: 'w40k_games_created_rate',
    help: 'Rate of games created',
    registers: [globalRegistry],
  })

  private static usersOnline = new promClient.Gauge({
    name: 'w40k_users_online',
    help: 'Number of users currently online',
    registers: [globalRegistry],
  })

  /**
   * Enregistrer une requête HTTP
   */
  static recordHttpRequest(ctx: HttpContext, duration: number) {
    const method = ctx.request.method()
    const route = ctx.route?.pattern || ctx.request.url() || 'unknown'
    const statusCode = ctx.response.getStatus?.() || (ctx.response as any).statusCode || 200

    this.httpRequestsTotal.labels({ method, route, status_code: statusCode.toString() }).inc()

    this.httpRequestDuration
      .labels({ method, route, status_code: statusCode.toString() })
      .observe(duration)
  }

  /**
   * Incrémenter les connexions actives
   */
  static incrementActiveConnections() {
    this.activeConnections.inc()
  }

  /**
   * Décrémenter les connexions actives
   */
  static decrementActiveConnections() {
    this.activeConnections.dec()
  }

  /**
   * Middleware pour mesurer les performances HTTP
   */
  static createMiddleware() {
    return async (ctx: HttpContext, next: Function) => {
      const startTime = Date.now()

      // Incrémenter les connexions actives
      this.activeConnections.inc()

      try {
        await next()
      } finally {
        // Décrémenter les connexions actives
        this.activeConnections.dec()

        // Enregistrer la durée
        const duration = (Date.now() - startTime) / 1000
        this.recordHttpRequest(ctx, duration)
      }
    }
  }

  /**
   * Enregistrer une requête de base de données
   */
  static recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration.labels({ operation, table }).observe(duration)
  }

  /**
   * Enregistrer la création d'une partie
   */
  static recordGameCreated() {
    this.gamesCreatedRate.inc()
  }

  /**
   * Mettre à jour le nombre d'utilisateurs en ligne
   */
  static setUsersOnline(count: number) {
    this.usersOnline.set(count)
  }

  /**
   * Mettre à jour les connexions DB actives
   */
  static setActiveDbConnections(count: number) {
    this.dbConnectionsActive.set(count)
  }

  /**
   * Récupérer toutes les métriques pour l'endpoint Prometheus
   */
  static getMetrics() {
    return {
      httpRequestsTotal: this.httpRequestsTotal,
      httpRequestDuration: this.httpRequestDuration,
      activeConnections: this.activeConnections,
      dbQueryDuration: this.dbQueryDuration,
      dbConnectionsActive: this.dbConnectionsActive,
      gamesCreatedRate: this.gamesCreatedRate,
      usersOnline: this.usersOnline,
    }
  }
}
