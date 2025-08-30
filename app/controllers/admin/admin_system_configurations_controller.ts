import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import SystemConfigurationService from '#application/services/system_configuration_service'
import SystemLogService from '#application/services/system_log_service'
import SystemSetting from '#models/system_setting'
import vine from '@vinejs/vine'

/**
 * Contrôleur pour la gestion de la configuration système
 * Interface admin réservée aux super-administrateurs
 */
@inject()
export default class AdminSystemConfigurationsController {
  constructor(
    private systemConfigurationService: SystemConfigurationService,
    private systemLogService: SystemLogService
  ) {}

  /**
   * Page principale de configuration système
   */
  async index({ inertia, auth }: HttpContext) {
    try {
      const [configurations, criticalConfigs, restartRequired] = await Promise.all([
        this.systemConfigurationService.getConfigurationsByCategory(),
        this.systemConfigurationService.getCriticalConfigurations(),
        this.systemConfigurationService.getConfigurationsRequiringRestart(),
      ])

      return inertia.render('admin/system/configuration/Index', {
        configurations,
        criticalConfigurations: criticalConfigs,
        configurationsRequiringRestart: restartRequired,
        user: {
          id: auth.user!.id,
          username: auth.user!.username,
          fullName: auth.user!.fullName,
        },
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to load system configuration page',
        error,
        { controller: 'AdminSystemConfigurationsController', action: 'index' },
        auth.user?.id
      )
      throw error
    }
  }

  /**
   * Récupère une configuration spécifique
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const configuration = await this.systemConfigurationService.getConfiguration(params.key)

      if (!configuration) {
        return response.status(404).json({
          message: 'Configuration not found',
        })
      }

      const history = await this.systemConfigurationService.getConfigurationHistory(params.key, 20)

      return response.json({
        configuration,
        history,
      })
    } catch (error) {
      await this.systemLogService.logError(
        `Failed to get configuration: ${params.key}`,
        error,
        { controller: 'AdminSystemConfigurationsController', action: 'show', key: params.key },
        auth.user?.id
      )

      return response.status(500).json({
        message: 'Failed to retrieve configuration',
      })
    }
  }

  /**
   * Met à jour une configuration
   */
  async update({ params, request, response, auth, session }: HttpContext) {
    try {
      const updateValidator = vine.compile(
        vine.object({
          value: vine.any().optional(),
          description: vine.string().maxLength(500).optional(),
          is_critical: vine.boolean().optional(),
          requires_restart: vine.boolean().optional(),
          change_reason: vine.string().maxLength(500).optional(),
        })
      )

      const payload = await request.validateUsing(updateValidator)

      const configuration = await this.systemConfigurationService.setConfiguration(
        params.key,
        payload.value,
        auth.user!.id,
        {
          description: payload.description,
          isCritical: payload.is_critical,
          requiresRestart: payload.requires_restart,
          changeReason: payload.change_reason,
          clientIp: request.ip(),
          userAgent: request.header('user-agent'),
        }
      )

      session.flash('success', `Configuration "${params.key}" mise à jour avec succès`)

      return response.json({
        message: 'Configuration updated successfully',
        configuration,
      })
    } catch (error) {
      await this.systemLogService.logError(
        `Failed to update configuration: ${params.key}`,
        error,
        {
          controller: 'AdminSystemConfigurationsController',
          action: 'update',
          key: params.key,
          payload: request.all(),
        },
        auth.user?.id
      )

      session.flash('error', 'Erreur lors de la mise à jour de la configuration')

      return response.status(500).json({
        message: 'Failed to update configuration',
        error: error.message,
      })
    }
  }

  /**
   * Crée une nouvelle configuration
   */
  async store({ request, response, auth, session }: HttpContext) {
    try {
      const createValidator = vine.compile(
        vine.object({
          key: vine.string().maxLength(100),
          value: vine.any(),
          category: vine.string().maxLength(50),
          description: vine.string().maxLength(500).optional(),
          is_critical: vine.boolean().optional(),
          requires_restart: vine.boolean().optional(),
          change_reason: vine.string().maxLength(500).optional(),
        })
      )

      const payload = await request.validateUsing(createValidator)

      // Check if configuration already exists
      const existingConfig = await this.systemConfigurationService.getConfiguration(payload.key)
      if (existingConfig) {
        session.flash('error', `Configuration "${payload.key}" existe déjà`)
        return response.status(409).json({
          message: 'Configuration already exists',
        })
      }

      const configuration = await this.systemConfigurationService.setConfiguration(
        payload.key,
        payload.value,
        auth.user!.id,
        {
          category: payload.category,
          description: payload.description,
          isCritical: payload.is_critical || false,
          requiresRestart: payload.requires_restart || false,
          changeReason: payload.change_reason || 'Nouvelle configuration créée',
          clientIp: request.ip(),
          userAgent: request.header('user-agent'),
        }
      )

      session.flash('success', `Configuration "${payload.key}" créée avec succès`)

      return response.status(201).json({
        message: 'Configuration created successfully',
        configuration,
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to create configuration',
        error,
        {
          controller: 'AdminSystemConfigurationsController',
          action: 'store',
          payload: request.all(),
        },
        auth.user?.id
      )

      session.flash('error', 'Erreur lors de la création de la configuration')

      return response.status(500).json({
        message: 'Failed to create configuration',
        error: error.message,
      })
    }
  }

  /**
   * Supprime une configuration
   */
  async destroy({ params, request, response, auth, session }: HttpContext) {
    try {
      const deleteValidator = vine.compile(
        vine.object({
          change_reason: vine.string().maxLength(500).optional(),
          confirm: vine.boolean(),
        })
      )

      const payload = await request.validateUsing(deleteValidator)

      if (!payload.confirm) {
        return response.status(400).json({
          message: 'Confirmation required for deletion',
        })
      }

      await this.systemConfigurationService.deleteConfiguration(params.key, auth.user!.id, {
        changeReason: payload.change_reason || "Configuration supprimée par l'administrateur",
        clientIp: request.ip(),
        userAgent: request.header('user-agent'),
      })

      session.flash('success', `Configuration "${params.key}" supprimée avec succès`)

      return response.json({
        message: 'Configuration deleted successfully',
      })
    } catch (error) {
      if (error.status === 404) {
        session.flash('error', 'Configuration non trouvée')
        return response.status(404).json({
          message: 'Configuration not found',
        })
      }

      await this.systemLogService.logError(
        `Failed to delete configuration: ${params.key}`,
        error,
        {
          controller: 'AdminSystemConfigurationsController',
          action: 'destroy',
          key: params.key,
        },
        auth.user?.id
      )

      session.flash('error', 'Erreur lors de la suppression de la configuration')

      return response.status(500).json({
        message: 'Failed to delete configuration',
        error: error.message,
      })
    }
  }

  /**
   * Restaure une configuration à partir de l'historique
   */
  async rollback({ params, request, response, auth, session }: HttpContext) {
    try {
      const rollbackValidator = vine.compile(
        vine.object({
          history_id: vine.number(),
          change_reason: vine.string().maxLength(500).optional(),
          confirm: vine.boolean(),
        })
      )

      const payload = await request.validateUsing(rollbackValidator)

      if (!payload.confirm) {
        return response.status(400).json({
          message: 'Confirmation required for rollback',
        })
      }

      const configuration = await this.systemConfigurationService.rollbackConfiguration(
        payload.history_id,
        auth.user!.id,
        {
          changeReason: payload.change_reason,
          clientIp: request.ip(),
          userAgent: request.header('user-agent'),
        }
      )

      session.flash('success', `Configuration "${params.key}" restaurée avec succès`)

      return response.json({
        message: 'Configuration rolled back successfully',
        configuration,
      })
    } catch (error) {
      if (error.status === 404) {
        session.flash('error', 'Historique de configuration non trouvé')
        return response.status(404).json({
          message: 'Configuration history not found',
        })
      }

      if (error.status === 400) {
        session.flash('error', error.message)
        return response.status(400).json({
          message: error.message,
        })
      }

      await this.systemLogService.logError(
        `Failed to rollback configuration: ${params.key}`,
        error,
        {
          controller: 'AdminSystemConfigurationsController',
          action: 'rollback',
          key: params.key,
          historyId: payload.history_id,
        },
        auth.user?.id
      )

      session.flash('error', 'Erreur lors de la restauration de la configuration')

      return response.status(500).json({
        message: 'Failed to rollback configuration',
        error: error.message,
      })
    }
  }

  /**
   * Initialise les configurations par défaut
   */
  async initDefaults({ request, response, auth, session }: HttpContext) {
    try {
      const initValidator = vine.compile(
        vine.object({
          confirm: vine.boolean(),
        })
      )

      const payload = await request.validateUsing(initValidator)

      if (!payload.confirm) {
        return response.status(400).json({
          message: 'Confirmation required for initialization',
        })
      }

      await this.systemConfigurationService.initializeDefaultConfigurations(auth.user!.id)

      session.flash('success', 'Configurations par défaut initialisées avec succès')

      return response.json({
        message: 'Default configurations initialized successfully',
      })
    } catch (error) {
      await this.systemLogService.logError(
        'Failed to initialize default configurations',
        error,
        { controller: 'AdminSystemConfigurationsController', action: 'initDefaults' },
        auth.user?.id
      )

      session.flash('error', "Erreur lors de l'initialisation des configurations par défaut")

      return response.status(500).json({
        message: 'Failed to initialize default configurations',
        error: error.message,
      })
    }
  }
}
