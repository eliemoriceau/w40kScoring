import AdminNotification, {
  NotificationType,
  NotificationPriority,
} from '#models/admin_notification'
import AdminActionLog from '#models/admin_action_log'
import { DateTime } from 'luxon'

/**
 * Service pour la gestion des notifications administrateur
 * Création, envoi et gestion des notifications internes
 */
export default class AdminNotificationService {
  /**
   * Crée une nouvelle notification
   */
  async createNotification(data: {
    type: NotificationType
    title: string
    message: string
    priority?: NotificationPriority
    recipientId?: number
    relatedLogId?: number
    metadata?: Record<string, any>
    expiresAt?: DateTime
  }) {
    return await AdminNotification.create({
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      recipientId: data.recipientId || null,
      relatedLogId: data.relatedLogId || null,
      metadata: data.metadata || null,
      expiresAt: data.expiresAt || null,
    })
  }

  /**
   * Récupère les notifications pour un utilisateur admin
   */
  async getNotificationsForUser(
    userId: number,
    options: {
      limit?: number
      unreadOnly?: boolean
      includeGlobal?: boolean
    } = {}
  ) {
    const { limit = 20, unreadOnly = false, includeGlobal = true } = options

    let query = AdminNotification.query()
      .preload('relatedLog', (logQuery) => {
        logQuery.preload('admin', (adminQuery) => {
          adminQuery.select('id', 'username')
        })
      })
      .orderBy('createdAt', 'desc')

    // Filtrer par destinataire
    if (includeGlobal) {
      query = query.where((q) => {
        q.where('recipientId', userId).orWhereNull('recipientId')
      })
    } else {
      query = query.where('recipientId', userId)
    }

    // Filtrer par statut de lecture
    if (unreadOnly) {
      query = query.where('isRead', false)
    }

    // Exclure les notifications expirées
    query = query.where((q) => {
      q.whereNull('expiresAt').orWhere('expiresAt', '>', DateTime.now().toSQL())
    })

    return await query.limit(limit)
  }

  /**
   * Marque une notification comme lue pour un utilisateur
   */
  async markAsRead(notificationId: number, userId: number) {
    const notification = await AdminNotification.query()
      .where('id', notificationId)
      .where((q) => {
        q.where('recipientId', userId).orWhereNull('recipientId')
      })
      .first()

    if (notification && !notification.isRead) {
      await notification.markAsRead()
    }

    return notification
  }

  /**
   * Marque toutes les notifications comme lues pour un utilisateur
   */
  async markAllAsRead(userId: number) {
    await AdminNotification.query()
      .where((q) => {
        q.where('recipientId', userId).orWhereNull('recipientId')
      })
      .where('isRead', false)
      .update({
        isRead: true,
        readAt: DateTime.now(),
      })
  }

  /**
   * Compte les notifications non lues pour un utilisateur
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = await AdminNotification.query()
      .where((q) => {
        q.where('recipientId', userId).orWhereNull('recipientId')
      })
      .where('isRead', false)
      .where((q) => {
        q.whereNull('expiresAt').orWhere('expiresAt', '>', DateTime.now().toSQL())
      })
      .count('*')
      .first()

    return Number(result?.$extras['count(*)'] || 0)
  }

  /**
   * Crée automatiquement une notification basée sur une action d'audit
   */
  async createNotificationFromAuditLog(logId: number) {
    const log = await AdminActionLog.query().where('id', logId).preload('admin').first()

    if (!log) return null

    // Détermine si cette action justifie une notification
    const criticalActions = ['user.delete', 'user.update_role', 'system.config']
    const highPriorityActions = ['user.create', 'user.reset_password']

    let priority: NotificationPriority = 'medium'
    let shouldNotify = false

    if (criticalActions.includes(log.action)) {
      priority = 'critical'
      shouldNotify = true
    } else if (highPriorityActions.includes(log.action)) {
      priority = 'high'
      shouldNotify = true
    }

    if (!shouldNotify) return null

    const notification = await this.createNotification({
      type: log.action.startsWith('system') ? 'system_status' : 'user_action',
      title: `Action ${log.severity === 'critical' ? 'critique' : 'importante'}`,
      message: `${log.admin.username} a effectué : ${log.actionDescription}`,
      priority,
      relatedLogId: log.id,
      metadata: {
        adminId: log.adminId,
        targetType: log.targetType,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
      },
      // Expiration dans 7 jours pour les actions non critiques
      expiresAt: priority === 'critical' ? undefined : DateTime.now().plus({ days: 7 }),
    })

    return notification
  }

  /**
   * Crée une notification d'alerte sécurité
   */
  async createSecurityAlert(data: {
    title: string
    message: string
    metadata?: Record<string, any>
    recipientId?: number
  }) {
    return await this.createNotification({
      type: 'security_alert',
      title: data.title,
      message: data.message,
      priority: 'critical',
      recipientId: data.recipientId,
      metadata: data.metadata,
      // Les alertes sécurité n'expirent pas automatiquement
    })
  }

  /**
   * Crée une notification de statut système
   */
  async createSystemStatusNotification(data: {
    title: string
    message: string
    priority?: NotificationPriority
    metadata?: Record<string, any>
  }) {
    return await this.createNotification({
      type: 'system_status',
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      metadata: data.metadata,
      expiresAt: DateTime.now().plus({ days: 3 }), // Expire dans 3 jours
    })
  }

  /**
   * Nettoie les notifications expirées
   */
  async cleanExpiredNotifications() {
    const expiredCount = await AdminNotification.query()
      .where('expiresAt', '<', DateTime.now().toSQL())
      .delete()

    return expiredCount
  }

  /**
   * Récupère les statistiques des notifications
   */
  async getNotificationStats() {
    const [total, unread, byType, byPriority] = await Promise.all([
      // Total des notifications
      AdminNotification.query().count('*').first(),

      // Non lues
      AdminNotification.query().where('isRead', false).count('*').first(),

      // Par type
      AdminNotification.query().select('type').count('* as count').groupBy('type'),

      // Par priorité
      AdminNotification.query().select('priority').count('* as count').groupBy('priority'),
    ])

    return {
      total: Number(total?.$extras['count(*)'] || 0),
      unread: Number(unread?.$extras['count(*)'] || 0),
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = Number(item.$extras.count)
          return acc
        },
        {} as Record<string, number>
      ),
      byPriority: byPriority.reduce(
        (acc, item) => {
          acc[item.priority] = Number(item.$extras.count)
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }
}
