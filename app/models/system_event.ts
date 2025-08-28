import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type EventType = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'user_role_changed' | 'user_login' | 'user_logout'
  | 'game_created' | 'game_started' | 'game_completed' | 'game_cancelled' | 'game_updated'
  | 'round_created' | 'round_completed' | 'round_updated'
  | 'score_added' | 'score_updated' | 'score_deleted'
  | 'notification_created' | 'notification_read' | 'notification_deleted'
  | 'permission_granted' | 'permission_revoked'
  | 'system_config_updated' | 'system_maintenance' | 'system_backup'
  | 'error_occurred' | 'security_alert' | 'audit_log'

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical'

export type EventCategory = 'authentication' | 'authorization' | 'data' | 'system' | 'security' | 'game' | 'user'

/**
 * Modèle pour l'historique des événements système
 * Traçabilité complète de toutes les actions importantes
 */
export default class SystemEvent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: EventType

  @column()
  declare category: EventCategory

  @column()
  declare severity: EventSeverity

  @column()
  declare title: string

  @column()
  declare description: string

  @column({
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value) => JSON.stringify(value),
  })
  declare metadata: Record<string, any> | null

  @column()
  declare userId: number | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare sessionId: string | null

  // Ressource affectée (optionnel)
  @column()
  declare resourceType: string | null

  @column()
  declare resourceId: string | null

  // Corrélation avec d'autres événements
  @column()
  declare correlationId: string | null

  @column()
  declare parentEventId: number | null

  @column.dateTime({ autoCreate: true })
  declare occurredAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SystemEvent, { foreignKey: 'parentEventId' })
  declare parentEvent: BelongsTo<typeof SystemEvent>

  /**
   * Retourne l'icône correspondant au type d'événement
   */
  get typeIcon(): string {
    const icons: Record<string, string> = {
      // Utilisateurs
      user_created: 'user-plus',
      user_updated: 'user-edit',
      user_deleted: 'user-minus',
      user_role_changed: 'shield-check',
      user_login: 'login',
      user_logout: 'logout',

      // Jeux
      game_created: 'plus-circle',
      game_started: 'play-circle',
      game_completed: 'check-circle',
      game_cancelled: 'x-circle',
      game_updated: 'edit-3',

      // Scores
      score_added: 'plus',
      score_updated: 'edit',
      score_deleted: 'trash',

      // Notifications
      notification_created: 'bell',
      notification_read: 'bell-off',

      // Permissions
      permission_granted: 'key',
      permission_revoked: 'shield-x',

      // Système
      system_config_updated: 'settings',
      system_maintenance: 'tool',
      system_backup: 'save',
      error_occurred: 'alert-triangle',
      security_alert: 'shield-alert',
      audit_log: 'file-text'
    }

    return icons[this.type] || 'activity'
  }

  /**
   * Retourne la classe CSS pour la sévérité
   */
  get severityClass(): string {
    const classes: Record<EventSeverity, string> = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      critical: 'bg-red-200 text-red-900 border-red-300 font-bold'
    }

    return classes[this.severity]
  }

  /**
   * Retourne la classe CSS pour la catégorie
   */
  get categoryClass(): string {
    const classes: Record<EventCategory, string> = {
      authentication: 'text-green-600',
      authorization: 'text-yellow-600',
      data: 'text-blue-600',
      system: 'text-purple-600',
      security: 'text-red-600',
      game: 'text-indigo-600',
      user: 'text-teal-600'
    }

    return classes[this.category]
  }

  /**
   * Formate le temps relatif de l'événement
   */
  get timeAgo(): string {
    return this.occurredAt.toRelative() || 'Il y a un moment'
  }

  /**
   * Retourne un résumé court de l'événement
   */
  get summary(): string {
    if (this.description.length <= 100) {
      return this.description
    }
    return `${this.description.substring(0, 100)}...`
  }

  /**
   * Détermine si l'événement nécessite une attention
   */
  get requiresAttention(): boolean {
    return this.severity === 'error' || this.severity === 'critical'
  }

  /**
   * Détermine si l'événement est lié à la sécurité
   */
  get isSecurityRelated(): boolean {
    return this.category === 'security' || 
           this.category === 'authorization' ||
           this.type === 'security_alert' ||
           this.type === 'user_role_changed'
  }

  /**
   * Retourne les données de contexte formatées
   */
  get contextData(): string {
    if (!this.metadata) {
      return 'Aucune donnée de contexte'
    }

    const context = []
    
    if (this.resourceType && this.resourceId) {
      context.push(`${this.resourceType}:${this.resourceId}`)
    }

    if (this.ipAddress) {
      context.push(`IP: ${this.ipAddress}`)
    }

    if (this.sessionId) {
      context.push(`Session: ${this.sessionId.substring(0, 8)}...`)
    }

    return context.length > 0 ? context.join(' | ') : 'N/A'
  }
}