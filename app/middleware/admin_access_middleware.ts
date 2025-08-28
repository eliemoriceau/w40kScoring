import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware de contrôle d'accès pour les routes administrateur
 * Vérifie que l'utilisateur connecté a les permissions d'administrateur (level 3)
 */
export default class AdminAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    // Vérifier que l'utilisateur est connecté
    if (!user) {
      return ctx.response.redirect('/login?redirect=' + encodeURIComponent(ctx.request.url()))
    }

    // Charger la relation role si elle n'est pas déjà chargée
    if (!user.role) {
      await user.load('role')
    }

    // Vérifier que l'utilisateur a les permissions d'administrateur (level 3)
    if (!user.role || user.role.permissionLevel < 3) {
      ctx.session.flash('error', 'Accès administrateur requis')
      return ctx.response.redirect('/')
    }

    await next()
  }
}
