import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'system_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Log classification
      table.string('level', 20).notNullable().index() // ERROR, WARNING, INFO, DEBUG
      table.string('category', 50).notNullable().index() // SYSTEM, SECURITY, USER_ACTION, PERFORMANCE
      table.string('event_type', 100).notNullable() // LOGIN_FAILED, CONFIG_CHANGED, GAME_CREATED, etc.

      // Log content
      table.string('message', 1000).notNullable()
      table.json('context').nullable() // Additional data (user_id, game_id, etc.)
      table.json('metadata').nullable() // Request info, stack traces, etc.

      // User and request info
      table.integer('user_id').unsigned().nullable()
      table.string('session_id', 100).nullable()
      table.string('client_ip', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.string('request_id', 100).nullable().index()

      // Performance tracking
      table.integer('response_time_ms').unsigned().nullable()
      table.integer('memory_usage_mb').unsigned().nullable()

      table.timestamp('created_at')

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')

      // Composite indexes for efficient querying
      table.index(['level', 'created_at'])
      table.index(['category', 'created_at'])
      table.index(['user_id', 'created_at'])
      table.index(['event_type', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
