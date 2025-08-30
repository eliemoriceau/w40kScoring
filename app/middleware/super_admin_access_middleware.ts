import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'
import SystemLogService from '#application/services/system_log_service'
import SystemLog from '#models/system_log'

/**
 * Middleware pour vérifier l'accès super-admin
 * Seuls les utilisateurs avec le rôle ADMIN (level 3) peuvent accéder aux configurations système
 */
@inject()
export default class SuperAdminAccessMiddleware {
  constructor(protected systemLogService: SystemLogService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, response, session, request } = ctx

    // Vérifier que l'utilisateur est authentifié
    if (!auth.user) {
      await this.logUnauthorizedAccess(ctx, 'No authenticated user')
      return response.redirect().toRoute('auth.show_login')
    }

    // Vérifier que l'utilisateur a les permissions d'admin
    await auth.user.load('role')

    if (!auth.user.role || auth.user.role.level < 3) {
      await this.logUnauthorizedAccess(
        ctx,
        `Insufficient permissions (level: ${auth.user.role?.level || 0})`
      )

      session.flash(
        'error',
        'Accès refusé. Seuls les super-administrateurs peuvent accéder à cette section.'
      )
      return response.redirect().toRoute('admin.dashboard')
    }

    // Log successful super-admin access
    await this.systemLogService.logUserAction(
      auth.user.id,
      'SUPER_ADMIN_ACCESS',
      `Super-admin accessed: ${request.url()}`,
      {
        route: request.route?.pattern,
        method: request.method(),
        userAgent: request.header('user-agent'),
      },
      ctx.session.sessionId,
      request.ip(),
      request.header('user-agent')
    )

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }

  /**
   * Log unauthorized access attempts
   */
  private async logUnauthorizedAccess(ctx: HttpContext, reason: string): Promise<void> {
    const { auth, request } = ctx

    await this.systemLogService.logSecurityEvent(
      'UNAUTHORIZED_SUPER_ADMIN_ACCESS',
      `Unauthorized super-admin access attempt: ${reason}`,
      SystemLog.LEVELS.WARNING,
      {
        route: request.route?.pattern,
        method: request.method(),
        url: request.url(),
        reason,
      },
      auth.user?.id,
      ctx.session?.sessionId,
      request.ip(),
      request.header('user-agent')
    )
  }
}
