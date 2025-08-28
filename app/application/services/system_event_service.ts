import SystemEvent from '#models/system_event'
import type { 
  EventType, 
  EventSeverity, 
  EventCategory 
} from '#models/system_event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { randomUUID } from 'crypto'

/**
 * Service pour la gestion des événements système
 * Journalisation complète des actions pour audit et traçabilité
 */
export default class SystemEventService {
  /**
   * Enregistre un nouvel événement système
   */
  async logEvent(data: {
    type: EventType
    category: EventCategory
    severity?: EventSeverity
    title: string
    description: string
    userId?: number | null
    ipAddress?: string | null
    userAgent?: string | null
    sessionId?: string | null
    resourceType?: string | null
    resourceId?: string | null
    metadata?: Record<string, any> | null
    correlationId?: string | null
    parentEventId?: number | null
    occurredAt?: DateTime
  }): Promise<SystemEvent> {
    return await SystemEvent.create({
      type: data.type,
      category: data.category,
      severity: data.severity || 'info',
      title: data.title,
      description: data.description,
      userId: data.userId || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      sessionId: data.sessionId || null,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      metadata: data.metadata || null,
      correlationId: data.correlationId || null,
      parentEventId: data.parentEventId || null,
      occurredAt: data.occurredAt || DateTime.now(),
    })
  }

  /**
   * Enregistre un événement depuis un contexte HTTP
   */
  async logEventFromContext(
    ctx: HttpContext, 
    type: EventType, 
    category: EventCategory,
    title: string,
    description: string,
    options: {
      severity?: EventSeverity
      resourceType?: string
      resourceId?: string
      metadata?: Record<string, any>
      correlationId?: string
      parentEventId?: number
    } = {}
  ): Promise<SystemEvent> {
    return await this.logEvent({
      type,
      category,
      severity: options.severity || 'info',
      title,
      description,
      userId: ctx.auth.user?.id || null,
      ipAddress: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      sessionId: ctx.session.sessionId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      metadata: options.metadata,
      correlationId: options.correlationId,
      parentEventId: options.parentEventId,
    })
  }

  /**
   * Enregistre un événement d'authentification
   */
  async logAuthEvent(
    ctx: HttpContext,
    type: 'user_login' | 'user_logout',
    userId: number,
    success: boolean = true
  ): Promise<SystemEvent> {
    return await this.logEventFromContext(
      ctx,
      type,
      'authentication',
      type === 'user_login' ? 'Connexion utilisateur' : 'Déconnexion utilisateur',
      `Utilisateur ${userId} ${type === 'user_login' ? 'connecté' : 'déconnecté'} ${success ? 'avec succès' : 'échec'}`,
      {
        severity: success ? 'info' : 'warning',
        resourceType: 'user',
        resourceId: userId.toString(),
        metadata: { success }
      }
    )
  }

  /**
   * Enregistre un événement utilisateur
   */
  async logUserEvent(
    ctx: HttpContext,
    type: 'user_created' | 'user_updated' | 'user_deleted' | 'user_role_changed',
    userId: number,
    details: Record<string, any> = {}
  ): Promise<SystemEvent> {
    const titles = {
      user_created: 'Utilisateur créé',
      user_updated: 'Utilisateur modifié',
      user_deleted: 'Utilisateur supprimé',
      user_role_changed: 'Rôle utilisateur modifié'
    }

    const severity: EventSeverity = type === 'user_deleted' ? 'warning' : 'info'

    return await this.logEventFromContext(
      ctx,
      type,
      'user',
      titles[type],
      `${titles[type]}: ${userId}`,
      {
        severity,
        resourceType: 'user',
        resourceId: userId.toString(),
        metadata: details
      }
    )
  }

  /**
   * Enregistre un événement de jeu
   */
  async logGameEvent(
    ctx: HttpContext,
    type: 'game_created' | 'game_started' | 'game_completed' | 'game_cancelled' | 'game_updated',
    gameId: number,
    details: Record<string, any> = {}
  ): Promise<SystemEvent> {
    const titles = {
      game_created: 'Partie créée',
      game_started: 'Partie démarrée',
      game_completed: 'Partie terminée',
      game_cancelled: 'Partie annulée',
      game_updated: 'Partie modifiée'
    }

    return await this.logEventFromContext(
      ctx,
      type,
      'game',
      titles[type],
      `${titles[type]}: ${gameId}`,
      {
        resourceType: 'game',
        resourceId: gameId.toString(),
        metadata: details
      }
    )
  }

  /**
   * Enregistre un événement de sécurité
   */
  async logSecurityEvent(
    ctx: HttpContext | null,
    type: 'security_alert' | 'permission_granted' | 'permission_revoked',
    title: string,
    description: string,
    severity: EventSeverity = 'warning',
    details: Record<string, any> = {}
  ): Promise<SystemEvent> {
    if (ctx) {
      return await this.logEventFromContext(
        ctx,
        type,
        'security',
        title,
        description,
        { severity, metadata: details }
      )
    } else {
      // Événement système sans contexte utilisateur
      return await this.logEvent({
        type,
        category: 'security',
        severity,
        title,
        description,
        metadata: details
      })
    }
  }

