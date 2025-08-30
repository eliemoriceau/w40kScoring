import { BaseSeeder } from '@adonisjs/lucid/seeders'
import SystemSetting from '#models/system_setting'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Find a super admin user
    const superAdmin = await User.query()
      .whereHas('role', (query) => {
        query.where('permission_level', 3)
      })
      .first()

    if (!superAdmin) {
      console.log('⚠️ No super admin user found. Skipping system configuration seeding.')
      return
    }

    console.log(`📋 Creating system configuration with super admin: ${superAdmin.username}`)

    // Test configuration settings
    const testConfigs = [
      {
        key: 'app.name',
        value: 'W40K Scoring System',
        category: 'general',
        description: "Nom de l'application affiché dans l'interface",
        isCritical: false,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'app.environment',
        value: 'development',
        category: 'general',
        description: "Environnement d'exécution de l'application",
        isCritical: true,
        requiresRestart: true,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'games.default_rounds',
        value: 5,
        category: 'games',
        description: 'Nombre de rounds par défaut pour une nouvelle partie',
        isCritical: false,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'games.max_players_per_game',
        value: 8,
        category: 'games',
        description: 'Nombre maximum de joueurs par partie',
        isCritical: false,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'users.max_parties_per_user',
        value: 10,
        category: 'users',
        description: "Nombre maximum de parties qu'un utilisateur peut créer",
        isCritical: false,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'users.session_timeout',
        value: 3600,
        category: 'users',
        description: 'Durée de session utilisateur en secondes',
        isCritical: true,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'notifications.email_enabled',
        value: true,
        category: 'notifications',
        description: 'Activer les notifications par email',
        isCritical: false,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'performance.cache_ttl',
        value: 300,
        category: 'performance',
        description: 'Durée de vie du cache en secondes',
        isCritical: false,
        requiresRestart: true,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'security.max_login_attempts',
        value: 5,
        category: 'security',
        description: 'Nombre maximum de tentatives de connexion',
        isCritical: true,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
      {
        key: 'security.password_min_length',
        value: 8,
        category: 'security',
        description: 'Longueur minimale des mots de passe',
        isCritical: true,
        requiresRestart: false,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
    ]

    for (const config of testConfigs) {
      const existing = await SystemSetting.findBy('key', config.key)
      if (!existing) {
        await SystemSetting.create(config)
        console.log(`✅ Created config: ${config.key}`)
      } else {
        console.log(`⚠️ Config already exists: ${config.key}`)
      }
    }

    console.log('✅ System configuration seeding completed!')
  }
  catch(error) {
    console.error('❌ Error during seeding:', error.message)
    throw error
  }
}
