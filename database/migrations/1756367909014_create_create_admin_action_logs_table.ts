import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_action_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Référence à l'administrateur qui a effectué l'action
      table.integer('admin_id').unsigned().notNullable()
      table.foreign('admin_id').references('id').inTable('users').onDelete('CASCADE')

      // Description de l'action (ex: 'user.ban', 'party.delete')
      table.string('action', 100).notNullable()

      // Type de cible (ex: 'user', 'party', 'system')
      table.string('target_type', 50).notNullable()

      // ID de la cible (peut être null pour les actions système)
      table.integer('target_id').unsigned().nullable()

      // Valeurs avant/après modification (format JSON)
      table.text('old_value').nullable()
      table.text('new_value').nullable()

      // Informations de traçabilité
      table.string('ip_address', 45).notNullable() // Support IPv6
      table.text('user_agent').nullable()

      // Index pour les performances
      table.index(['admin_id', 'created_at'])
      table.index(['action', 'created_at'])
      table.index(['target_type', 'target_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
