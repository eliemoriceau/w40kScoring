import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class AccountLock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare identifierHash: string

  @column.dateTime()
  declare lockedUntil: DateTime

  @column()
  declare lockReason: string

  @column()
  declare lockedByIp: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare releasedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Vérifie si le verrouillage est encore actif
   */
  isActive(): boolean {
    return this.releasedAt === null && DateTime.now() < this.lockedUntil
  }

  /**
   * Libère le verrouillage manuellement
   */
  release(): void {
    this.releasedAt = DateTime.now()
  }
}
