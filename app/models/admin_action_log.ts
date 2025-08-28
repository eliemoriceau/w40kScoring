import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Modèle pour l'audit trail des actions administrateur
 * Enregistre toutes les actions effectuées par les administrateurs
 */
export default class AdminActionLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare adminId: number

  @column()
  declare action: string

  @column()
  declare targetType: string

  @column()
  declare targetId: number | null

  @column()
  declare oldValue: string | null

  @column()
  declare newValue: string | null

  @column()
  declare ipAddress: string

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>

  /**
   * Parse la valeur ancienne depuis JSON
   */
  get parsedOldValue() {
    return this.oldValue ? JSON.parse(this.oldValue) : null
  }

  /**
   * Parse la nouvelle valeur depuis JSON
   */
  get parsedNewValue() {
    return this.newValue ? JSON.parse(this.newValue) : null
  }

  /**
   * Retourne une description lisible de l'action
   */
  get actionDescription(): string {
    const [resource, operation] = this.action.split('.')

    const descriptions: Record<string, string> = {
      'user.create': "Création d'utilisateur",
      'user.update': "Modification d'utilisateur",
      'user.delete': "Suppression d'utilisateur",
      'user.ban': "Bannissement d'utilisateur",
      'user.unban': "Débannissement d'utilisateur",
      'party.delete': 'Suppression de partie',
      'system.config': 'Modification de configuration',
      'system.maintenance': 'Mode maintenance',
    }

    return descriptions[this.action] || `Action ${operation} sur ${resource}`
  }

  /**
   * Retourne le niveau de gravité de l'action
   */
  get severity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.action.includes('delete') || this.action.includes('ban')) {
      return 'high'
    }

    if (this.action.includes('system')) {
      return 'critical'
    }

    if (this.action.includes('update') || this.action.includes('create')) {
      return 'medium'
    }

    return 'low'
  }
}
