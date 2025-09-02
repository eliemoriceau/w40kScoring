import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { TelemetryService } from '#infrastructure/services/telemetry_service'

/**
 * TelemetryController - Endpoint pour réception des événements frontend
 * 
 * 🎯 ARCHITECTURE HEXAGONALE - Interface Layer
 * Reçoit les événements de télémétrie du frontend Vue3/Inertia :
 * - Web Vitals (LCP, FID, CLS, TTFB)
 * - Business events (game actions, user interactions)
 * - Error events (JavaScript errors, Promise rejections)
 * - Performance events (slow resources, long tasks)
 * 
 * 📊 PROCESSING :
 * - Forward vers OpenTelemetry Collector
 * - Log structuré avec corrélation
 * - Validation et sanitization des données
 */
export default class TelemetryController {
  private telemetryService = new TelemetryService()

  /**
   * Receive frontend telemetry events
   * POST /api/telemetry/events
   */
  async receiveEvents({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user
      const data = request.only(['events', 'web_vitals', 'session_id'])
      
      // Validation basique
      if (!data.events || !Array.isArray(data.events)) {
        return response.status(400).json({
          error: 'Invalid events format',
          message: 'Events must be an array',
        })
      }

      // Limite de sécurité : max 100 événements par batch
      const events = data.events.slice(0, 100)
      
      // Traitement des événements par type
      for (const event of events) {
        await this.processEvent(event, user?.id, data.session_id)
      }

      // Traitement des Web Vitals si présentes
      if (data.web_vitals && typeof data.web_vitals === 'object') {
        await this.processWebVitals(data.web_vitals, user?.id, data.session_id)
      }

      logger.info('📊 Frontend telemetry batch processed', {
        user_id: user?.id || 'anonymous',
        session_id: data.session_id,
        events_count: events.length,
        has_web_vitals: !!data.web_vitals,
        action: 'telemetry_batch_processed',
      })

      return response.status(200).json({
        success: true,
        processed: events.length,
      })
    } catch (error) {
      logger.error('❌ Failed to process telemetry events', {
        error: error.message,
        stack: error.stack,
        user_id: auth.user?.id || 'anonymous',
        action: 'telemetry_processing_failed',
      })

      return response.status(500).json({
        error: 'Processing failed',
        message: 'Unable to process telemetry events',
      })
    }
  }

  /**
   * Process individual frontend event
   */
  private async processEvent(event: any, userId?: number, sessionId?: string) {
    // Sanitize et valider l'événement
    const sanitizedEvent = this.sanitizeEvent(event)
    
    // Enrichir avec contexte serveur
    const enrichedEvent = {
      ...sanitizedEvent,
      server_timestamp: Date.now(),
      user_id: userId || 'anonymous',
      session_id: sessionId,
      source: 'frontend',
    }

    // Logger avec structure pour Loki
    const logLevel = this.getLogLevelForEvent(sanitizedEvent.type)
    logger[logLevel](`📱 Frontend event: ${sanitizedEvent.name}`, {
      event_name: sanitizedEvent.name,
      event_type: sanitizedEvent.type,
      user_id: userId || 'anonymous',
      session_id: sessionId,
      attributes: sanitizedEvent.attributes,
      action: `frontend_${sanitizedEvent.name}`,
      domain: this.getDomainFromEvent(sanitizedEvent),
    })

    // Traitement spécialisé selon le type d'événement
    await this.processSpecializedEvent(sanitizedEvent, userId, sessionId)
  }

  /**
   * Process Web Vitals metrics
   */
  private async processWebVitals(webVitals: any, userId?: number, sessionId?: string) {
    const validMetrics = this.sanitizeWebVitals(webVitals)
    
    // Track chaque métrique individuellement
    for (const [metric, value] of Object.entries(validMetrics)) {
      if (typeof value === 'number' && value > 0) {
        // Log la métrique
        logger.info(`🚀 Web Vital: ${metric}`, {
          metric_name: metric,
          metric_value: value,
          user_id: userId || 'anonymous',
          session_id: sessionId,
          action: `web_vital_${metric}`,
          domain: 'performance',
        })

        // Track comme métrique business selon seuils
        this.trackWebVitalThreshold(metric, value, userId)
      }
    }
  }

  /**
   * Process specialized events (business, errors, etc.)
   */
  private async processSpecializedEvent(event: any, userId?: number, sessionId?: string) {
    switch (event.type) {
      case 'business':
        await this.processBusinessEvent(event, userId, sessionId)
        break
        
      case 'error':
        await this.processErrorEvent(event, userId, sessionId)
        break
        
      case 'performance':
        await this.processPerformanceEvent(event, userId, sessionId)
        break
        
      case 'navigation':
        await this.processNavigationEvent(event, userId, sessionId)
        break
        
      default:
        // Generic event processing
        break
    }
  }

  /**
   * Process business events (games, scores, user actions)
   */
  private async processBusinessEvent(event: any, userId?: number, sessionId?: string) {
    const eventName = event.name.replace('business_', '')
    
    // Track métriques selon le type d'événement business
    if (eventName.startsWith('game_')) {
      const action = eventName.replace('game_', '')
      if (action === 'created' && event.attributes.game_type) {
        this.telemetryService.trackGameCreated(
          event.attributes.game_type,
          userId || 0,
          { source: 'frontend' }
        )
      }
    }
    
    if (eventName === 'score_updated') {
      this.telemetryService.trackScoreUpdated(
        event.attributes.score_type || 'UNKNOWN',
        event.attributes.game_type || 'UNKNOWN',
        userId || 0,
        event.attributes.score_value || 0
      )
    }
  }

