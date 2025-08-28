import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Type de notification
      table.string('type', 50).notNullable() // 'user_action', 'security_alert', 'system_status'

      // Titre et contenu
      table.string('title', 255).notNullable()
      table.text('message').notNullable()

      // Métadonnées
      table.json('metadata').nullable() // Données contextuelles supplémentaires

      // Priorité
      table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium')

      // État de lecture
      table.boolean('is_read').defaultTo(false)
      table.timestamp('read_at').nullable()

      // Utilisateur destinataire (null = tous les admins)
      table.integer('recipient_id').unsigned().nullable()
      table.foreign('recipient_id').references('id').inTable('users').onDelete('CASCADE')

      // Action source optionnelle
      table.integer('related_log_id').unsigned().nullable()
      table
        .foreign('related_log_id')
        .references('id')
        .inTable('admin_action_logs')
        .onDelete('SET NULL')

      // Expiration
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Index pour les performances
      table.index(['type', 'priority'])
      table.index(['is_read', 'created_at'])
      table.index(['recipient_id', 'is_read'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
