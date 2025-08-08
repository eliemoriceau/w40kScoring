import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from '#models/game'
import User from '#models/user'

export default class Player extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'game_id' })
  declare gameId: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare pseudo: string

  @column({ columnName: 'is_guest' })
  declare isGuest: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
