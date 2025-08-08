import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'scores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign key to rounds table
      table.integer('round_id').unsigned().notNullable()

      // Foreign key to players table (joueur_id in issue spec)
      table.integer('joueur_id').unsigned().notNullable()

      // Business fields from issue specification
      table.string('type_score', 50).notNullable() // ScoreType enum
      table.string('nom_score', 100).notNullable() // ScoreName
      table.integer('valeur_score').notNullable() // ScoreValue

      // Timestamps
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      // Foreign key constraints
      table.foreign('round_id').references('id').inTable('rounds').onDelete('CASCADE')
      table.foreign('joueur_id').references('id').inTable('players').onDelete('CASCADE')

      // Business constraints and indexes for performance
      table.index(['round_id'])
      table.index(['joueur_id'])
      table.index(['round_id', 'joueur_id'])
      table.index(['type_score'])
      table.index(['round_id', 'type_score'])

      // Unique constraint: one score per (round, player, score_type, score_name) to prevent duplicates
      table.unique(
        ['round_id', 'joueur_id', 'type_score', 'nom_score'],
        'unique_score_per_round_player_type_name'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
