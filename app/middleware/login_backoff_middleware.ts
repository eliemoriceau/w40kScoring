import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * Middleware de backoff progressif pour les tentatives de login échouées
 * Implémente un délai progressif: 500ms * 2^failures (max 2s)
 */
export default class LoginBackoffMiddleware {
  private static failureCountByIp: Map<string, { count: number; lastFailure: DateTime }> = new Map()

  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.request.url() === '/login' && ctx.request.method() === 'POST') {
      const clientIp = ctx.request.ip()

      // Nettoyer les anciennes entrées (plus de 15 minutes)
      this.cleanOldEntries()

      const failureRecord = LoginBackoffMiddleware.failureCountByIp.get(clientIp)

      if (failureRecord && failureRecord.count > 0) {
        // Calculer le délai de backoff: 500ms * 2^(failures-1), max 2s
        const delay = Math.min(500 * Math.pow(2, failureRecord.count - 1), 2000)

        // Attendre avant de continuer
        await this.sleep(delay)
      }
    }

    const output = await next()

    // Après la requête, mettre à jour les compteurs d'échecs si nécessaire
    if (ctx.request.url() === '/login' && ctx.request.method() === 'POST') {
      await this.updateFailureCount(ctx)
    }

    return output
  }

  private async updateFailureCount(ctx: HttpContext): Promise<void> {
    const clientIp = ctx.request.ip()
    const now = DateTime.now()

    // Accéder au status via ctx.response.getStatus() ou vérifier les propriétés
    const responseStatus = ctx.response.getStatus?.() || (ctx.response as any).statusCode

    if (responseStatus === 422 || responseStatus === 401) {
      // Échec d'authentification
      const currentRecord = LoginBackoffMiddleware.failureCountByIp.get(clientIp)

      if (currentRecord) {
        currentRecord.count++
        currentRecord.lastFailure = now
      } else {
        LoginBackoffMiddleware.failureCountByIp.set(clientIp, {
          count: 1,
          lastFailure: now,
        })
      }
    } else if (responseStatus >= 200 && responseStatus < 300) {
      // Succès - reset le compteur
      LoginBackoffMiddleware.failureCountByIp.delete(clientIp)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private cleanOldEntries(): void {
    const now = DateTime.now()
    const cutoff = now.minus({ minutes: 15 })

    for (const [ip, record] of LoginBackoffMiddleware.failureCountByIp.entries()) {
      if (record.lastFailure < cutoff) {
        LoginBackoffMiddleware.failureCountByIp.delete(ip)
      }
    }
  }
}
