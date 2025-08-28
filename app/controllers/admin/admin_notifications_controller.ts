import type { HttpContext } from '@adonisjs/core/http'
import AdminNotificationService from '#services/admin_notification_service'

export default class AdminNotificationsController {
  private notificationService = new AdminNotificationService()

  /**
   * API - Récupère les notifications pour l'utilisateur connecté
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const limit = Number(request.input('limit', 20))
    const unreadOnly = request.input('unread_only') === 'true'

    try {
      const notifications = await this.notificationService.getNotificationsForUser(user.id, {
        limit,
        unreadOnly,
        includeGlobal: true,
      })

      const formattedNotifications = notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        summary: notification.summary,
        priority: notification.priority,
        priorityClass: notification.priorityClass,
        typeIcon: notification.typeIcon,
        isRead: notification.isRead,
        timeAgo: notification.timeAgo,
        createdAt: notification.createdAt.toFormat('dd/MM/yyyy HH:mm'),
        metadata: notification.metadata,
        relatedLog: notification.relatedLog ? {
          id: notification.relatedLog.id,
          action: notification.relatedLog.action,
          actionDescription: notification.relatedLog.actionDescription,
          admin: notification.relatedLog.admin ? {
            id: notification.relatedLog.admin.id,
            username: notification.relatedLog.admin.username,
          } : null,
        } : null,
      }))

      return response.json({
        notifications: formattedNotifications,
        total: formattedNotifications.length,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors de la récupération des notifications',
      })
    }
  }

  /**
   * API - Marque une notification comme lue
   */
  async markAsRead({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const notificationId = params.id

    try {
      const notification = await this.notificationService.markAsRead(
        Number(notificationId),
        user.id
      )

      if (!notification) {
        return response.status(404).json({
          error: 'Notification non trouvée',
        })
      }

      return response.json({
        message: 'Notification marquée comme lue',
        notification: {
          id: notification.id,
          isRead: notification.isRead,
          readAt: notification.readAt?.toFormat('dd/MM/yyyy HH:mm'),
        },
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors de la mise à jour de la notification',
      })
    }
  }

  /**
   * API - Marque toutes les notifications comme lues
   */
  async markAllAsRead({ auth, response }: HttpContext) {
    const user = auth.user!

    try {
      await this.notificationService.markAllAsRead(user.id)

      return response.json({
        message: 'Toutes les notifications ont été marquées comme lues',
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors de la mise à jour des notifications',
      })
    }
  }

  /**
   * API - Récupère le nombre de notifications non lues
   */
  async unreadCount({ auth, response }: HttpContext) {
    const user = auth.user!

    try {
      const count = await this.notificationService.getUnreadCount(user.id)

      return response.json({
        unreadCount: count,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors du comptage des notifications',
      })
    }
  }

  /**
   * API - Récupère les statistiques des notifications (admin seulement)
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await this.notificationService.getNotificationStats()

      return response.json({
        stats,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
      })
    }
  }
}