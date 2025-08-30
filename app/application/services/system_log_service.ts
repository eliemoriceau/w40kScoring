import SystemLog from '#models/system_log'
import { inject } from '@adonisjs/core'

export interface LogFilters {
  level?: string
  category?: string
  eventType?: string
  userId?: number
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}

export interface LogStats {
  totalLogs: number
  errorCount: number
  warningCount: number
  infoCount: number
  debugCount: number
  criticalCount: number
  recentErrors: SystemLog[]
  topEventTypes: Array<{ eventType: string; count: number }>
  logsByCategory: Array<{ category: string; count: number }>
  logsByHour: Array<{ hour: number; count: number }>
}

/**
 * Service pour la gestion des logs système
 * Implémente l'architecture hexagonale : couche Application
 */
@inject()
export default class SystemLogService {
  /**
   * Récupère les logs avec filtres et pagination
   */
  async getLogs(filters: LogFilters = {}): Promise<{
    data: SystemLog[]
    total: number
    hasMore: boolean
  }> {
    const query = SystemLog.query().preload('user', (userQuery) => {
      userQuery.select('id', 'username', 'fullName')
    })

    // Apply filters
    if (filters.level) {
      query.where('level', filters.level)
    }

    if (filters.category) {
      query.where('category', filters.category)
    }

    if (filters.eventType) {
      query.where('event_type', filters.eventType)
    }

    if (filters.userId) {
      query.where('user_id', filters.userId)
    }

    if (filters.startDate) {
      query.where('created_at', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query.where('created_at', '<=', filters.endDate)
    }

    if (filters.search) {
      query.where((searchQuery) => {
        searchQuery
          .whereILike('message', `%${filters.search}%`)
          .orWhereILike('event_type', `%${filters.search}%`)
      })
    }

    // Count total before pagination
    const totalQuery = query.clone()
    const total = await totalQuery.count('* as total')
    const totalCount = Number.parseInt(total[0].$extras.total)

    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    query
      .orderBy('created_at', 'desc')
      .limit(limit + 1) // +1 to check if there are more records
      .offset(offset)

    const results = await query

    const hasMore = results.length > limit
    if (hasMore) {
      results.pop() // Remove the extra record
    }

    return {
      data: results,
      total: totalCount,
      hasMore,
    }
  }

  /**
   * Récupère les statistiques des logs
   */
  async getLogStats(days: number = 7): Promise<LogStats> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [totalResult, levelCounts, recentErrors, eventTypeCounts, categoryCounts, hourlyCounts] =
      await Promise.all([
        // Total logs
        SystemLog.query().where('created_at', '>=', startDate).count('* as total'),

        // Count by level
        SystemLog.query()
          .where('created_at', '>=', startDate)
          .groupBy('level')
          .count('* as count')
          .select('level'),

        // Recent errors (last 10)
        SystemLog.query()
          .where('level', SystemLog.LEVELS.ERROR)
          .where('created_at', '>=', startDate)
          .preload('user', (query) => {
            query.select('id', 'username', 'fullName')
          })
          .orderBy('created_at', 'desc')
          .limit(10),

        // Top event types
        SystemLog.query()
          .where('created_at', '>=', startDate)
          .groupBy('event_type')
          .count('* as count')
          .select('event_type')
          .orderBy('count', 'desc')
          .limit(10),

        // Logs by category
        SystemLog.query()
          .where('created_at', '>=', startDate)
          .groupBy('category')
          .count('* as count')
          .select('category')
          .orderBy('count', 'desc'),

        // Logs by hour
        SystemLog.query()
          .where('created_at', '>=', startDate)
          .groupBy('hour')
          .count('* as count')
          .select(SystemLog.query().client.raw('EXTRACT(HOUR FROM created_at) as hour'))
          .orderBy('hour', 'asc'),
      ])

    const totalLogs = Number.parseInt(totalResult[0].$extras.total) || 0

    // Process level counts
    let errorCount = 0
    let warningCount = 0
    let infoCount = 0
    let debugCount = 0

    levelCounts.forEach((row) => {
      const count = Number.parseInt(row.$extras.count)
      switch (row.level) {
        case SystemLog.LEVELS.ERROR:
          errorCount = count
          break
        case SystemLog.LEVELS.WARNING:
          warningCount = count
          break
        case SystemLog.LEVELS.INFO:
          infoCount = count
          break
        case SystemLog.LEVELS.DEBUG:
          debugCount = count
          break
      }
    })

    const criticalCount =
      errorCount +
      recentErrors.filter((log) => log.category === SystemLog.CATEGORIES.SECURITY).length

    return {
      totalLogs,
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      criticalCount,
      recentErrors,
      topEventTypes: eventTypeCounts.map((row) => ({
        eventType: row.eventType,
        count: Number.parseInt(row.$extras.count),
      })),
      logsByCategory: categoryCounts.map((row) => ({
        category: row.category,
        count: Number.parseInt(row.$extras.count),
      })),
      logsByHour: hourlyCounts.map((row) => ({
        hour: Number.parseInt(row.$extras.hour),
        count: Number.parseInt(row.$extras.count),
      })),
    }
  }

