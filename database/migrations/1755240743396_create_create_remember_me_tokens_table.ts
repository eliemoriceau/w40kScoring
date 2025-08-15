import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'remember_me_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('tokenable_id').notNullable()
      table.string('hash').notNullable()
      table.string('selector').notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('last_used_at').nullable()
      table.string('ip_address').nullable()
      table.text('user_agent').nullable()
      table.boolean('is_revoked').defaultTo(false)

      // Foreign key vers users
      table.foreign('tokenable_id').references('id').inTable('users').onDelete('CASCADE')

      // Index pour performance et sécurité
      table.index(['selector', 'is_revoked', 'expires_at'], 'idx_selector_active')
      table.index(['tokenable_id', 'is_revoked'], 'idx_user_active_tokens')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
