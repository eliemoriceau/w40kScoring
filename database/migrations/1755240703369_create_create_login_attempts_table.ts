import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_attempts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('identifier_hash').notNullable()
      table.string('ip_address').notNullable()
      table.boolean('success').defaultTo(false)
      table.timestamp('attempted_at').notNullable()
      table.text('user_agent').nullable()
      table.string('device_id').nullable()
      table.string('failure_reason').nullable()
      table.integer('user_id').nullable()

      // Foreign key vers users (nullable car on peut ne pas avoir l'user en cas d'échec)
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')

      // Indexes pour performance
      table.index(['identifier_hash', 'attempted_at'], 'idx_identifier_attempts')
      table.index(['ip_address', 'attempted_at'], 'idx_ip_attempts')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
