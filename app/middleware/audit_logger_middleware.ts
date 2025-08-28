import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AdminActionLog from '#models/admin_action_log'

/**
 * Middleware d'audit pour les actions administrateur
 * Log automatiquement toutes les actions effectuées dans l'interface admin
 */
export default class AuditLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    const method = ctx.request.method()
    const url = ctx.request.url()

    // Ne logger que les actions de modification (POST, PUT, DELETE)
    const shouldLog = ['POST', 'PUT', 'DELETE'].includes(method) && user

    let requestData: any = null
    if (shouldLog) {
      // Capturer les données de la requête (sans les mots de passe)
      requestData = {
        ...ctx.request.only(['id', 'name', 'email', 'roleId', 'status']),
        params: ctx.request.params(),
      }

      // Supprimer les champs sensibles
      delete requestData.password
      delete requestData.password_confirmation
    }

    await next()

    // Logger l'action après l'exécution de la route
    if (shouldLog && user && ctx.response.getStatus() < 400) {
      try {
        // Extraire les informations sur l'action
        const urlParts = url.split('/')
        const action = this.determineAction(method, urlParts)
        const targetType = this.determineTargetType(urlParts)
        const targetId = this.extractTargetId(urlParts, ctx.request.params())

        await AdminActionLog.create({
          adminId: user.id,
          action: action,
          targetType: targetType,
          targetId: targetId,
          oldValue: null, // Sera implémenté plus tard pour capturer l'état avant modification
          newValue: JSON.stringify(requestData),
          ipAddress: ctx.request.ip(),
          userAgent: ctx.request.header('User-Agent') || '',
        })
      } catch (error) {
        // Ne pas faire échouer la requête si le logging échoue
        console.error("Erreur lors du logging de l'action admin:", error)
      }
    }
  }

  /**
   * Détermine le type d'action basé sur la méthode HTTP et l'URL
   */
  private determineAction(method: string, urlParts: string[]): string {
    const resource = urlParts[2] // /admin/users/123 -> users

    switch (method) {
      case 'POST':
        return `${resource}.create`
      case 'PUT':
        if (urlParts.includes('ban')) return `${resource}.ban`
        if (urlParts.includes('unban')) return `${resource}.unban`
        return `${resource}.update`
      case 'DELETE':
        return `${resource}.delete`
      default:
        return `${resource}.${method.toLowerCase()}`
    }
  }

  /**
   * Détermine le type de cible basé sur l'URL
   */
  private determineTargetType(urlParts: string[]): string {
    if (urlParts.includes('users')) return 'user'
    if (urlParts.includes('parties')) return 'party'
    if (urlParts.includes('system')) return 'system'
    return 'unknown'
  }

  /**
   * Extrait l'ID de la cible depuis l'URL
   */
  private extractTargetId(urlParts: string[], params: any): number | null {
    // Chercher un ID numérique dans l'URL
    for (const part of urlParts) {
      const id = Number.parseInt(part, 10)
      if (!Number.isNaN(id)) {
        return id
      }
    }

    // Chercher dans les paramètres
    if (params.id) {
      const id = Number.parseInt(params.id, 10)
      return !Number.isNaN(id) ? id : null
    }

    return null
  }
}
