import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from '#models/game'

export default class Round extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'game_id' })
  declare gameId: number

  @column({ columnName: 'round_number' })
  declare roundNumber: number

  @column({ columnName: 'player_score' })
  declare playerScore: number

  @column({ columnName: 'opponent_score' })
  declare opponentScore: number

  @column({ columnName: 'is_completed' })
  declare isCompleted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>
}
