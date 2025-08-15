import { SecurityLogger } from '../../../application/auth/services/secure_user_authentication_service.js'

/**
 * Implémentation du logger de sécurité avec Winston
 * Gère les logs de sécurité selon les niveaux appropriés
 */
export class WinstonSecurityLogger implements SecurityLogger {
  private logger: any

  constructor() {
    // Configuration simplifiée pour l'instant, peut être étendue avec Winston
    this.logger = {
      info: this.createLogFunction('INFO'),
      warn: this.createLogFunction('WARN'),
      error: this.createLogFunction('ERROR'),
      debug: this.createLogFunction('DEBUG'),
    }
  }

  info(message: string, meta: Record<string, any>): void {
    this.logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'auth-security',
    })
  }

  warn(message: string, meta: Record<string, any>): void {
    this.logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'auth-security',
    })
  }

  error(message: string, meta: Record<string, any>): void {
    this.logger.error(message, {
      ...meta,
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'auth-security',
    })
  }

  debug(message: string, meta: Record<string, any>): void {
    // Debug logs only in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(message, {
        ...meta,
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        service: 'auth-security',
      })
    }
  }

  /**
   * Crée une fonction de log avec formatage pour console/fichier
   */
  private createLogFunction(level: string) {
    return (message: string, meta: Record<string, any>) => {
      // Pour l'instant, utiliser console.log avec formatage JSON
      // Dans une implémentation complète, on utiliserait Winston avec fichiers
      if (level === 'ERROR') {
        console.error(`🔒 [${level}] ${message}`, JSON.stringify(meta, null, 2))
      } else if (level === 'WARN') {
        console.warn(`⚠️ [${level}] ${message}`, JSON.stringify(meta, null, 2))
      } else if (level === 'INFO') {
        console.info(`ℹ️ [${level}] ${message}`, JSON.stringify(meta, null, 2))
      } else if (level === 'DEBUG' && process.env.NODE_ENV === 'development') {
        console.debug(`🐛 [${level}] ${message}`, JSON.stringify(meta, null, 2))
      }
    }
  }
}
