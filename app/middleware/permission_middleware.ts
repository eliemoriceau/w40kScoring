import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PermissionService from '#services/permission_service'
import type { PermissionResource, PermissionAction } from '#models/permission'

/**
 * Middleware de contrôle des permissions granulaires
 * Vérifie que l'utilisateur connecté a les permissions spécifiques requises
 */
export default class PermissionMiddleware {
  private permissionService = new PermissionService()

  /**
   * Vérifie si l'utilisateur a la permission requise
   * Usage: .middleware([middleware.permission('users:read')])
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      permission?: string
      resource?: PermissionResource
      action?: PermissionAction
      resourceIdParam?: string
    } = {}
  ) {
    const user = ctx.auth.user

    // Vérifier que l'utilisateur est connecté
    if (!user) {
      return ctx.response.redirect('/login?redirect=' + encodeURIComponent(ctx.request.url()))
    }

    // Charger la relation role si elle n'est pas déjà chargée
    if (!user.role) {
      await user.load('role')
    }

    let resource: PermissionResource
    let action: PermissionAction

    // Parser la permission depuis le format "resource:action"
    if (options.permission) {
      const [res, act] = options.permission.split(':')
      resource = res as PermissionResource
      action = act as PermissionAction
    } else if (options.resource && options.action) {
      resource = options.resource
      action = options.action
    } else {
      throw new Error('Permission ou resource/action doit être spécifiée')
    }

    // Extraire l'ID de la ressource depuis les paramètres si spécifié
    let resourceId: number | undefined
    if (options.resourceIdParam) {
      const paramValue = ctx.params[options.resourceIdParam]
      resourceId = paramValue ? Number.parseInt(paramValue, 10) : undefined
    }

    // Vérifier la permission
    const hasPermission = await this.permissionService.userCanPerform(
      user.id,
      resource,
      action,
      resourceId
    )

    if (!hasPermission) {
      if (ctx.request.accepts(['html', 'json']) === 'json') {
        return ctx.response.status(403).json({
          error: 'Permission insuffisante',
          required: `${resource}:${action}`,
        })
      } else {
        ctx.session.flash('error', `Permission insuffisante pour ${resource}:${action}`)
        return ctx.response.redirect('/admin')
      }
    }

    await next()
  }

  /**
   * Factory method pour créer un middleware avec une permission spécifique
   */
  static require(permission: string) {
    return async (ctx: HttpContext, next: NextFn) => {
      const middleware = new PermissionMiddleware()
      return middleware.handle(ctx, next, { permission })
    }
  }

  /**
   * Factory method pour créer un middleware avec resource/action
   */
  static check(resource: PermissionResource, action: PermissionAction, resourceIdParam?: string) {
    return async (ctx: HttpContext, next: NextFn) => {
      const middleware = new PermissionMiddleware()
      return middleware.handle(ctx, next, { resource, action, resourceIdParam })
    }
  }

  /**
   * Middleware pour les routes de lecture (lecture seule)
   */
  static read(resource: PermissionResource) {
    return PermissionMiddleware.check(resource, 'read')
  }

  /**
   * Middleware pour les routes de création
   */
  static create(resource: PermissionResource) {
    return PermissionMiddleware.check(resource, 'create')
  }

  /**
   * Middleware pour les routes de modification
   */
  static update(resource: PermissionResource, resourceIdParam = 'id') {
    return PermissionMiddleware.check(resource, 'update', resourceIdParam)
  }

  /**
   * Middleware pour les routes de suppression
   */
  static delete(resource: PermissionResource, resourceIdParam = 'id') {
    return PermissionMiddleware.check(resource, 'delete', resourceIdParam)
  }

  /**
   * Middleware pour les routes de gestion complète
   */
  static manage(resource: PermissionResource) {
    return PermissionMiddleware.check(resource, 'manage')
  }
}
