import { trace, metrics, SpanKind, SpanStatusCode } from '@opentelemetry/api'
import logger from '@adonisjs/core/services/logger'

/**
 * TelemetryService - Service centralisé pour instrumentation manuelle W40K
 * 
 * 🎯 ARCHITECTURE HEXAGONALE - Infrastructure Layer
 * Fournit les primitives d'instrumentation pour tous les services :
 * - Application Layer (GameService, ScoreService, etc.)
 * - Domain Layer (Operations métier complexes)
 * - Infrastructure Layer (Repository operations)
 * 
 * 📊 FEATURES :
 * - Custom spans avec attributs business W40K
 * - Métriques custom (compteurs, histogrammes, gauges)
 * - Error tracking avec attribution contextuelle
 * - Performance monitoring avec seuils business
 */
export class TelemetryService {
  private tracer = trace.getTracer('w40k-scoring-business')
  private meter = metrics.getMeter('w40k-scoring-metrics')
  
  // Métriques business W40K
  private gameCreatedCounter = this.meter.createCounter('w40k_games_created_total', {
    description: 'Total number of games created by type',
  })
  
  private gameCompletedCounter = this.meter.createCounter('w40k_games_completed_total', {
    description: 'Total number of games completed by type',
  })
  
  private scoreUpdatedCounter = this.meter.createCounter('w40k_scores_updated_total', {
    description: 'Total number of score updates by type',
  })
  
  private userActiveGauge = this.meter.createUpDownCounter('w40k_active_users', {
    description: 'Number of currently active users',
  })
  
  private operationDuration = this.meter.createHistogram('w40k_operation_duration_seconds', {
    description: 'Duration of business operations',
    boundaries: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // En secondes
  })
  
  private cacheHitRatio = this.meter.createHistogram('w40k_cache_hit_ratio', {
    description: 'Cache hit ratio by cache type',
    boundaries: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  })

  /**
   * Execute une opération avec instrumentation complète
   */
  async executeWithTelemetry<T>(
    operation: string,
    fn: () => Promise<T>,
    attributes: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    const startTime = Date.now()
    
    const span = this.tracer.startSpan(operation, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'w40k.operation': operation,
        'w40k.service': 'business-layer',
        ...attributes,
      },
    })

    try {
      const result = await fn()
      
      const duration = (Date.now() - startTime) / 1000 // en secondes
      
      span.setAttributes({
        'w40k.operation.success': true,
        'w40k.operation.duration_ms': Date.now() - startTime,
      })
      
      // Enregistrer la métrique de durée
      this.operationDuration.record(duration, attributes)
      
      // Log pour operations lentes (> 2s)
      if (duration > 2) {
        logger.warn('🐌 Slow business operation detected', {
          operation,
          duration_seconds: duration,
          attributes,
        })
      }
      
      return result
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      
      span.setAttributes({
        'w40k.operation.success': false,
        'w40k.error.type': error.constructor.name,
        'w40k.error.message': error.message,
      })
      
      logger.error('❌ Business operation failed', {
        operation,
        duration_ms: Date.now() - startTime,
        error_type: error.constructor.name,
        error_message: error.message,
        attributes,
      })
      
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Track la création d'une partie
   */
  trackGameCreated(gameType: string, userId: number, attributes: Record<string, any> = {}) {
    this.gameCreatedCounter.add(1, {
      game_type: gameType,
      user_id: userId.toString(),
      ...attributes,
    })
    
    logger.info('🎮 Game created', {
      game_type: gameType,
      user_id: userId,
      action: 'game_created',
      ...attributes,
    })
  }

  /**
   * Track la completion d'une partie
   */
  trackGameCompleted(gameType: string, userId: number, duration_minutes: number, winner?: string) {
    this.gameCompletedCounter.add(1, {
      game_type: gameType,
      user_id: userId.toString(),
      winner: winner || 'draw',
    })
    
    logger.info('🏆 Game completed', {
      game_type: gameType,
      user_id: userId,
      duration_minutes,
      winner,
      action: 'game_completed',
    })
  }

  /**
   * Track les updates de scores
   */
  trackScoreUpdated(scoreType: string, gameType: string, userId: number, value: number) {
    this.scoreUpdatedCounter.add(1, {
      score_type: scoreType,
      game_type: gameType,
      user_id: userId.toString(),
    })
    
    // Métriques spéciales pour scores très élevés ou inhabituels
    if (value > 30) {
      logger.info('📊 High score recorded', {
        score_type: scoreType,
        score_value: value,
        game_type: gameType,
        user_id: userId,
        action: 'high_score',
      })
    }
  }

  /**
   * Track l'activité utilisateur (login/logout)
   */
  trackUserActivity(action: 'login' | 'logout', userId: number) {
    if (action === 'login') {
      this.userActiveGauge.add(1, { user_id: userId.toString() })
    } else {
      this.userActiveGauge.add(-1, { user_id: userId.toString() })
    }
    
    logger.info('👤 User activity', {
      user_id: userId,
      action: `user_${action}`,
    })
  }

  /**
   * Track les performances du cache (depuis Phase 2)
   */
  trackCachePerformance(cacheType: string, operation: 'hit' | 'miss', key?: string) {
    const hitRatio = operation === 'hit' ? 1.0 : 0.0
    
    this.cacheHitRatio.record(hitRatio, {
      cache_type: cacheType,
      operation,
    })
    
    // Log cache misses pour debug
    if (operation === 'miss') {
      logger.debug('💾 Cache miss', {
        cache_type: cacheType,
        cache_key: key,
        action: 'cache_miss',
      })
    }
  }

  /**
   * Crée un span enfant pour une opération spécifique
   */
  createSpan(operation: string, attributes: Record<string, string | number | boolean> = {}) {
    return this.tracer.startSpan(operation, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'w40k.operation': operation,
        'w40k.service': 'business-layer',
        ...attributes,
      },
    })
  }

  /**
   * Execute une opération avec span custom (pour usage avancé)
   */
  async withSpan<T>(
    operation: string,
    fn: (span: any) => Promise<T>,
    attributes: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    const span = this.createSpan(operation, attributes)
    
    try {
      const result = await fn(span)
      span.setAttributes({ 'w40k.operation.success': true })
      return result
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Helper pour les Repository operations
   */
  async trackRepositoryOperation<T>(
    repository: string,
    operation: string,
    fn: () => Promise<T>,
    entityId?: string | number
  ): Promise<T> {
    return this.executeWithTelemetry(
      `${repository}.${operation}`,
      fn,
      {
        'w40k.repository': repository,
        'w40k.operation.type': 'repository',
        'w40k.entity.id': entityId?.toString() || 'unknown',
      }
    )
  }

  /**
   * Helper pour les Service operations
   */
  async trackServiceOperation<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    userId?: number,
    gameId?: string
  ): Promise<T> {
    return this.executeWithTelemetry(
      `${service}.${operation}`,
      fn,
      {
        'w40k.service.name': service,
        'w40k.operation.type': 'service',
        'w40k.user.id': userId?.toString() || 'anonymous',
        'w40k.game.id': gameId || 'unknown',
      }
    )
  }
}