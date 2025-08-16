import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Hash les mots de passe
    const adminPassword = await hash.make('password')
    const userPassword = await hash.make('password')

    await db.table('users').multiInsert([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role_id: 3, // ADMIN role
        newsletter_consent: false,
        terms_accepted_at: DateTime.now().toSQL(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        username: 'user',
        email: 'user@example.com', 
        password: userPassword,
        role_id: 1, // USER role
        newsletter_consent: false,
        terms_accepted_at: DateTime.now().toSQL(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
  }
}