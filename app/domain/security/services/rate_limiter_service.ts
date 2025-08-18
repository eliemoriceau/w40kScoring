import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import { IpAddress } from '../value_objects/ip_address.js'
import { LoginAttemptRepositoryInterface } from '../repositories/login_attempt_repository_interface.js'
import { AccountLockRepositoryInterface } from '../repositories/account_lock_repository_interface.js'
import { BruteForceDetectedEvent } from '../events/brute_force_detected_event.js'

/**
 * Résultat d'une vérification de rate limiting
 */
export class RateLimitResult {
  constructor(
    private readonly allowed: boolean,
    private readonly reason: string | null = null,
    private readonly retryAfter: number = 0 // secondes
  ) {}

  static allowed(): RateLimitResult {
    return new RateLimitResult(true)
  }

  static exceeded(reason: string, retryAfter: number): RateLimitResult {
    return new RateLimitResult(false, reason, retryAfter)
  }

  static accountLocked(retryAfter: number): RateLimitResult {
    return new RateLimitResult(false, 'ACCOUNT_LOCKED', retryAfter)
  }

  isAllowed(): boolean {
    return this.allowed
  }

  getReason(): string | null {
    return this.reason
  }

  getRetryAfter(): number {
    return this.retryAfter
  }
}

/**
 * Service domaine pour la gestion du rate limiting et de la protection anti-brute force
 */
export class RateLimiterService {
  constructor(
    private readonly attemptRepository: LoginAttemptRepositoryInterface,
    private readonly lockRepository: AccountLockRepositoryInterface
  ) {}

  /**
   * Vérifie les limites de taux pour une adresse IP
   * Règle: 5 tentatives maximum par période de 15 minutes
   */
  async checkIpRateLimit(ipAddress: IpAddress): Promise<RateLimitResult> {
    const fifteenMinutesAgo = DateTime.now().minus({ minutes: 15 })
    const recentAttempts = await this.attemptRepository.countByIpSince(ipAddress, fifteenMinutesAgo)

    if (recentAttempts >= 5) {
      // Détecter une potentielle attaque brute force
      await this.detectBruteForce(ipAddress, recentAttempts)

      return RateLimitResult.exceeded('IP_RATE_LIMIT', 15 * 60) // 15 minutes
    }

    return RateLimitResult.allowed()
  }

  /**
   * Vérifie les limites de taux pour un identifiant spécifique
   * Règle: 10 échecs maximum par période de 24 heures → verrouillage 15 minutes
   */
  async checkIdentifierRateLimit(identifier: string): Promise<RateLimitResult> {
    const identifierHash = this.hashIdentifier(identifier)

    // Vérifier d'abord si le compte est déjà verrouillé
    const existingLock = await this.lockRepository.findActiveLockByIdentifier(identifierHash)
    if (existingLock) {
      return RateLimitResult.accountLocked(existingLock.remainingSeconds)
    }

    // Compter les échecs récents (24h)
    const twentyFourHoursAgo = DateTime.now().minus({ hours: 24 })
    const recentFailures = await this.attemptRepository.countFailuresByIdentifierSince(
      identifierHash,
      twentyFourHoursAgo
    )

    if (recentFailures >= 10) {
      // Verrouiller le compte pour 15 minutes
      const lockDuration = 15 * 60 // 15 minutes en secondes
      const lockedUntil = DateTime.now().plus({ seconds: lockDuration })

      await this.lockRepository.lockAccount(
        null, // Pas d'user ID à ce stade
        identifierHash,
        'EXCESSIVE_FAILED_ATTEMPTS',
        lockedUntil,
        IpAddress.create('system') // IP système pour le verrouillage automatique
      )

      // Émettre l'event de verrouillage
      // Note: Dans une implémentation complète, on utiliserait un event dispatcher

      return RateLimitResult.accountLocked(lockDuration)
    }

    return RateLimitResult.allowed()
  }

  /**
   * Détecte les attaques brute force basées sur les patterns d'IP
   */
  private async detectBruteForce(ipAddress: IpAddress, attemptCount: number): Promise<void> {
    const fifteenMinutesAgo = DateTime.now().minus({ minutes: 15 })
    const recentAttempts = await this.attemptRepository.findRecentByIp(ipAddress, fifteenMinutesAgo)

    // Analyser les identifiants ciblés
    const targetIdentifiers = [
      ...new Set(recentAttempts.map((attempt) => attempt.getIdentifierHash())),
    ]

    // Déterminer la sévérité
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (attemptCount >= 20) severity = 'critical'
    else if (attemptCount >= 15) severity = 'high'
    else if (attemptCount >= 10) severity = 'medium'

    // Émettre l'event de détection de brute force
    const event = new BruteForceDetectedEvent(
      ipAddress,
      attemptCount,
      '15min',
      targetIdentifiers,
      severity
    )

    // Note: Dans une implémentation complète, on utiliserait un event dispatcher
    logger.warn('🚨 Brute force detected', event.getEventData())
  }

  /**
   * Hash un identifiant pour l'anonymisation dans les logs
   */
  private hashIdentifier(identifier: string): string {
    const salt = process.env.IDENTIFIER_SALT || 'default-salt-change-in-production'

    return createHash('sha256')
      .update(identifier + salt)
      .digest('hex')
  }
}