  /**
   * Process error events
   */
  private async processErrorEvent(event: any, userId?: number, sessionId?: string) {
    // Log error avec niveau ERROR pour alerting
    logger.error(`🚨 Frontend error: ${event.name}`, {
      error_type: event.name,
      error_message: event.attributes.error_message,
      error_file: event.attributes.error_file,
      error_line: event.attributes.error_line,
      user_id: userId || 'anonymous',
      session_id: sessionId,
      url: event.attributes.url,
      user_agent: event.attributes.user_agent,
      action: 'frontend_error',
      domain: 'error_tracking',
    })
  }

  /**
   * Process performance events
   */
  private async processPerformanceEvent(event: any, userId?: number, sessionId?: string) {
    // Log performance issues pour monitoring
    if (event.name === 'slow_resource' || event.name === 'long_task') {
      logger.warn(`🐌 Performance issue: ${event.name}`, {
        performance_issue: event.name,
        duration_ms: event.attributes.duration_ms,
        resource_name: event.attributes.resource_name,
        resource_type: event.attributes.resource_type,
        user_id: userId || 'anonymous',
        session_id: sessionId,
        action: 'performance_issue',
        domain: 'performance',
      })
    }
  }

  /**
   * Process navigation events
   */
  private async processNavigationEvent(event: any, userId?: number, sessionId?: string) {
    // Track navigation patterns
    logger.info(`🧭 Navigation: ${event.attributes.from_route} → ${event.attributes.to_route}`, {
      from_route: event.attributes.from_route,
      to_route: event.attributes.to_route,
      navigation_duration_ms: event.attributes.duration_ms,
      user_id: userId || 'anonymous',
      session_id: sessionId,
      action: 'navigation',
      domain: 'user_journey',
    })
  }

  /**
   * Sanitize event data
   */
  private sanitizeEvent(event: any) {
    return {
      name: String(event.name || 'unknown').slice(0, 100),
      type: String(event.type || 'unknown').slice(0, 50),
      timestamp: Number(event.timestamp) || Date.now(),
      attributes: this.sanitizeAttributes(event.attributes || {}),
    }
  }

  /**
   * Sanitize event attributes
   */
  private sanitizeAttributes(attributes: any) {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(attributes)) {
      // Skip sensitive fields
      if (this.isSensitiveField(key)) continue
      
      // Limit string lengths
      if (typeof value === 'string') {
        sanitized[key] = value.slice(0, 500)
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitized[key] = value
      } else if (typeof value === 'boolean') {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  /**
   * Sanitize Web Vitals data
   */
  private sanitizeWebVitals(webVitals: any) {
    const validMetrics: any = {}
    const allowedMetrics = ['lcp', 'fid', 'cls', 'ttfb']
    
    for (const metric of allowedMetrics) {
      if (typeof webVitals[metric] === 'number' && webVitals[metric] >= 0 && webVitals[metric] < 60000) {
        validMetrics[metric] = webVitals[metric]
      }
    }
    
    return validMetrics
  }

  /**
   * Check if field contains sensitive information
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'cookie',
      'email', 'phone', 'address', 'credit_card', 'ssn'
    ]
    const lowerField = fieldName.toLowerCase()
    return sensitiveFields.some(sensitive => lowerField.includes(sensitive))
  }

  /**
   * Get log level based on event type
   */
  private getLogLevelForEvent(eventType: string): 'debug' | 'info' | 'warn' | 'error' {
    switch (eventType) {
      case 'error': return 'error'
      case 'performance': return 'warn'
      case 'business': return 'info'
      default: return 'debug'
    }
  }

  /**
   * Get domain from event for categorization
   */
  private getDomainFromEvent(event: any): string {
    if (event.name.includes('game')) return 'game_management'
    if (event.name.includes('score')) return 'score_management'
    if (event.name.includes('user')) return 'user_management'
    if (event.name.includes('navigation')) return 'user_journey'
    if (event.name.includes('error')) return 'error_tracking'
    if (event.name.includes('vital') || event.name.includes('performance')) return 'performance'
    return 'general'
  }

  /**
   * Track Web Vital thresholds for business intelligence
   */
  private trackWebVitalThreshold(metric: string, value: number, userId?: number) {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },  // ms
      fid: { good: 100, poor: 300 },    // ms
      cls: { good: 0.1, poor: 0.25 },   // ratio
      ttfb: { good: 800, poor: 1800 },  // ms
    }
    
    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return
    
    const performance_level = value <= threshold.good ? 'good' : 
                             value <= threshold.poor ? 'needs_improvement' : 'poor'
    
    // Log pour agrégation dans les dashboards
    logger.info(`📈 Performance threshold: ${metric}`, {
      metric_name: metric,
      metric_value: value,
      performance_level,
      user_id: userId || 'anonymous',
      action: 'performance_threshold',
      domain: 'performance_analytics',
    })
  }
}