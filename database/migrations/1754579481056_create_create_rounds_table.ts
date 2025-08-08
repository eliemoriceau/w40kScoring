import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rounds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign key to games table
      table.integer('game_id').unsigned().notNullable()

      // Business fields
      table.integer('round_number').unsigned().notNullable()
      table.integer('player_score').defaultTo(0).notNullable()
      table.integer('opponent_score').defaultTo(0).notNullable()
      table.boolean('is_completed').defaultTo(false).notNullable()

      // Timestamps
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      // Foreign key constraints
      table.foreign('game_id').references('id').inTable('games').onDelete('CASCADE')

      // Business constraints
      table.unique(['game_id', 'round_number'], 'unique_round_per_game')

      // Indexes for performance
      table.index(['game_id'])
      table.index(['game_id', 'round_number'])
      table.index(['game_id', 'is_completed'])

      // Check constraints for business rules (will be enforced by domain layer for SQLite)
      // Note: SQLite has limited check constraint support, PostgreSQL will support these fully
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
