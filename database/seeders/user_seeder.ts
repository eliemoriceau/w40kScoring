import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Utilise le modèle User pour bénéficier du hash automatique via AuthFinder
    await User.createMany([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password', // Hash automatique via AuthFinder
        roleId: 3, // ADMIN role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'password', // Hash automatique via AuthFinder
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
    ])
  }
}
