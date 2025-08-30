import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class SystemSetting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare value: any

  @column()
  declare category: string

  @column()
  declare description: string | null

  @column()
  declare isCritical: boolean

  @column()
  declare requiresRestart: boolean

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updater: BelongsTo<typeof User>

  // Static methods for configuration categories
  static readonly CATEGORIES = {
    GENERAL: 'general',
    GAMES: 'games',
    USERS: 'users',
    NOTIFICATIONS: 'notifications',
    PERFORMANCE: 'performance',
    SECURITY: 'security',
  } as const

  // Helper method to check if setting is critical
  get isSystemCritical(): boolean {
    return this.isCritical
  }

  // Helper method to get typed value
  getValue<T = any>(): T {
    return this.value as T
  }
}
