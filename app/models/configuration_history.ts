import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class ConfigurationHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare settingKey: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare oldValue: any

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare newValue: any

  @column()
  declare action: string

  @column()
  declare changedBy: number

  @column()
  declare changeReason: string | null

  @column()
  declare clientIp: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare isRollback: boolean

  @column()
  declare rollbackFromHistoryId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'changedBy',
  })
  declare changer: BelongsTo<typeof User>

  @belongsTo(() => ConfigurationHistory, {
    foreignKey: 'rollbackFromHistoryId',
  })
  declare rollbackSource: BelongsTo<typeof ConfigurationHistory>

  // Constants for actions
  static readonly ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ROLLBACK: 'ROLLBACK',
  } as const

  // Helper methods
  get actionDisplayName(): string {
    switch (this.action) {
      case ConfigurationHistory.ACTIONS.CREATE:
        return 'Création'
      case ConfigurationHistory.ACTIONS.UPDATE:
        return 'Modification'
      case ConfigurationHistory.ACTIONS.DELETE:
        return 'Suppression'
      case ConfigurationHistory.ACTIONS.ROLLBACK:
        return 'Restauration'
      default:
        return this.action
    }
  }

  get hasChanged(): boolean {
    return JSON.stringify(this.oldValue) !== JSON.stringify(this.newValue)
  }
}
