import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import { IpAddress } from './ip_address.js'
import { UserId } from '../../user/value_objects/user_id.js'

/**
 * Value Object pour une tentative de login
 * Encapsule toutes les informations d'une tentative d'authentification
 */
export class LoginAttempt {
  private constructor(
    private readonly identifierHash: string,
    private readonly ipAddress: IpAddress,
    private readonly userAgent: string | null,
    private readonly success: boolean,
    private readonly userId: UserId | null,
    private readonly failureReason: string | null,
    private readonly deviceId: string | null,
    private readonly attemptedAt: DateTime
  ) {}

  static create(
    identifier: string,
    ipAddress: IpAddress,
    userAgent: string | null,
    success: boolean,
    userId: UserId | null = null,
    failureReason: string | null = null,
    deviceId: string | null = null
  ): LoginAttempt {
    const identifierHash = this.hashIdentifier(identifier)
    const attemptedAt = DateTime.now()

    return new LoginAttempt(
      identifierHash,
      ipAddress,
      userAgent,
      success,
      userId,
      failureReason,
      deviceId,
      attemptedAt
    )
  }

  static reconstitute(
    identifierHash: string,
    ipAddress: IpAddress,
    userAgent: string | null,
    success: boolean,
    userId: UserId | null,
    failureReason: string | null,
    deviceId: string | null,
    attemptedAt: DateTime
  ): LoginAttempt {
    return new LoginAttempt(
      identifierHash,
      ipAddress,
      userAgent,
      success,
      userId,
      failureReason,
      deviceId,
      attemptedAt
    )
  }

  getIdentifierHash(): string {
    return this.identifierHash
  }

  getIpAddress(): IpAddress {
    return this.ipAddress
  }

  getUserAgent(): string | null {
    return this.userAgent
  }

  isSuccess(): boolean {
    return this.success
  }

  getUserId(): UserId | null {
    return this.userId
  }

  getFailureReason(): string | null {
    return this.failureReason
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  getAttemptedAt(): DateTime {
    return this.attemptedAt
  }

  private static hashIdentifier(identifier: string): string {
    // Utilise un salt d'environnement pour sécuriser le hash
    const salt = process.env.IDENTIFIER_SALT || 'default-salt-change-in-production'

    return createHash('sha256')
      .update(identifier + salt)
      .digest('hex')
  }

  toPrimitives(): {
    identifierHash: string
    ipAddress: string
    userAgent: string | null
    success: boolean
    userId: number | null
    failureReason: string | null
    deviceId: string | null
    attemptedAt: DateTime
  } {
    return {
      identifierHash: this.identifierHash,
      ipAddress: this.ipAddress.getValue(),
      userAgent: this.userAgent,
      success: this.success,
      userId: this.userId?.getValue() || null,
      failureReason: this.failureReason,
      deviceId: this.deviceId,
      attemptedAt: this.attemptedAt,
    }
  }
}