  /**
   * Crée un nouveau log
   */
  async createLog(data: {
    level: string
    category: string
    eventType: string
    message: string
    context?: any
    metadata?: any
    userId?: number
    sessionId?: string
    clientIp?: string
    userAgent?: string
    requestId?: string
    responseTimeMs?: number
    memoryUsageMb?: number
  }): Promise<SystemLog> {
    return await SystemLog.create({
      level: data.level,
      category: data.category,
      eventType: data.eventType,
      message: data.message,
      context: data.context,
      metadata: data.metadata,
      userId: data.userId,
      sessionId: data.sessionId,
      clientIp: data.clientIp,
      userAgent: data.userAgent,
      requestId: data.requestId,
      responseTimeMs: data.responseTimeMs,
      memoryUsageMb: data.memoryUsageMb,
    })
  }

  /**
   * Journalise une erreur
   */
  async logError(
    message: string,
    error: Error | any,
    context?: any,
    userId?: number,
    sessionId?: string,
    clientIp?: string
  ): Promise<SystemLog> {
    return await this.createLog({
      level: SystemLog.LEVELS.ERROR,
      category: SystemLog.CATEGORIES.SYSTEM,
      eventType: SystemLog.EVENT_TYPES.SERVER_ERROR,
      message,
      context: {
        ...context,
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
        },
      },
      metadata: {
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      },
      userId,
      sessionId,
      clientIp,
    })
  }

  /**
   * Journalise une action utilisateur
   */
  async logUserAction(
    userId: number,
    action: string,
    message: string,
    context?: any,
    sessionId?: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<SystemLog> {
    return await this.createLog({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.USER_ACTION,
      eventType: action,
      message,
      context,
      userId,
      sessionId,
      clientIp,
      userAgent,
    })
  }

  /**
   * Journalise un événement de sécurité
   */
  async logSecurityEvent(
    eventType: string,
    message: string,
    level: string = SystemLog.LEVELS.WARNING,
    context?: any,
    userId?: number,
    sessionId?: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<SystemLog> {
    return await this.createLog({
      level,
      category: SystemLog.CATEGORIES.SECURITY,
      eventType,
      message,
      context,
      userId,
      sessionId,
      clientIp,
      userAgent,
    })
  }

  /**
   * Journalise des métriques de performance
   */
  async logPerformance(
    eventType: string,
    message: string,
    responseTimeMs: number,
    memoryUsageMb?: number,
    context?: any,
    userId?: number,
    requestId?: string
  ): Promise<SystemLog> {
    return await this.createLog({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.PERFORMANCE,
      eventType,
      message,
      context,
      userId,
      requestId,
      responseTimeMs,
      memoryUsageMb,
    })
  }

  /**
   * Nettoie les anciens logs
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await SystemLog.query().where('created_at', '<', cutoffDate).delete()

    await this.createLog({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.SYSTEM,
      eventType: 'LOG_CLEANUP',
      message: `Cleaned up ${result} old log entries older than ${retentionDays} days`,
      context: {
        deletedCount: result,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
      },
    })

    return result
  }

  /**
   * Exporte les logs au format CSV
   */
  async exportLogs(filters: LogFilters = {}): Promise<string> {
    const { data } = await this.getLogs({ ...filters, limit: 10000, offset: 0 })

    const headers = [
      'ID',
      'Date/Heure',
      'Niveau',
      'Catégorie',
      "Type d'événement",
      'Message',
      'Utilisateur',
      'IP Client',
      'Contexte',
    ]

    const csvRows = [
      headers.join(','),
      ...data.map((log) =>
        [
          log.id,
          log.createdAt.toFormat('dd/MM/yyyy HH:mm:ss'),
          log.level,
          log.category,
          log.eventType,
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes in CSV
          log.user ? log.user.username : '',
          log.clientIp || '',
          log.context ? `"${JSON.stringify(log.context).replace(/"/g, '""')}"` : '',
        ].join(',')
      ),
    ]

    return csvRows.join('\n')
  }

  /**
   * Récupère les types d'événements disponibles
   */
  async getAvailableEventTypes(): Promise<string[]> {
    const result = await SystemLog.query()
      .select('event_type')
      .groupBy('event_type')
      .orderBy('event_type', 'asc')

    return result.map((row) => row.eventType)
  }

  /**
   * Récupère les utilisateurs qui ont généré des logs
   */
  async getLogUsers(): Promise<Array<{ id: number; username: string; fullName: string | null }>> {
    const result = await SystemLog.query()
      .join('users', 'system_logs.user_id', 'users.id')
      .select('users.id', 'users.username', 'users.full_name as fullName')
      .groupBy('users.id', 'users.username', 'users.full_name')
      .orderBy('users.username', 'asc')

    return result.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
    }))
  }
}
