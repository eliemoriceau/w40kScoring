import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajout du champ username
      table.string('username', 30).notNullable().unique().after('id')

      // Ajout de la référence vers roles
      table.integer('role_id').unsigned().notNullable().defaultTo(1).after('password')
      table.foreign('role_id').references('id').inTable('roles')

      // Ajout des champs pour newsletter et terms
      table.boolean('newsletter_consent').notNullable().defaultTo(false).after('role_id')
      table.timestamp('terms_accepted_at').notNullable().after('newsletter_consent')

      // Index pour améliorer les performances
      table.index(['username'])
      table.index(['role_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['role_id'])
      table.dropIndex(['username'])
      table.dropIndex(['role_id'])
      table.dropColumn('username')
      table.dropColumn('role_id')
      table.dropColumn('newsletter_consent')
      table.dropColumn('terms_accepted_at')
    })
  }
}
