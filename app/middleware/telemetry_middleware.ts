import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { trace, context, propagation, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import logger from '@adonisjs/core/services/logger'

/**
 * TelemetryMiddleware - Corrélation traces et enrichissement contextuel
 *
 * 🎯 ARCHITECTURE HEXAGONALE - Interface Layer
 * Enrichit les traces HTTP avec le contexte métier W40K Scoring :
 * - User identification et correlation
 * - Business context (gameId, roundId depuis routes)
 * - Performance timing et error attribution
 * - Structured logging avec trace correlation
 *
 * 📊 SPANS CONTEXTUELS :
 * - http.request : Span parent pour toute la requête
 * - w40k.operation : Span métier selon la route
 * - w40k.user.context : Attribution utilisateur
 *
 * 🔍 LOG CORRELATION :
 * - Inject traceId/spanId dans tous les logs du request
 * - Structured fields pour Grafana/Loki queries
 */
export default class TelemetryMiddleware {
  /**
   * Handle HTTP request avec instrumentation OpenTelemetry
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const tracer = trace.getTracer('w40k-scoring-middleware')

    // 1. Extraire le contexte de trace des headers HTTP (W3C Trace Context)
    const parentContext = propagation.extract(context.active(), ctx.request.headers())

    // 2. Créer le span parent pour toute la requête
    const span = tracer.startSpan(
      `${ctx.request.method()} ${this.normalizeRoute(ctx.route?.pattern || ctx.request.url())}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          // Attributs HTTP standard OpenTelemetry
          'http.method': ctx.request.method(),
          'http.url': ctx.request.completeUrl(),
          'http.route': ctx.route?.pattern || 'unknown',
          'http.scheme': ctx.request.protocol(),
          'http.user_agent': ctx.request.header('user-agent') || 'unknown',

          // Attributs W40K Scoring spécifiques
          'w40k.service': 'web-interface',
          'w40k.request.type': this.categorizeRoute(ctx.route?.pattern),
          'w40k.session.id': ctx.session?.sessionId || 'anonymous',
        },
      },
      parentContext
    )

    // 3. Injecter le contexte de trace dans le request pour usage downstream
    context.with(trace.setSpan(parentContext, span), () => {
      // 4. Enrichir le span avec le contexte utilisateur
      this.enrichSpanWithUserContext(span, ctx)

      // 5. Enrichir le span avec le contexte métier (IDs de la route)
      this.enrichSpanWithBusinessContext(span, ctx)

      // 6. Configurer la corrélation des logs
      this.setupLogCorrelation(span, ctx)
    })

    const startTime = Date.now()

    try {
      // 7. Exécuter la chaîne middleware avec contexte actif
      await context.with(trace.setSpan(parentContext, span), async () => {
        await next()
      })

      // 8. Request réussie - enrichir les métriques de succès
      const duration = Date.now() - startTime
      span.setAttributes({
        'http.status_code': ctx.response.getStatus(),
        'http.response.size': ctx.response.getHeader('content-length') || 0,
        'w40k.request.duration_ms': duration,
        'w40k.request.success': true,
      })

      // Logger les requêtes lentes (> 1s)
      if (duration > 1000) {
        logger.warn('🐌 Slow request detected', {
          method: ctx.request.method(),
          url: ctx.request.url(),
          duration_ms: duration,
          user_id: ctx.auth?.user?.id,
        })
      }
    } catch (error) {
      // 9. Request échouée - attribution d'erreur et logging
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })

      const duration = Date.now() - startTime
      span.setAttributes({
        'http.status_code': ctx.response.getStatus() || 500,
        'w40k.request.duration_ms': duration,
        'w40k.request.success': false,
        'w40k.error.type': error.constructor.name,
        'w40k.error.message': error.message,
      })

      // Log structuré avec corrélation pour debugging
      logger.error('❌ Request failed with exception', {
        method: ctx.request.method(),
        url: ctx.request.url(),
        duration_ms: duration,
        user_id: ctx.auth?.user?.id,
        error_type: error.constructor.name,
        error_message: error.message,
        stack: error.stack,
      })

      throw error
    } finally {
      // 10. Finaliser le span
      span.end()
    }
  }

  /**
   * Enrichit le span avec le contexte utilisateur authentifié
   */
  private enrichSpanWithUserContext(span: any, ctx: HttpContext) {
    if (ctx.auth?.isAuthenticated) {
      const user = ctx.auth.user
      span.setAttributes({
        'w40k.user.id': user?.id || 'anonymous',
        'w40k.user.authenticated': true,
        'w40k.user.role': user?.role || 'user', // Si vous avez un système de rôles
      })
    } else {
      span.setAttributes({
        'w40k.user.id': 'anonymous',
        'w40k.user.authenticated': false,
      })
    }
  }

  /**
   * Enrichit le span avec le contexte métier W40K (IDs des entités)
   */
  private enrichSpanWithBusinessContext(span: any, ctx: HttpContext) {
    const params = ctx.params

    // IDs des entités métier W40K depuis les paramètres de route
    if (params.id) {
      // Route générique avec ID - peut être gameId, roundId, playerId, etc.
      span.setAttributes({
        'w40k.entity.id': params.id,
        'w40k.entity.type': this.inferEntityTypeFromRoute(ctx.route?.pattern),
      })
    }

    if (params.gameId) {
      span.setAttributes({
        'w40k.game.id': params.gameId,
      })
    }

    if (params.roundId) {
      span.setAttributes({
        'w40k.round.id': params.roundId,
      })
    }

    if (params.playerId) {
      span.setAttributes({
        'w40k.player.id': params.playerId,
      })
    }

    // Contexte depuis query parameters
    const queryParams = ctx.request.qs()
    if (queryParams.gameType) {
      span.setAttributes({
        'w40k.game.type': queryParams.gameType,
      })
    }
  }

  /**
   * Configure la corrélation des logs avec les traces
   */
  private setupLogCorrelation(span: any, ctx: HttpContext) {
    const spanContext = span.spanContext()

    // Ajouter les IDs de trace au contexte de la requête
    // Sera utilisé par le logger Pino via l'instrumentation
    ctx.request['traceId'] = spanContext.traceId
    ctx.request['spanId'] = spanContext.spanId

    // Injecter dans les headers de réponse pour debugging
    ctx.response.header('X-Trace-Id', spanContext.traceId)
  }

  /**
   * Normalise la route pour éviter la explosion de cardinalité des métriques
   */
  private normalizeRoute(pattern: string): string {
    // Remplacer les paramètres dynamiques par des placeholders
    return pattern
      .replace(/\/:\w+/g, '/{id}') // /parties/:id -> /parties/{id}
      .replace(/\/\d+/g, '/{id}') // /parties/123 -> /parties/{id}
  }

  /**
   * Catégorise la route pour les métriques business
   */
  private categorizeRoute(pattern?: string): string {
    if (!pattern) return 'unknown'

    if (pattern.includes('/parties')) {
      if (pattern.includes('/create')) return 'game_creation'
      if (pattern.includes('/show') || pattern.match(/\/parties\/:\w+$/)) return 'game_view'
      if (pattern.includes('/update')) return 'game_update'
      return 'game_management'
    }

    if (pattern.includes('/rounds')) {
      return 'round_management'
    }

    if (pattern.includes('/scores')) {
      return 'score_management'
    }

    if (pattern.includes('/auth')) {
      return 'authentication'
    }

    if (pattern.includes('/admin')) {
      return 'admin_panel'
    }

    return 'general'
  }

  /**
   * Infère le type d'entité depuis le pattern de route
   */
  private inferEntityTypeFromRoute(pattern?: string): string {
    if (!pattern) return 'unknown'

    if (pattern.includes('/parties')) return 'game'
    if (pattern.includes('/rounds')) return 'round'
    if (pattern.includes('/players')) return 'player'
    if (pattern.includes('/scores')) return 'score'
    if (pattern.includes('/users')) return 'user'

    return 'unknown'
  }
}
