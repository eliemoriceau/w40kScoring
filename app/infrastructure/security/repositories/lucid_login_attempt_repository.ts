import { DateTime } from 'luxon'
import LoginAttempt from '../../../models/login_attempt.js'
import { LoginAttemptRepositoryInterface } from '../../../domain/security/repositories/login_attempt_repository_interface.js'
import { LoginAttempt as DomainLoginAttempt } from '../../../domain/security/value_objects/login_attempt.js'
import { IpAddress } from '../../../domain/security/value_objects/ip_address.js'
import { UserId } from '../../../domain/user/value_objects/user_id.js'

/**
 * Implémentation Lucid du repository des tentatives de login
 */
export class LucidLoginAttemptRepository implements LoginAttemptRepositoryInterface {
  async save(attempt: DomainLoginAttempt): Promise<void> {
    const primitives = attempt.toPrimitives()

    await LoginAttempt.create({
      identifierHash: primitives.identifierHash,
      ipAddress: primitives.ipAddress,
      success: primitives.success,
      attemptedAt: primitives.attemptedAt,
      userAgent: primitives.userAgent,
      deviceId: primitives.deviceId,
      failureReason: primitives.failureReason,
    })
  }

  async countByIpSince(ipAddress: IpAddress, since: DateTime): Promise<number> {
    const count = await LoginAttempt.query()
      .where('ip_address', ipAddress.getValue())
      .where('attempted_at', '>=', since.toJSDate())
      .count('* as total')

    return Number(count[0].$extras.total)
  }

  async countFailuresByIdentifierSince(identifierHash: string, since: DateTime): Promise<number> {
    const count = await LoginAttempt.query()
      .where('identifier_hash', identifierHash)
      .where('success', false)
      .where('attempted_at', '>=', since.toJSDate())
      .count('* as total')

    return Number(count[0].$extras.total)
  }

  async findRecentByIp(ipAddress: IpAddress, since: DateTime): Promise<DomainLoginAttempt[]> {
    const attempts = await LoginAttempt.query()
      .where('ip_address', ipAddress.getValue())
      .where('attempted_at', '>=', since.toJSDate())
      .orderBy('attempted_at', 'desc')

    return attempts.map((attempt) => this.toDomain(attempt))
  }

  async findRecentByIdentifier(
    identifierHash: string,
    since: DateTime
  ): Promise<DomainLoginAttempt[]> {
    const attempts = await LoginAttempt.query()
      .where('identifier_hash', identifierHash)
      .where('attempted_at', '>=', since.toJSDate())
      .orderBy('attempted_at', 'desc')

    return attempts.map((attempt) => this.toDomain(attempt))
  }

  async cleanOldAttempts(before: DateTime): Promise<number> {
    const result = await LoginAttempt.query().where('attempted_at', '<', before.toJSDate()).delete()

    return result[0] || 0
  }

  /**
   * Convertit un modèle Lucid en objet domaine
   */
  private toDomain(model: LoginAttempt): DomainLoginAttempt {
    return DomainLoginAttempt.reconstitute(
      model.identifierHash,
      IpAddress.create(model.ipAddress),
      model.userAgent,
      model.success,
      model.userId ? UserId.fromNumber(model.userId) : null,
      model.failureReason,
      model.deviceId,
      model.attemptedAt
    )
  }
}
