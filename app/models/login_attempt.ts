import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class LoginAttempt extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare identifierHash: string

  @column()
  declare ipAddress: string

  @column()
  declare success: boolean

  @column.dateTime()
  declare attemptedAt: DateTime

  @column()
  declare userAgent: string | null

  @column()
  declare deviceId: string | null

  @column()
  declare failureReason: string | null

  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
