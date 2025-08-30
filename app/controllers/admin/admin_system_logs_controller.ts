import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import SystemLogService from '#application/services/system_log_service'
import type { LogFilters } from '#application/services/system_log_service'
import vine from '@vinejs/vine'

/**
 * Contrôleur pour la gestion des logs système
 * Interface admin réservée aux super-administrateurs
 */
@inject()
export default class AdminSystemLogsController {
  constructor(private systemLogService: SystemLogService) {}

  /**
   * Page principale des logs système
   */
  async index({ inertia, request, auth }: HttpContext) {
    try {
      const filters: LogFilters = {
        level: request.qs().level,
        category: request.qs().category,
        eventType: request.qs().event_type,
        userId: request.qs().user_id ? Number.parseInt(request.qs().user_id) : undefined,
        startDate: request.qs().start_date,
        endDate: request.qs().end_date,
        search: request.qs().search,
        limit: request.qs().limit ? Number.parseInt(request.qs().limit) : 50,
        offset: request.qs().offset ? Number.parseInt(request.qs().offset) : 0,
      }

      const [logsResult, stats, eventTypes, logUsers] = await Promise.all([
        this.systemLogService.getLogs(filters),
        this.systemLogService.getLogStats(7), // Last 7 days
        this.systemLogService.getAvailableEventTypes(),
        this.systemLogService.getLogUsers(),
      ])

      return inertia.render('admin/system/logs/Index', {
        logs: logsResult.data,
        totalLogs: logsResult.total,
        hasMoreLogs: logsResult.hasMore,
        stats,
        eventTypes,
        logUsers,
        filters,
        user: {
          id: auth.user!.id,
          username: auth.user!.username,
          fullName: auth.user!.fullName,
        },
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to load system logs page',
        error,
        { controller: 'AdminSystemLogsController', action: 'index' },
        auth.user?.id
      )
      throw error
    }
  }

  /**
   * API endpoint pour récupérer les logs avec pagination
   */
  async getLogs({ request, response, auth }: HttpContext) {
    try {
      const filters: LogFilters = {
        level: request.qs().level,
        category: request.qs().category,
        eventType: request.qs().event_type,
        userId: request.qs().user_id ? Number.parseInt(request.qs().user_id) : undefined,
        startDate: request.qs().start_date,
        endDate: request.qs().end_date,
        search: request.qs().search,
        limit: request.qs().limit ? Number.parseInt(request.qs().limit) : 50,
        offset: request.qs().offset ? Number.parseInt(request.qs().offset) : 0,
      }

      const result = await this.systemLogService.getLogs(filters)

      return response.json({
        data: result.data,
        total: result.total,
        hasMore: result.hasMore,
        filters,
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to get logs via API',
        error,
        { controller: 'AdminSystemLogsController', action: 'getLogs', filters: request.qs() },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to retrieve logs',
        error: error.message,
      })
    }
  }

  /**
   * API endpoint pour récupérer les statistiques des logs
   */
  async getStats({ request, response, auth }: HttpContext) {
    try {
      const days = request.qs().days ? Number.parseInt(request.qs().days) : 7
      const stats = await this.systemLogService.getLogStats(days)

      return response.json(stats)
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to get log stats via API',
        error,
        { controller: 'AdminSystemLogsController', action: 'getStats' },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to retrieve log statistics',
        error: error.message,
      })
    }
  }

  /**
   * Exporte les logs au format CSV
   */
  async export({ request, response, auth }: HttpContext) {
    try {
      const filters: LogFilters = {
        level: request.qs().level,
        category: request.qs().category,
        eventType: request.qs().event_type,
        userId: request.qs().user_id ? Number.parseInt(request.qs().user_id) : undefined,
        startDate: request.qs().start_date,
        endDate: request.qs().end_date,
        search: request.qs().search,
        limit: 10000, // Maximum for export
      }

      const csvContent = await this.systemLogService.exportLogs(filters)

      // Log the export action
      await this.systemLogService.logUserAction(
        auth.user!.id,
        'LOGS_EXPORTED',
        'System logs exported to CSV',
        { filters },
        request.ctx?.session.sessionId,
        request.ip(),
        request.header('user-agent')
      )

      const filename = `system-logs-${new Date().toISOString().split('T')[0]}.csv`

      return response
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvContent)
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to export logs',
        error,
        { controller: 'AdminSystemLogsController', action: 'export', filters: request.qs() },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to export logs',
        error: error.message,
      })
    }
  }

  /**
   * Nettoie les anciens logs
   */
  async cleanup({ request, response, auth, session }: HttpContext) {
    try {
      const cleanupValidator = vine.compile(
        vine.object({
          retention_days: vine.number().min(1).max(365),
          confirm: vine.boolean(),
        })
      )

      const payload = await request.validateUsing(cleanupValidator)

      if (!payload.confirm) {
        return response.status(400).json({
          message: 'Confirmation required for cleanup',
        })
      }

      const deletedCount = await this.systemLogService.cleanupOldLogs(payload.retention_days)

      session.flash('success', `${deletedCount} anciens logs supprimés avec succès`)

      return response.json({
        message: 'Logs cleaned up successfully',
        deletedCount,
        retentionDays: payload.retention_days,
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to cleanup logs',
        error,
        {
          controller: 'AdminSystemLogsController',
          action: 'cleanup',
          payload: request.all(),
        },
        auth.user?.id
      )

      session.flash('error', 'Erreur lors du nettoyage des logs')

      return response.status(500).json({
        message: 'Failed to cleanup logs',
        error: error.message,
      })
    }
  }

  /**
   * Récupère les détails d'un log spécifique
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const log = await this.systemLogService.getLogs({
        limit: 1,
        offset: 0,
      })

      // Find the specific log by ID
      const specificLog = log.data.find((l) => l.id === Number.parseInt(params.id))

      if (!specificLog) {
        return response.status(404).json({
          message: 'Log not found',
        })
      }

      return response.json({
        log: specificLog,
      })
    } catch (error) {
      await this.systemLogService.logError(
        `Failed to get log details: ${params.id}`,
        error,
        { controller: 'AdminSystemLogsController', action: 'show', logId: params.id },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to retrieve log details',
        error: error.message,
      })
    }
  }

  /**
   * Crée un log de test (pour le développement/debug)
   */
  async createTestLog({ request, response, auth }: HttpContext) {
    try {
      const testLogValidator = vine.compile(
        vine.object({
          level: vine.enum(['ERROR', 'WARNING', 'INFO', 'DEBUG']),
          category: vine.enum(['SYSTEM', 'SECURITY', 'USER_ACTION', 'PERFORMANCE']),
          event_type: vine.string().maxLength(100),
          message: vine.string().maxLength(1000),
          context: vine.object({}).optional(),
        })
      )

      const payload = await request.validateUsing(testLogValidator)

      const log = await this.systemLogService.createLog({
        level: payload.level,
        category: payload.category,
        eventType: payload.event_type,
        message: payload.message,
        context: payload.context,
        userId: auth.user!.id,
        sessionId: request.ctx?.session.sessionId,
        clientIp: request.ip(),
        userAgent: request.header('user-agent'),
      })

      return response.status(201).json({
        message: 'Test log created successfully',
        log,
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to create test log',
        error,
        {
          controller: 'AdminSystemLogsController',
          action: 'createTestLog',
          payload: request.all(),
        },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to create test log',
        error: error.message,
      })
    }
  }
}
