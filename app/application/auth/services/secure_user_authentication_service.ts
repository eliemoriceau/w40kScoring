import { createHash } from 'node:crypto'
import { LoginUserCommand } from '../commands/login_user_command.js'
import { LoginResponseDto } from '../dto/login_response_dto.js'
import { UserAuthenticationService } from '../../../domain/security/services/user_authentication_service.js'
import { RateLimiterService } from '../../../domain/security/services/rate_limiter_service.js'
import { LoginCredentials } from '../../../domain/security/value_objects/login_credentials.js'
import { IpAddress } from '../../../domain/security/value_objects/ip_address.js'
import { LoginAttempt } from '../../../domain/security/value_objects/login_attempt.js'
import { UserLoggedInEvent } from '../../../domain/security/events/user_logged_in_event.js'
import { LoginAttemptRepositoryInterface } from '../../../domain/security/repositories/login_attempt_repository_interface.js'

/**
 * Interface pour le logger de sécurité
 */
export interface SecurityLogger {
  info(message: string, meta: Record<string, any>): void
  warn(message: string, meta: Record<string, any>): void
  error(message: string, meta: Record<string, any>): void
  debug(message: string, meta: Record<string, any>): void
}

/**
 * Service applicatif pour l'authentification sécurisée des utilisateurs
 * Orchestre la logique de sécurité, le rate limiting et l'authentification
 */
export class SecureUserAuthenticationService {
  constructor(
    private readonly authService: UserAuthenticationService,
    private readonly rateLimiter: RateLimiterService,
    private readonly attemptRepository: LoginAttemptRepositoryInterface,
    private readonly securityLogger: SecurityLogger
  ) {}

  /**
   * Authentifie un utilisateur avec toutes les protections de sécurité
   */
  async login(command: LoginUserCommand): Promise<LoginResponseDto> {
    const ipAddress = IpAddress.create(command.ipAddress)

    this.securityLogger.debug('Authentication attempt started', {
      loginMethod: command.getLoginMethod(),
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      rememberMe: command.rememberMe,
    })

    // 1. Vérification du rate limiting par IP
    const ipResult = await this.rateLimiter.checkIpRateLimit(ipAddress)
    if (!ipResult.isAllowed()) {
      this.securityLogger.warn('IP rate limit exceeded', {
        ipAddress: command.ipAddress,
        retryAfter: ipResult.getRetryAfter(),
        reason: ipResult.getReason(),
      })

      await this.trackFailedAttempt(command, 'IP_RATE_LIMITED')
      return LoginResponseDto.rateLimited(ipResult.getRetryAfter())
    }

    // 2. Vérification du rate limiting par identifiant
    const identifierResult = await this.rateLimiter.checkIdentifierRateLimit(command.login)
    if (!identifierResult.isAllowed()) {
      this.securityLogger.error('Account locked due to failed attempts', {
        identifierHash: this.hashIdentifier(command.login),
        lockDuration: identifierResult.getRetryAfter(),
        ipAddress: command.ipAddress,
      })

      await this.trackFailedAttempt(command, 'ACCOUNT_LOCKED')
      return LoginResponseDto.accountLocked(identifierResult.getRetryAfter())
    }

    // 3. Tentative d'authentification
    const credentials = LoginCredentials.create(command.login, command.password)
    const user = await this.authService.authenticate(credentials)

    if (!user) {
      // Échec d'authentification
      this.securityLogger.warn('Authentication failed', {
        identifierHash: this.hashIdentifier(command.login),
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        loginMethod: command.getLoginMethod(),
        reason: 'INVALID_CREDENTIALS',
      })

      await this.trackFailedAttempt(command, 'INVALID_CREDENTIALS')
      return LoginResponseDto.failure('Invalid credentials')
    }

    // 4. Succès - enregistrer la tentative et émettre l'event
    await this.trackSuccessfulAttempt(command, user.getId())

    this.securityLogger.info('Authentication successful', {
      userId: user.getId().getValue(),
      username: user.getUsername().getValue(),
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      loginMethod: command.getLoginMethod(),
      rememberMe: command.rememberMe,
      deviceId: command.deviceId,
    })

    // Émettre l'event de connexion réussie
    const loginEvent = new UserLoggedInEvent(
      user.getId(),
      command.getLoginMethod(),
      ipAddress,
      command.userAgent,
      command.rememberMe,
      command.deviceId
    )

    // Note: Dans une implémentation complète, on utiliserait un event dispatcher
    this.securityLogger.debug('User login event emitted', loginEvent.getEventData())

    return LoginResponseDto.success(user.getId(), user.getUsername())
  }

  /**
   * Enregistre une tentative échouée
   */
  private async trackFailedAttempt(command: LoginUserCommand, reason: string): Promise<void> {
    const attempt = LoginAttempt.create(
      command.login,
      IpAddress.create(command.ipAddress),
      command.userAgent,
      false, // échec
      null, // pas d'user ID
      reason,
      command.deviceId
    )

    await this.attemptRepository.save(attempt)
  }

  /**
   * Enregistre une tentative réussie
   */
  private async trackSuccessfulAttempt(command: LoginUserCommand, userId: any): Promise<void> {
    const attempt = LoginAttempt.create(
      command.login,
      IpAddress.create(command.ipAddress),
      command.userAgent,
      true, // succès
      userId,
      null, // pas de raison d'échec
      command.deviceId
    )

    await this.attemptRepository.save(attempt)
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
