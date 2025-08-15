import { DateTime } from 'luxon'
import { UserId } from '../../user/value_objects/user_id.js'
import { IpAddress } from '../value_objects/ip_address.js'

/**
 * Interface du repository pour les verrouillages de comptes
 */
export interface AccountLockRepositoryInterface {
  /**
   * Crée un nouveau verrouillage de compte
   */
  lockAccount(
    userId: UserId | null,
    identifierHash: string,
    reason: string,
    lockedUntil: DateTime,
    lockedByIp: IpAddress
  ): Promise<void>

  /**
   * Vérifie si un compte est verrouillé par identifiant
   */
  isLockedByIdentifier(identifierHash: string): Promise<boolean>

  /**
   * Vérifie si un compte est verrouillé par user ID
   */
  isLockedByUserId(userId: UserId): Promise<boolean>

  /**
   * Récupère le verrouillage actif pour un identifiant
   */
  findActiveLockByIdentifier(identifierHash: string): Promise<{
    lockedUntil: DateTime
    reason: string
    remainingSeconds: number
  } | null>

  /**
   * Libère un verrouillage manuellement
   */
  releaseLock(userId: UserId, reason: string): Promise<void>

  /**
   * Libère tous les verrouillages expirés
   */
  releaseExpiredLocks(): Promise<number>

  /**
   * Nettoie les anciens verrouillages (complètement libérés et anciens)
   */
  cleanOldLocks(before: DateTime): Promise<number>
}
