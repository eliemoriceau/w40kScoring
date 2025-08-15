import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * Middleware de rate limiting pour les requêtes de login
 * Implémente une limite de 5 tentatives par IP par période de 15 minutes
 */
export default class RateLimitMiddleware {
  private static attempts: Map<string, { count: number; resetTime: DateTime }> = new Map()

  async handle(ctx: HttpContext, next: NextFn) {
    // Appliquer uniquement sur les routes de login
    if (ctx.request.url() === '/login' && ctx.request.method() === 'POST') {
      const clientIp = ctx.request.ip()
      const now = DateTime.now()

      // Nettoyer les entrées expirées
      this.cleanExpiredEntries()

      const attemptRecord = RateLimitMiddleware.attempts.get(clientIp)

      if (attemptRecord) {
        if (attemptRecord.count >= 5 && now < attemptRecord.resetTime) {
          const retryAfter = attemptRecord.resetTime.diff(now, 'seconds').seconds

          ctx.response.status(429)
          ctx.response.header('Retry-After', Math.ceil(retryAfter).toString())

          return ctx.response.json({
            error: 'Too many login attempts',
            message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
            retryAfter: Math.ceil(retryAfter),
          })
        }

        if (now >= attemptRecord.resetTime) {
          // Reset le compteur après la période
          RateLimitMiddleware.attempts.set(clientIp, {
            count: 1,
            resetTime: now.plus({ minutes: 15 }),
          })
        } else {
          // Incrémenter le compteur
          attemptRecord.count++
        }
      } else {
        // Première tentative pour cette IP
        RateLimitMiddleware.attempts.set(clientIp, {
          count: 1,
          resetTime: now.plus({ minutes: 15 }),
        })
      }
    }

    const output = await next()
    return output
  }

  private cleanExpiredEntries(): void {
    const now = DateTime.now()
    for (const [ip, record] of RateLimitMiddleware.attempts.entries()) {
      if (now >= record.resetTime) {
        RateLimitMiddleware.attempts.delete(ip)
      }
    }
  }
}
