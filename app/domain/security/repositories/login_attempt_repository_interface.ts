import { DateTime } from 'luxon'
import { LoginAttempt } from '../value_objects/login_attempt.js'
import { IpAddress } from '../value_objects/ip_address.js'

/**
 * Interface du repository pour les tentatives de login
 */
export interface LoginAttemptRepositoryInterface {
  /**
   * Sauvegarde une tentative de login
   */
  save(attempt: LoginAttempt): Promise<void>

  /**
   * Compte les tentatives par IP depuis une date donnée
   */
  countByIpSince(ipAddress: IpAddress, since: DateTime): Promise<number>

  /**
   * Compte les échecs par identifiant depuis une date donnée
   */
  countFailuresByIdentifierSince(identifierHash: string, since: DateTime): Promise<number>

  /**
   * Récupère les tentatives récentes pour une IP
   */
  findRecentByIp(ipAddress: IpAddress, since: DateTime): Promise<LoginAttempt[]>

  /**
   * Récupère les tentatives récentes pour un identifiant
   */
  findRecentByIdentifier(identifierHash: string, since: DateTime): Promise<LoginAttempt[]>

  /**
   * Nettoie les anciennes tentatives (plus anciennes que la date donnée)
   */
  cleanOldAttempts(before: DateTime): Promise<number>
}
