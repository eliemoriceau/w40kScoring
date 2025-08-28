import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import AdminActionLog from '#models/admin_action_log'

export type NotificationType = 'user_action' | 'security_alert' | 'system_status'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Modèle pour les notifications administrateur
 * Gère les alertes et notifications internes au système
 */
export default class AdminNotification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: NotificationType

  @column()
  declare title: string

  @column()
  declare message: string

  @column({
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value) => JSON.stringify(value),
  })
  declare metadata: Record<string, any> | null

  @column()
  declare priority: NotificationPriority

  @column()
  declare isRead: boolean

  @column.dateTime()
  declare readAt: DateTime | null

  @column()
  declare recipientId: number | null

  @column()
  declare relatedLogId: number | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'recipientId' })
  declare recipient: BelongsTo<typeof User>

  @belongsTo(() => AdminActionLog, { foreignKey: 'relatedLogId' })
  declare relatedLog: BelongsTo<typeof AdminActionLog>

  /**
   * Marque la notification comme lue
   */
  async markAsRead() {
    this.isRead = true
    this.readAt = DateTime.now()
    await this.save()
  }

  /**
   * Vérifie si la notification est expirée
   */
  get isExpired(): boolean {
    return this.expiresAt ? DateTime.now() > this.expiresAt : false
  }

  /**
   * Retourne la classe CSS pour la priorité
   */
  get priorityClass(): string {
    const classes = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    }
    return classes[this.priority] || classes.medium
  }

  /**
   * Retourne l'icône pour le type de notification
   */
  get typeIcon(): string {
    const icons = {
      user_action: 'user',
      security_alert: 'shield',
      system_status: 'cog',
    }
    return icons[this.type] || 'bell'
  }

  /**
   * Formate le temps relatif de création
   */
  get timeAgo(): string {
    return this.createdAt.toRelative() || 'Il y a un moment'
  }

  /**
   * Retourne un court résumé de la notification
   */
  get summary(): string {
    return this.message.length > 100 ? `${this.message.substring(0, 100)}...` : this.message
  }
}
