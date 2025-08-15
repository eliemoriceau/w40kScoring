import { DateTime } from 'luxon'
import AccountLock from '../../../models/account_lock.js'
import { AccountLockRepositoryInterface } from '../../../domain/security/repositories/account_lock_repository_interface.js'
import { UserId } from '../../../domain/user/value_objects/user_id.js'
import { IpAddress } from '../../../domain/security/value_objects/ip_address.js'

/**
 * Implémentation Lucid du repository des verrouillages de comptes
 */
export class LucidAccountLockRepository implements AccountLockRepositoryInterface {
  async lockAccount(
    userId: UserId | null,
    identifierHash: string,
    reason: string,
    lockedUntil: DateTime,
    lockedByIp: IpAddress
  ): Promise<void> {
    await AccountLock.create({
      userId: userId?.getValue() ?? undefined,
      identifierHash,
      lockReason: reason,
      lockedUntil,
      lockedByIp: lockedByIp.getValue(),
    })
  }

  async isLockedByIdentifier(identifierHash: string): Promise<boolean> {
    const now = DateTime.now()

    const activeLock = await AccountLock.query()
      .where('identifier_hash', identifierHash)
      .where('locked_until', '>', now.toJSDate())
      .whereNull('released_at')
      .first()

    return !!activeLock
  }

  async isLockedByUserId(userId: UserId): Promise<boolean> {
    const now = DateTime.now()

    const activeLock = await AccountLock.query()
      .where('user_id', userId.getValue())
      .where('locked_until', '>', now.toJSDate())
      .whereNull('released_at')
      .first()

    return !!activeLock
  }

  async findActiveLockByIdentifier(identifierHash: string): Promise<{
    lockedUntil: DateTime
    reason: string
    remainingSeconds: number
  } | null> {
    const now = DateTime.now()

    const activeLock = await AccountLock.query()
      .where('identifier_hash', identifierHash)
      .where('locked_until', '>', now.toJSDate())
      .whereNull('released_at')
      .orderBy('created_at', 'desc')
      .first()

    if (!activeLock) {
      return null
    }

    const remainingSeconds = activeLock.lockedUntil.diff(now, 'seconds').seconds

    return {
      lockedUntil: activeLock.lockedUntil,
      reason: activeLock.lockReason,
      remainingSeconds: Math.ceil(remainingSeconds),
    }
  }

  async releaseLock(userId: UserId, _reason: string): Promise<void> {
    const now = DateTime.now()

    await AccountLock.query()
      .where('user_id', userId.getValue())
      .where('locked_until', '>', now.toJSDate())
      .whereNull('released_at')
      .update({
        releasedAt: now.toJSDate(),
      })
  }

  async releaseExpiredLocks(): Promise<number> {
    const now = DateTime.now()

    const expiredLocks = await AccountLock.query()
      .where('locked_until', '<=', now.toJSDate())
      .whereNull('released_at')
      .update({
        releasedAt: now.toJSDate(),
      })

    return expiredLocks[0] || 0
  }

  async cleanOldLocks(before: DateTime): Promise<number> {
    const deletedCount = await AccountLock.query()
      .where('created_at', '<', before.toJSDate())
      .whereNotNull('released_at')
      .delete()

    return deletedCount[0] || 0
  }
}
