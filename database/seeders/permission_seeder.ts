import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PermissionService from '../../app/application/services/permission_service.js'

export default class extends BaseSeeder {
  async run() {
    const permissionService = new PermissionService()

    console.log('🔐 Initialisation des permissions par défaut...')
    await permissionService.seedDefaultPermissions()

    console.log('🔗 Attribution des permissions aux rôles...')
    await permissionService.assignDefaultRolePermissions()

    console.log('✅ Permissions initialisées avec succès')
  }
}
