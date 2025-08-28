import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Référence vers le rôle
      table.integer('role_id').unsigned().notNullable()
      table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE')

      // Référence vers la permission
      table.integer('permission_id').unsigned().notNullable()
      table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE')

      // Date d'attribution de la permission
      table.timestamp('granted_at').defaultTo(this.now())

      // Utilisateur qui a accordé la permission
      table.integer('granted_by').unsigned().nullable()
      table.foreign('granted_by').references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Contrainte d'unicité pour éviter les doublons
      table.unique(['role_id', 'permission_id'])

      // Index pour les performances
      table.index(['role_id'])
      table.index(['permission_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
