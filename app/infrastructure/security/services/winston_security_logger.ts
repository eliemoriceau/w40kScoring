import logger from '@adonisjs/core/services/logger'
import { SecurityLogger } from '../../../application/auth/services/secure_user_authentication_service.js'

/**
 * Implémentation du logger de sécurité avec AdonisJS Logger
 * Gère les logs de sécurité selon les niveaux appropriés
 */
export class WinstonSecurityLogger implements SecurityLogger {
  constructor() {
    // Utilise le logger AdonisJS configuré
  }

  info(message: string, meta: Record<string, any>): void {
    logger.info(
      {
        ...meta,
        component: 'SECURITY',
      },
      message
    )
  }

  warn(message: string, meta: Record<string, any>): void {
    logger.warn(
      {
        ...meta,
        component: 'SECURITY',
      },
      message
    )
  }

  error(message: string, meta: Record<string, any>): void {
    logger.error(
      {
        ...meta,
        component: 'SECURITY',
      },
      message
    )
  }

  debug(message: string, meta: Record<string, any>): void {
    logger.debug(
      {
        ...meta,
        component: 'SECURITY',
      },
      message
    )
  }
}
