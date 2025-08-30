import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'system_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Configuration key (unique identifier)
      table.string('key', 100).notNullable().unique()

      // Configuration value (JSON format for complex data)
      table.json('value').notNullable()

      // Configuration metadata
      table.string('category', 50).notNullable().index()
      table.string('description', 500).nullable()
      table.boolean('is_critical').defaultTo(false)
      table.boolean('requires_restart').defaultTo(false)

      // Audit fields
      table.integer('created_by').unsigned().notNullable()
      table.integer('updated_by').unsigned().notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign key constraints
      table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('updated_by').references('id').inTable('users').onDelete('CASCADE')

      // Indexes for performance
      table.index(['category', 'key'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
