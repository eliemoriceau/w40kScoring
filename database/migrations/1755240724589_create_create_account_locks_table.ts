import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'account_locks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').notNullable()
      table.string('identifier_hash').notNullable()
      table.timestamp('locked_until').notNullable()
      table.string('lock_reason').notNullable()
      table.string('locked_by_ip').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('released_at').nullable()

      // Foreign key vers users
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

      // Index pour performance
      table.index(['user_id', 'locked_until'], 'idx_user_lock_status')
      table.index(['identifier_hash', 'locked_until'], 'idx_identifier_lock_status')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
