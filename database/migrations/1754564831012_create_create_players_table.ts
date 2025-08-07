import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Game relationship (required)
      table.integer('game_id').unsigned().notNullable()

      // User relationship (nullable for guest players)
      table.integer('user_id').unsigned().nullable()

      // Player display name
      table.string('pseudo', 50).notNullable()

      // Timestamps
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      // Foreign key constraints
      table.foreign('game_id').references('id').inTable('games').onDelete('CASCADE')
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')

      // Indexes for performance
      table.index(['game_id'])
      table.index(['user_id'])
      table.index(['game_id', 'pseudo']) // Unique pseudo per game
      table.index(['game_id', 'user_id']) // Find user in game

      // Business constraints
      table.unique(['game_id', 'pseudo']) // Pseudo must be unique per game
      table.unique(['game_id', 'user_id']) // User can only be once per game (when not null)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
