import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare opponentId: number | null

  @column()
  declare gameType: 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'

  @column()
  declare pointsLimit: number

  @column()
  declare status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

  @column()
  declare playerScore: number | null

  @column()
  declare opponentScore: number | null

  @column()
  declare mission: string | null

  @column()
  declare notes: string | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'opponentId',
  })
  declare opponent: BelongsTo<typeof User>
}