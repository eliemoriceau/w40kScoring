import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await db.table('roles').multiInsert([
      {
        id: 1,
        name: 'USER',
        description: 'Utilisateur standard - peut participer aux parties et gérer son profil',
        permission_level: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'MODERATOR',
        description: 'Modérateur - peut modérer les contenus et gérer les utilisateurs',
        permission_level: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'ADMIN',
        description: 'Administrateur - accès complet à toutes les fonctionnalités',
        permission_level: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
  }
}
