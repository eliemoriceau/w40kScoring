import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class SystemLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare level: string

  @column()
  declare category: string

  @column()
  declare eventType: string

  @column()
  declare message: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare context: any

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare metadata: any

  @column()
  declare userId: number | null

  @column()
  declare sessionId: string | null

  @column()
  declare clientIp: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare requestId: string | null

  @column()
  declare responseTimeMs: number | null

  @column()
  declare memoryUsageMb: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  // Constants
  static readonly LEVELS = {
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
  } as const

  static readonly CATEGORIES = {
    SYSTEM: 'SYSTEM',
    SECURITY: 'SECURITY',
    USER_ACTION: 'USER_ACTION',
    PERFORMANCE: 'PERFORMANCE',
  } as const

  static readonly EVENT_TYPES = {
    // Authentication
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',

    // Configuration
    CONFIG_CHANGED: 'CONFIG_CHANGED',
    CONFIG_ROLLBACK: 'CONFIG_ROLLBACK',

    // System
    APPLICATION_START: 'APPLICATION_START',
    APPLICATION_STOP: 'APPLICATION_STOP',
    MAINTENANCE_MODE: 'MAINTENANCE_MODE',

    // Games & Users
    GAME_CREATED: 'GAME_CREATED',
    USER_REGISTERED: 'USER_REGISTERED',

    // Errors
    SERVER_ERROR: 'SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  } as const

  // Helper methods
  get levelDisplayName(): string {
    switch (this.level) {
      case SystemLog.LEVELS.ERROR:
        return 'Erreur'
      case SystemLog.LEVELS.WARNING:
        return 'Attention'
      case SystemLog.LEVELS.INFO:
        return 'Information'
      case SystemLog.LEVELS.DEBUG:
        return 'Debug'
      default:
        return this.level
    }
  }

  get categoryDisplayName(): string {
    switch (this.category) {
      case SystemLog.CATEGORIES.SYSTEM:
        return 'Système'
      case SystemLog.CATEGORIES.SECURITY:
        return 'Sécurité'
      case SystemLog.CATEGORIES.USER_ACTION:
        return 'Action utilisateur'
      case SystemLog.CATEGORIES.PERFORMANCE:
        return 'Performance'
      default:
        return this.category
    }
  }

  get isError(): boolean {
    return this.level === SystemLog.LEVELS.ERROR
  }

  get isWarning(): boolean {
    return this.level === SystemLog.LEVELS.WARNING
  }

  get isCritical(): boolean {
    return this.isError || this.category === SystemLog.CATEGORIES.SECURITY
  }
}
