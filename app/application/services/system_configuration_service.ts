import SystemSetting from '#models/system_setting'
import ConfigurationHistory from '#models/configuration_history'
import SystemLog from '#models/system_log'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Service pour la gestion des paramètres de configuration système
 * Implémente l'architecture hexagonale : couche Application
 */
@inject()
export default class SystemConfigurationService {
  /**
   * Récupère toutes les configurations par catégorie
   */
  async getConfigurationsByCategory(): Promise<Record<string, SystemSetting[]>> {
    const settings = await SystemSetting.query()
      .preload('creator', (query) => {
        query.select('id', 'username', 'fullName')
      })
      .preload('updater', (query) => {
        query.select('id', 'username', 'fullName')
      })
      .orderBy('category', 'asc')
      .orderBy('key', 'asc')

    const grouped: Record<string, SystemSetting[]> = {}

    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = []
      }
      grouped[setting.category].push(setting)
    }

    return grouped
  }

  /**
   * Récupère une configuration par sa clé
   */
  async getConfiguration(key: string): Promise<SystemSetting | null> {
    return await SystemSetting.query()
      .where('key', key)
      .preload('creator')
      .preload('updater')
      .first()
  }

  /**
   * Récupère la valeur d'une configuration
   */
  async getConfigurationValue<T = any>(
    key: string,
    defaultValue: T | null = null
  ): Promise<T | null> {
    const setting = await SystemSetting.query().where('key', key).first()
    return setting ? setting.getValue<T>() : defaultValue
  }

  /**
   * Met à jour ou crée une configuration
   */
  async setConfiguration(
    key: string,
    value: any,
    userId: number,
    options: {
      category?: string
      description?: string
      isCritical?: boolean
      requiresRestart?: boolean
      changeReason?: string
      clientIp?: string
      userAgent?: string
    } = {}
  ): Promise<SystemSetting> {
    const existingSetting = await this.getConfiguration(key)

    let setting: SystemSetting
    let action: string

    if (existingSetting) {
      // Update existing setting
      const oldValue = existingSetting.value

      existingSetting.value = value
      existingSetting.updatedBy = userId

      if (options.description !== undefined) {
        existingSetting.description = options.description
      }
      if (options.isCritical !== undefined) {
        existingSetting.isCritical = options.isCritical
      }
      if (options.requiresRestart !== undefined) {
        existingSetting.requiresRestart = options.requiresRestart
      }

      await existingSetting.save()

      // Log configuration history
      await this.logConfigurationChange({
        settingKey: key,
        oldValue,
        newValue: value,
        action: ConfigurationHistory.ACTIONS.UPDATE,
        changedBy: userId,
        changeReason: options.changeReason,
        clientIp: options.clientIp,
        userAgent: options.userAgent,
      })

      action = 'updated'
      setting = existingSetting
    } else {
      // Create new setting
      setting = await SystemSetting.create({
        key,
        value,
        category: options.category || SystemSetting.CATEGORIES.GENERAL,
        description: options.description,
        isCritical: options.isCritical || false,
        requiresRestart: options.requiresRestart || false,
        createdBy: userId,
        updatedBy: userId,
      })

      // Log configuration history
      await this.logConfigurationChange({
        settingKey: key,
        oldValue: null,
        newValue: value,
        action: ConfigurationHistory.ACTIONS.CREATE,
        changedBy: userId,
        changeReason: options.changeReason,
        clientIp: options.clientIp,
        userAgent: options.userAgent,
      })

      action = 'created'
    }

    // Log system event
    await this.logSystemEvent({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.SYSTEM,
      eventType: SystemLog.EVENT_TYPES.CONFIG_CHANGED,
      message: `Configuration ${action}: ${key}`,
      context: {
        configKey: key,
        action,
        isCritical: setting.isCritical,
        requiresRestart: setting.requiresRestart,
      },
      userId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
    })

    return setting
  }

  /**
   * Supprime une configuration
   */
  async deleteConfiguration(
    key: string,
    userId: number,
    options: {
      changeReason?: string
      clientIp?: string
      userAgent?: string
    } = {}
  ): Promise<void> {
    const setting = await this.getConfiguration(key)

    if (!setting) {
      throw new Exception(`Configuration '${key}' not found`, { status: 404 })
    }

    const oldValue = setting.value

    // Log configuration history before deletion
    await this.logConfigurationChange({
      settingKey: key,
      oldValue,
      newValue: null,
      action: ConfigurationHistory.ACTIONS.DELETE,
      changedBy: userId,
      changeReason: options.changeReason,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
    })

    // Delete the setting
    await setting.delete()

    // Log system event
    await this.logSystemEvent({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.SYSTEM,
      eventType: SystemLog.EVENT_TYPES.CONFIG_CHANGED,
      message: `Configuration deleted: ${key}`,
      context: {
        configKey: key,
        action: 'deleted',
        oldValue,
      },
      userId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
    })
  }

  /**
   * Restaure une configuration à partir de l'historique
   */
  async rollbackConfiguration(
    historyId: number,
    userId: number,
    options: {
      changeReason?: string
      clientIp?: string
      userAgent?: string
    } = {}
  ): Promise<SystemSetting> {
    const historyRecord = await ConfigurationHistory.find(historyId)

    if (!historyRecord) {
      throw new Exception('Configuration history record not found', { status: 404 })
    }

    const rollbackValue = historyRecord.oldValue

    if (rollbackValue === null) {
      throw new Exception('Cannot rollback to a null value', { status: 400 })
    }

    // Set configuration to previous value
    const setting = await this.setConfiguration(historyRecord.settingKey, rollbackValue, userId, {
      changeReason:
        options.changeReason ||
        `Rollback to version from ${historyRecord.createdAt.toFormat('dd/MM/yyyy HH:mm')}`,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
    })

    // Mark this change as a rollback in history
    await ConfigurationHistory.create({
      settingKey: historyRecord.settingKey,
      oldValue: historyRecord.newValue,
      newValue: rollbackValue,
      action: ConfigurationHistory.ACTIONS.ROLLBACK,
      changedBy: userId,
      changeReason: options.changeReason,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      isRollback: true,
      rollbackFromHistoryId: historyId,
    })

    // Log system event
    await this.logSystemEvent({
      level: SystemLog.LEVELS.INFO,
      category: SystemLog.CATEGORIES.SYSTEM,
      eventType: SystemLog.EVENT_TYPES.CONFIG_ROLLBACK,
      message: `Configuration rolled back: ${historyRecord.settingKey}`,
      context: {
        configKey: historyRecord.settingKey,
        rollbackFromHistoryId: historyId,
        rollbackValue,
      },
      userId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
    })

    return setting
  }

  /**
   * Récupère l'historique des modifications pour une configuration
   */
  async getConfigurationHistory(key: string, limit: number = 50): Promise<ConfigurationHistory[]> {
    return await ConfigurationHistory.query()
      .where('setting_key', key)
      .preload('changer', (query) => {
        query.select('id', 'username', 'fullName')
      })
      .preload('rollbackSource')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Récupère toutes les configurations critiques
   */
  async getCriticalConfigurations(): Promise<SystemSetting[]> {
    return await SystemSetting.query()
      .where('is_critical', true)
      .preload('updater')
      .orderBy('updated_at', 'desc')
  }

  /**
   * Vérifie si une configuration nécessite un redémarrage
   */
  async getConfigurationsRequiringRestart(): Promise<SystemSetting[]> {
    return await SystemSetting.query()
      .where('requires_restart', true)
      .preload('updater')
      .orderBy('updated_at', 'desc')
  }

  /**
   * Initialise les configurations par défaut
   */
  async initializeDefaultConfigurations(userId: number): Promise<void> {
    const defaultConfigs = [
      // General
      {
        key: 'app.name',
        value: 'W40K Scoring',
        category: SystemSetting.CATEGORIES.GENERAL,
        description: "Nom de l'application affiché aux utilisateurs",
        isCritical: false,
        requiresRestart: false,
      },
      {
        key: 'app.description',
        value: 'Application de gestion des scores Warhammer 40,000',
        category: SystemSetting.CATEGORIES.GENERAL,
        description: "Description de l'application",
        isCritical: false,
        requiresRestart: false,
      },
      {
        key: 'app.maintenance_mode',
        value: false,
        category: SystemSetting.CATEGORIES.GENERAL,
        description: "Active le mode maintenance (bloque l'accès aux utilisateurs)",
        isCritical: true,
        requiresRestart: false,
      },

      // Games
      {
        key: 'games.default_duration_minutes',
        value: 180,
        category: SystemSetting.CATEGORIES.GAMES,
        description: "Durée par défaut d'une partie en minutes",
        isCritical: false,
        requiresRestart: false,
      },
      {
        key: 'games.allowed_point_limits',
        value: [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000],
        category: SystemSetting.CATEGORIES.GAMES,
        description: 'Limites de points autorisées pour les parties',
        isCritical: false,
        requiresRestart: false,
      },

      // Users
      {
        key: 'users.registration_enabled',
        value: true,
        category: SystemSetting.CATEGORIES.USERS,
        description: 'Autorise les nouvelles inscriptions',
        isCritical: true,
        requiresRestart: false,
      },
      {
        key: 'users.email_verification_required',
        value: true,
        category: SystemSetting.CATEGORIES.USERS,
        description: 'Requiert la vérification email pour les nouveaux comptes',
        isCritical: false,
        requiresRestart: false,
      },

      // Security
      {
        key: 'security.session_timeout_minutes',
        value: 480,
        category: SystemSetting.CATEGORIES.SECURITY,
        description: "Durée de vie d'une session en minutes",
        isCritical: true,
        requiresRestart: true,
      },
      {
        key: 'security.max_login_attempts',
        value: 5,
        category: SystemSetting.CATEGORIES.SECURITY,
        description: 'Nombre maximum de tentatives de connexion',
        isCritical: true,
        requiresRestart: false,
      },

      // Performance
      {
        key: 'performance.cache_ttl_seconds',
        value: 3600,
        category: SystemSetting.CATEGORIES.PERFORMANCE,
        description: 'Durée de vie du cache en secondes',
        isCritical: false,
        requiresRestart: true,
      },
    ]

    for (const config of defaultConfigs) {
      const existing = await this.getConfiguration(config.key)
      if (!existing) {
        await this.setConfiguration(config.key, config.value, userId, {
          category: config.category,
          description: config.description,
          isCritical: config.isCritical,
          requiresRestart: config.requiresRestart,
          changeReason: 'Configuration par défaut initiale',
        })
      }
    }
  }

  /**
   * Journalise un changement de configuration
   */
  private async logConfigurationChange(data: {
    settingKey: string
    oldValue: any
    newValue: any
    action: string
    changedBy: number
    changeReason?: string
    clientIp?: string
    userAgent?: string
    isRollback?: boolean
    rollbackFromHistoryId?: number
  }): Promise<ConfigurationHistory> {
    return await ConfigurationHistory.create({
      settingKey: data.settingKey,
      oldValue: data.oldValue,
      newValue: data.newValue,
      action: data.action,
      changedBy: data.changedBy,
      changeReason: data.changeReason,
      clientIp: data.clientIp,
      userAgent: data.userAgent,
      isRollback: data.isRollback || false,
      rollbackFromHistoryId: data.rollbackFromHistoryId,
    })
  }

  /**
   * Journalise un événement système
   */
  private async logSystemEvent(data: {
    level: string
    category: string
    eventType: string
    message: string
    context?: any
    metadata?: any
    userId?: number
    sessionId?: string
    clientIp?: string
    userAgent?: string
    requestId?: string
    responseTimeMs?: number
    memoryUsageMb?: number
  }): Promise<SystemLog> {
    return await SystemLog.create({
      level: data.level,
      category: data.category,
      eventType: data.eventType,
      message: data.message,
      context: data.context,
      metadata: data.metadata,
      userId: data.userId,
      sessionId: data.sessionId,
      clientIp: data.clientIp,
      userAgent: data.userAgent,
      requestId: data.requestId,
      responseTimeMs: data.responseTimeMs,
      memoryUsageMb: data.memoryUsageMb,
    })
  }
}
