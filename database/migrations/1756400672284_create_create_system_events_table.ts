import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'system_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Type d'événement (enum large pour couvrir tous les types)
      table.string('type', 50).notNullable()
      
      // Catégorie de l'événement
      table.enum('category', ['authentication', 'authorization', 'data', 'system', 'security', 'game', 'user']).notNullable()
      
      // Sévérité de l'événement
      table.enum('severity', ['info', 'warning', 'error', 'critical']).defaultTo('info')
      
      // Titre et description
      table.string('title', 255).notNullable()
      table.text('description').notNullable()
      
      // Métadonnées JSON pour contexte supplémentaire
      table.json('metadata').nullable()
      
      // Utilisateur responsable (peut être null pour événements système)
      table.integer('user_id').unsigned().nullable()
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')
      
      // Informations de session/connexion
      table.string('ip_address', 45).nullable() // Support IPv6
      table.text('user_agent').nullable()
      table.string('session_id', 100).nullable()
      
      // Ressource affectée (générique)
      table.string('resource_type', 50).nullable()
      table.string('resource_id', 100).nullable()
      
      // Corrélation avec d'autres événements
      table.string('correlation_id', 100).nullable()
      table.integer('parent_event_id').unsigned().nullable()
      table.foreign('parent_event_id').references('id').inTable('system_events').onDelete('SET NULL')
      
      // Horodatage de l'occurrence (peut être différent de created_at)
      table.timestamp('occurred_at').notNullable()
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Index pour les performances et recherches
      table.index(['type', 'category'])
      table.index(['severity', 'occurred_at'])
      table.index(['user_id', 'occurred_at'])
      table.index(['category', 'occurred_at'])
      table.index(['resource_type', 'resource_id'])
      table.index(['correlation_id'])
      table.index(['occurred_at']) // Pour tri chronologique
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}