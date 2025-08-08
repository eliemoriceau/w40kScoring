import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Round from '#models/round'
import Player from '#models/player'

export default class Score extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'round_id' })
  declare roundId: number

  @column({ columnName: 'joueur_id' })
  declare joueurId: number

  @column({ columnName: 'type_score' })
  declare typeScore: string

  @column({ columnName: 'nom_score' })
  declare nomScore: string

  @column({ columnName: 'valeur_score' })
  declare valeurScore: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Round, { foreignKey: 'roundId' })
  declare round: BelongsTo<typeof Round>

  @belongsTo(() => Player, { foreignKey: 'joueurId' })
  declare player: BelongsTo<typeof Player>
}
