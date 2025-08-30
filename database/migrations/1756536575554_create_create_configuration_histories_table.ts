import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'configuration_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Reference to system setting
      table.string('setting_key', 100).notNullable()

      // Change tracking
      table.json('old_value').nullable()
      table.json('new_value').notNullable()
      table.string('action', 20).notNullable() // CREATE, UPDATE, DELETE

      // User and context
      table.integer('changed_by').unsigned().notNullable()
      table.string('change_reason', 500).nullable()
      table.string('client_ip', 45).nullable()
      table.string('user_agent', 500).nullable()

      // Rollback capability
      table.boolean('is_rollback').defaultTo(false)
      table.integer('rollback_from_history_id').unsigned().nullable()

      table.timestamp('created_at')

      // Foreign key constraints
      table.foreign('changed_by').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('rollback_from_history_id').references('id').inTable('configuration_histories')

      // Indexes for performance
      table.index(['setting_key', 'created_at'])
      table.index(['changed_by', 'created_at'])
      table.index(['action', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