  /**
   * Enregistre un événement d'erreur
   */
  async logError(
    error: Error,
    ctx?: HttpContext,
    severity: EventSeverity = 'error',
    details: Record<string, any> = {}
  ): Promise<SystemEvent> {
    const eventData = {
      type: 'error_occurred' as EventType,
      category: 'system' as EventCategory,
      severity,
      title: 'Erreur système',
      description: error.message,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...details
      }
    }

    if (ctx) {
      return await this.logEventFromContext(
        ctx,
        eventData.type,
        eventData.category,
        eventData.title,
        eventData.description,
        {
          severity: eventData.severity,
          metadata: eventData.metadata
        }
      )
    } else {
      return await this.logEvent(eventData)
    }
  }

  /**
   * Récupère les événements avec filtres
   */
  async getEvents(options: {
    limit?: number
    offset?: number
    category?: EventCategory
    severity?: EventSeverity
    userId?: number
    resourceType?: string
    resourceId?: string
    correlationId?: string
    startDate?: DateTime
    endDate?: DateTime
    requiresAttention?: boolean
  } = {}): Promise<{
    events: SystemEvent[]
    total: number
  }> {
    let query = SystemEvent.query()
      .preload('user', (userQuery) => {
        userQuery.select('id', 'username')
      })
      .orderBy('occurredAt', 'desc')

    // Filtres
    if (options.category) {
      query = query.where('category', options.category)
    }

    if (options.severity) {
      query = query.where('severity', options.severity)
    }

    if (options.userId) {
      query = query.where('userId', options.userId)
    }

    if (options.resourceType) {
      query = query.where('resourceType', options.resourceType)
    }

    if (options.resourceId) {
      query = query.where('resourceId', options.resourceId)
    }

    if (options.correlationId) {
      query = query.where('correlationId', options.correlationId)
    }

    if (options.startDate) {
      query = query.where('occurredAt', '>=', options.startDate.toSQL())
    }

    if (options.endDate) {
      query = query.where('occurredAt', '<=', options.endDate.toSQL())
    }

    if (options.requiresAttention) {
      query = query.whereIn('severity', ['error', 'critical'])
    }

    // Pagination
    const totalQuery = query.clone()
    const total = await totalQuery.count('*').first()
    const totalCount = Number(total?.$extras['count(*)'] || 0)

    if (options.offset) {
      query = query.offset(options.offset)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    } else {
      query = query.limit(50) // Limite par défaut
    }

    const events = await query

    return {
      events,
      total: totalCount
    }
  }

  /**
   * Récupère les statistiques des événements
   */
  async getEventStats(period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number
    eventsByCategory: Record<string, number>
    eventsBySeverity: Record<string, number>
    eventsRequiringAttention: number
    recentErrors: SystemEvent[]
    topUsers: Array<{ userId: number, username: string, eventCount: number }>
  }> {
    const periodStart = DateTime.now().minus({
      days: period === 'day' ? 1 : period === 'week' ? 7 : 30
    })

    const [
      total,
      byCategory,
      bySeverity,
      errors,
      topUsers
    ] = await Promise.all([
      // Total des événements
      SystemEvent.query()
        .where('occurredAt', '>=', periodStart.toSQL())
        .count('*')
        .first(),

      // Par catégorie
      SystemEvent.query()
        .select('category')
        .count('* as count')
        .where('occurredAt', '>=', periodStart.toSQL())
        .groupBy('category'),

      // Par sévérité
      SystemEvent.query()
        .select('severity')
        .count('* as count')
        .where('occurredAt', '>=', periodStart.toSQL())
        .groupBy('severity'),

      // Erreurs récentes
      SystemEvent.query()
        .whereIn('severity', ['error', 'critical'])
        .where('occurredAt', '>=', periodStart.toSQL())
        .orderBy('occurredAt', 'desc')
        .limit(10),

      // Top utilisateurs
      SystemEvent.query()
        .select('userId')
        .count('* as count')
        .where('occurredAt', '>=', periodStart.toSQL())
        .whereNotNull('userId')
        .groupBy('userId')
        .orderBy('count', 'desc')
        .limit(5)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username')
        })
    ])

    return {
      totalEvents: Number(total?.$extras['count(*)'] || 0),
      eventsByCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = Number(item.$extras.count)
        return acc
      }, {} as Record<string, number>),
      eventsBySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = Number(item.$extras.count)
        return acc
      }, {} as Record<string, number>),
      eventsRequiringAttention: errors.length,
      recentErrors: errors,
      topUsers: topUsers.map(event => ({
        userId: event.userId!,
        username: event.user?.username || 'Inconnu',
        eventCount: Number(event.$extras.count)
      }))
    }
  }

  /**
   * Génère un ID de corrélation unique
   */
  generateCorrelationId(): string {
    return randomUUID()
  }

  /**
   * Archive les anciens événements (plus de X jours)
   */
  async archiveOldEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = DateTime.now().minus({ days: daysToKeep })
    
    const deletedCount = await SystemEvent.query()
      .where('occurredAt', '<', cutoffDate.toSQL())
      .where('severity', 'info') // Ne supprimer que les événements informatifs
      .delete()

    return deletedCount
  }
}