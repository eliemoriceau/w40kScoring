import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Nom unique de la permission (ex: users.read, users.manage)
      table.string('name', 100).notNullable().unique()
      
      // Description de la permission
      table.text('description').notNullable()
      
      // Ressource concernée (users, notifications, parties, analytics, system)
      table.enum('resource', ['users', 'notifications', 'parties', 'analytics', 'system']).notNullable()
      
      // Action autorisée (read, create, update, delete, manage)
      table.enum('action', ['read', 'create', 'update', 'delete', 'manage']).notNullable()
      
      // Statut actif/inactif
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Index pour les performances
      table.index(['resource', 'action'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}