import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // User relationships
      table.integer('user_id').unsigned().notNullable()
      table.integer('opponent_id').unsigned().nullable()
      
      // Game configuration
      table
        .enum('game_type', ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY'])
        .notNullable()
        .defaultTo('MATCHED_PLAY')
      table.integer('points_limit').notNullable()
      
      // Game state
      table
        .enum('status', ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .notNullable()
        .defaultTo('PLANNED')
      
      // Game results
      table.integer('player_score').nullable()
      table.integer('opponent_score').nullable()
      
      // Additional information
      table.string('mission', 100).nullable()
      table.text('notes').nullable()
      
      // Timestamps
      table.timestamp('started_at').nullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
      
      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('opponent_id').references('id').inTable('users').onDelete('SET NULL')
      
      // Indexes for performance
      table.index(['user_id'])
      table.index(['status'])
      table.index(['created_at'])
      table.index(['user_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}